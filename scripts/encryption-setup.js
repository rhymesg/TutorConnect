#!/usr/bin/env node

/**
 * Encryption setup and management CLI for TutorConnect
 * Handles key generation, rotation, and migration operations
 */

const { createHash, randomBytes } = require('crypto');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const readline = require('readline');

// ANSI colors for CLI output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class EncryptionSetupCLI {
  constructor() {
    this.envPath = join(process.cwd(), '.env.local');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Main CLI entry point
   */
  async run() {
    const command = process.argv[2];
    
    console.log(`${colors.cyan}${colors.bold}TutorConnect Encryption Setup${colors.reset}\n`);

    try {
      switch (command) {
        case 'generate-key':
          await this.generateKey();
          break;
        case 'validate-key':
          await this.validateKey();
          break;
        case 'setup':
          await this.initialSetup();
          break;
        case 'rotate':
          await this.rotateKey();
          break;
        case 'status':
          await this.showStatus();
          break;
        case 'migrate':
          await this.migrateData();
          break;
        case 'cleanup':
          await this.cleanup();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`${colors.bold}Available commands:${colors.reset}
    
  ${colors.green}setup${colors.reset}          - Initial encryption setup with key generation
  ${colors.green}generate-key${colors.reset}   - Generate a new encryption key
  ${colors.green}validate-key${colors.reset}   - Validate current encryption key
  ${colors.green}status${colors.reset}         - Show encryption status and key information
  ${colors.green}rotate${colors.reset}         - Rotate encryption keys (requires database)
  ${colors.green}migrate${colors.reset}        - Migrate existing data to encrypted format
  ${colors.green}cleanup${colors.reset}        - Clean up old keys and temporary data

${colors.bold}Examples:${colors.reset}
  node scripts/encryption-setup.js setup
  node scripts/encryption-setup.js generate-key
  node scripts/encryption-setup.js status
`);
  }

  /**
   * Initial encryption setup
   */
  async initialSetup() {
    console.log(`${colors.yellow}Starting initial encryption setup...${colors.reset}\n`);

    // Check if already configured
    if (this.hasExistingKey()) {
      const overwrite = await this.askQuestion(
        `${colors.yellow}Encryption key already exists. Overwrite? (y/N): ${colors.reset}`
      );
      if (!overwrite.toLowerCase().startsWith('y')) {
        console.log('Setup cancelled.');
        return;
      }
    }

    // Generate new key
    const key = this.generateEncryptionKey();
    
    console.log(`${colors.green}✓ Generated new encryption key${colors.reset}`);

    // Save to environment
    await this.saveKeyToEnv(key);
    
    console.log(`${colors.green}✓ Saved encryption key to .env.local${colors.reset}`);

    // Show security recommendations
    this.showSecurityRecommendations();

    console.log(`\n${colors.green}${colors.bold}Setup completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}Remember to restart your development server.${colors.reset}`);
  }

  /**
   * Generate a new encryption key
   */
  async generateKey() {
    const key = this.generateEncryptionKey();
    
    console.log(`${colors.bold}Generated encryption key:${colors.reset}`);
    console.log(`${colors.cyan}${key}${colors.reset}\n`);
    
    const validation = this.validateKeyStrength(key);
    console.log(`${colors.bold}Key validation:${colors.reset}`);
    console.log(`Strength: ${this.getStrengthColor(validation.strength)}${validation.strength}${colors.reset}`);
    console.log(`Length: ${key.length} characters`);
    console.log(`Entropy: ${this.calculateEntropy(Buffer.from(key, 'base64')).toFixed(2)} bits/byte\n`);

    const save = await this.askQuestion(`${colors.yellow}Save to .env.local? (y/N): ${colors.reset}`);
    if (save.toLowerCase().startsWith('y')) {
      await this.saveKeyToEnv(key);
      console.log(`${colors.green}✓ Key saved to .env.local${colors.reset}`);
    }
  }

  /**
   * Validate existing encryption key
   */
  async validateKey() {
    const key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable not set');
    }

    console.log(`${colors.bold}Validating encryption key...${colors.reset}\n`);

    const validation = this.validateKeyStrength(key);
    
    console.log(`${colors.bold}Validation results:${colors.reset}`);
    console.log(`Status: ${validation.isValid ? colors.green + '✓ Valid' : colors.red + '✗ Invalid'}${colors.reset}`);
    console.log(`Strength: ${this.getStrengthColor(validation.strength)}${validation.strength}${colors.reset}`);
    console.log(`Length: ${key.length} characters`);
    
    if (validation.issues.length > 0) {
      console.log(`${colors.red}Issues found:${colors.reset}`);
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }

    // Calculate entropy
    try {
      const keyBytes = Buffer.from(key, 'base64');
      const entropy = this.calculateEntropy(keyBytes);
      console.log(`Entropy: ${entropy.toFixed(2)} bits/byte`);
    } catch (error) {
      console.log(`${colors.red}Could not calculate entropy (invalid base64)${colors.reset}`);
    }

    if (!validation.isValid) {
      console.log(`\n${colors.yellow}Consider generating a new key with:${colors.reset}`);
      console.log(`node scripts/encryption-setup.js generate-key`);
    }
  }

  /**
   * Show encryption status
   */
  async showStatus() {
    console.log(`${colors.bold}Encryption Status${colors.reset}\n`);

    // Check key configuration
    const key = process.env.ENCRYPTION_KEY;
    const previousKey = process.env.ENCRYPTION_KEY_PREVIOUS;

    console.log(`${colors.bold}Key Configuration:${colors.reset}`);
    console.log(`Primary key: ${key ? colors.green + 'Set' : colors.red + 'Not set'}${colors.reset}`);
    console.log(`Previous key: ${previousKey ? colors.yellow + 'Set (rotation in progress?)' : colors.green + 'None'}${colors.reset}`);

    if (key) {
      const validation = this.validateKeyStrength(key);
      console.log(`Key strength: ${this.getStrengthColor(validation.strength)}${validation.strength}${colors.reset}`);
      
      // Calculate key age (simplified)
      console.log(`Key ID: ${this.generateKeyId(key)}`);
    }

    // Check environment setup
    console.log(`\n${colors.bold}Environment:${colors.reset}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`Database: ${process.env.DATABASE_URL ? colors.green + 'Configured' : colors.red + 'Not configured'}${colors.reset}`);
    console.log(`Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? colors.green + 'Configured' : colors.red + 'Not configured'}${colors.reset}`);

    // Show algorithm info
    console.log(`\n${colors.bold}Encryption Settings:${colors.reset}`);
    console.log(`Algorithm: AES-256-GCM`);
    console.log(`Key derivation: PBKDF2 (${process.env.NODE_ENV === 'production' ? '100,000' : '10,000'} iterations)`);
    console.log(`IV length: 128 bits`);
    console.log(`Tag length: 128 bits`);

    // Show recommendations
    if (!key) {
      console.log(`\n${colors.yellow}⚠ Run initial setup:${colors.reset} node scripts/encryption-setup.js setup`);
    } else if (!this.validateKeyStrength(key).isValid) {
      console.log(`\n${colors.yellow}⚠ Key validation failed. Consider regenerating.${colors.reset}`);
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateKey() {
    console.log(`${colors.yellow}${colors.bold}Key Rotation Process${colors.reset}\n`);
    
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      throw new Error('No current encryption key found. Run setup first.');
    }

    console.log(`${colors.red}WARNING: This will rotate the encryption key and re-encrypt all data.${colors.reset}`);
    console.log(`${colors.red}Make sure you have a backup of your database before proceeding.${colors.reset}\n`);

    const confirm = await this.askQuestion(`${colors.yellow}Proceed with key rotation? (yes/no): ${colors.reset}`);
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Key rotation cancelled.');
      return;
    }

    // Generate new key
    const newKey = this.generateEncryptionKey();
    console.log(`${colors.green}✓ Generated new key${colors.reset}`);

    // In a real implementation, this would:
    // 1. Import and use the keyManager
    // 2. Perform the actual rotation
    // 3. Update environment variables
    
    console.log(`\n${colors.yellow}Manual steps required:${colors.reset}`);
    console.log('1. Set ENCRYPTION_KEY_PREVIOUS=' + currentKey);
    console.log('2. Set ENCRYPTION_KEY=' + newKey);
    console.log('3. Restart application');
    console.log('4. Run data migration');
    console.log(`\n${colors.cyan}For automated rotation, use the key management API in production.${colors.reset}`);
  }

  /**
   * Migrate existing data to encrypted format
   */
  async migrateData() {
    console.log(`${colors.yellow}Data Migration Utility${colors.reset}\n`);
    
    console.log(`${colors.cyan}This would migrate existing plaintext data to encrypted format.${colors.reset}`);
    console.log(`${colors.cyan}In production, this uses the EncryptedOperations.migrateToEncryptedData method.${colors.reset}\n`);
    
    const models = ['user', 'message', 'document'];
    const fields = {
      user: ['phoneNumber', 'nationalIdNumber'],
      message: ['content'],
      document: ['documentContent']
    };

    console.log(`${colors.bold}Fields to encrypt:${colors.reset}`);
    models.forEach(model => {
      console.log(`  ${model}: ${fields[model].join(', ')}`);
    });

    console.log(`\n${colors.yellow}Run this in production environment with proper database access.${colors.reset}`);
  }

  /**
   * Cleanup old keys and data
   */
  async cleanup() {
    console.log(`${colors.yellow}Cleanup Utility${colors.reset}\n`);
    
    const previousKey = process.env.ENCRYPTION_KEY_PREVIOUS;
    
    if (previousKey) {
      console.log(`${colors.yellow}Previous key found in environment.${colors.reset}`);
      const remove = await this.askQuestion(`${colors.yellow}Remove ENCRYPTION_KEY_PREVIOUS? (y/N): ${colors.reset}`);
      
      if (remove.toLowerCase().startsWith('y')) {
        await this.removeKeyFromEnv('ENCRYPTION_KEY_PREVIOUS');
        console.log(`${colors.green}✓ Removed ENCRYPTION_KEY_PREVIOUS from .env.local${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}No previous key found. Environment is clean.${colors.reset}`);
    }

    console.log(`\n${colors.cyan}For production cleanup, use the key management service.${colors.reset}`);
  }

  // Helper methods

  /**
   * Generate secure encryption key
   */
  generateEncryptionKey() {
    const keyBytes = randomBytes(32);
    
    // Ensure high entropy
    const entropy = this.calculateEntropy(keyBytes);
    if (entropy < 7.5) {
      return this.generateEncryptionKey(); // Regenerate if entropy is too low
    }

    return keyBytes.toString('base64');
  }

  /**
   * Validate key strength
   */
  validateKeyStrength(key) {
    const issues = [];
    let strength = 'strong';

    // Check minimum length
    if (key.length < 32) {
      issues.push(`Key too short (minimum 32 characters)`);
      strength = 'weak';
    }

    // Check for base64 format
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(key)) {
      issues.push('Key must be valid base64 encoded');
      strength = 'weak';
    }

    // Check entropy
    try {
      const keyBytes = Buffer.from(key, 'base64');
      const entropy = this.calculateEntropy(keyBytes);
      
      if (entropy < 6.0) {
        issues.push('Key has insufficient entropy');
        strength = 'weak';
      } else if (entropy < 7.0) {
        strength = 'medium';
      }
    } catch (error) {
      issues.push('Invalid key format');
      strength = 'weak';
    }

    return {
      isValid: issues.length === 0,
      strength,
      issues
    };
  }

  /**
   * Calculate Shannon entropy
   */
  calculateEntropy(data) {
    const frequency = new Array(256).fill(0);
    
    for (const byte of data) {
      frequency[byte]++;
    }

    let entropy = 0;
    const length = data.length;

    for (const freq of frequency) {
      if (freq > 0) {
        const p = freq / length;
        entropy -= p * Math.log2(p);
      }
    }

    return entropy;
  }

  /**
   * Generate deterministic key ID
   */
  generateKeyId(key) {
    return createHash('sha256')
      .update(key)
      .update('KEY_ID')
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Check if encryption key already exists
   */
  hasExistingKey() {
    return process.env.ENCRYPTION_KEY || this.getEnvValue('ENCRYPTION_KEY');
  }

  /**
   * Get environment variable from .env.local file
   */
  getEnvValue(key) {
    if (!existsSync(this.envPath)) {
      return null;
    }

    const envContent = readFileSync(this.envPath, 'utf8');
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].replace(/^["']|["']$/g, '') : null;
  }

  /**
   * Save key to .env.local
   */
  async saveKeyToEnv(key, keyName = 'ENCRYPTION_KEY') {
    let envContent = '';
    
    if (existsSync(this.envPath)) {
      envContent = readFileSync(this.envPath, 'utf8');
    }

    // Remove existing key
    const regex = new RegExp(`^${keyName}=.*$`, 'gm');
    envContent = envContent.replace(regex, '');

    // Add new key
    envContent = envContent.trim();
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `${keyName}=${key}\n`;

    writeFileSync(this.envPath, envContent);
  }

  /**
   * Remove key from .env.local
   */
  async removeKeyFromEnv(keyName) {
    if (!existsSync(this.envPath)) {
      return;
    }

    let envContent = readFileSync(this.envPath, 'utf8');
    const regex = new RegExp(`^${keyName}=.*$`, 'gm');
    envContent = envContent.replace(regex, '');
    
    // Clean up empty lines
    envContent = envContent.replace(/\n\n+/g, '\n').trim();
    if (envContent) {
      envContent += '\n';
    }

    writeFileSync(this.envPath, envContent);
  }

  /**
   * Get color for strength indicator
   */
  getStrengthColor(strength) {
    switch (strength) {
      case 'weak': return colors.red;
      case 'medium': return colors.yellow;
      case 'strong': return colors.green;
      default: return colors.reset;
    }
  }

  /**
   * Show security recommendations
   */
  showSecurityRecommendations() {
    console.log(`\n${colors.bold}Security Recommendations:${colors.reset}`);
    console.log(`${colors.green}✓${colors.reset} Store backup of encryption key in secure location`);
    console.log(`${colors.green}✓${colors.reset} Use different keys for production and development`);
    console.log(`${colors.green}✓${colors.reset} Implement regular key rotation (every 90 days)`);
    console.log(`${colors.green}✓${colors.reset} Monitor encryption operations for anomalies`);
    console.log(`${colors.green}✓${colors.reset} Use environment variables, never hardcode keys`);
    console.log(`${colors.yellow}⚠${colors.reset} Add .env.local to .gitignore to prevent key exposure`);
  }

  /**
   * Ask user a question
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new EncryptionSetupCLI();
  cli.run().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = EncryptionSetupCLI;