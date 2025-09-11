#!/usr/bin/env node

/**
 * Simple test script to verify email digest endpoint functionality
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
}

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in environment');
  process.exit(1);
}

console.log('🧪 Testing email digest endpoint...');
console.log(`📍 URL: ${BASE_URL}/api/cron/email-digest`);
console.log(`🔐 Using CRON_SECRET: ${CRON_SECRET.substring(0, 10)}...`);

// Make request to email digest endpoint
const url = new URL(`${BASE_URL}/api/cron/email-digest`);
const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
};

const request = (url.protocol === 'https:' ? https : require('http')).request(url, options, (response) => {
  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    console.log('\n📊 Response Status:', response.statusCode);
    console.log('🗂️ Response Headers:', response.headers);
    console.log('📄 Response Body:');
    
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.log(data);
    }
    
    if (response.statusCode === 200) {
      console.log('\n✅ Email digest endpoint test passed!');
    } else {
      console.log('\n❌ Email digest endpoint test failed');
      process.exit(1);
    }
  });
});

request.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

request.end();