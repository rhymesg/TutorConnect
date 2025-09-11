#!/usr/bin/env node

/**
 * Manual test script for email digest cron job
 * Run with: node test-cron.js
 */

const CRON_SECRET = process.env.CRON_SECRET || '33544a36bf36d9cc1ce188c051abd4326fab79995fe92f1a6a13d013d';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testCron() {
  console.log('Testing cron job at:', new Date().toISOString());
  console.log('API URL:', API_URL);
  console.log('Using CRON_SECRET:', CRON_SECRET ? 'Set' : 'Not set');
  
  try {
    const response = await fetch(`${API_URL}/api/cron/email-digest`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Cron job executed successfully!');
    } else {
      console.log('❌ Cron job failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to call cron endpoint:', error);
  }
}

// Run the test
testCron();