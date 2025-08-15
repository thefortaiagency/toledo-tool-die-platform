#!/usr/bin/env node

/**
 * Toledo Tool & Die DNS Setup
 * Domain: toledotool.thefortaiagency.ai
 */

const https = require('https');

// GoDaddy API Configuration
const GODADDY_API_KEY = '9jHwmx1uNpS_KYhM4NMXJez63FjXEcjKhu';
const GODADDY_API_SECRET = 'QYDxHfEyfpLCeJsS8r3CzU';

// Domain configuration
const DOMAIN = 'thefortaiagency.ai';
const SUBDOMAIN = 'toledotool';
const VERCEL_IP = '76.76.21.21';

async function makeGoDaddyRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.godaddy.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          try {
            resolve(responseData ? JSON.parse(responseData) : null);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`GoDaddy API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function setupToledoDNS() {
  console.log('🏭 Toledo Tool & Die DNS Configuration');
  console.log('=====================================');
  console.log(`\n📍 Setting up: ${SUBDOMAIN}.${DOMAIN}`);
  console.log(`🎯 Pointing to Vercel: ${VERCEL_IP}\n`);

  try {
    // Check if domain exists
    console.log('🔍 Checking domain availability...');
    const domainInfo = await makeGoDaddyRequest(`/domains/${DOMAIN}`);
    console.log(`✅ Domain ${DOMAIN} is active\n`);

    // Get existing DNS records
    console.log('📋 Fetching existing DNS records...');
    const records = await makeGoDaddyRequest(`/domains/${DOMAIN}/records`);
    
    // Check if subdomain already exists
    const existingRecord = records.find(r => 
      r.type === 'A' && r.name === SUBDOMAIN
    );

    const recordData = [{
      type: 'A',
      name: SUBDOMAIN,
      data: VERCEL_IP,
      ttl: 600
    }];

    if (existingRecord) {
      console.log(`⚠️  Subdomain ${SUBDOMAIN} already exists`);
      console.log(`   Current IP: ${existingRecord.data}`);
      console.log(`   Updating to: ${VERCEL_IP}\n`);
      
      // Update existing record
      await makeGoDaddyRequest(
        `/domains/${DOMAIN}/records/A/${SUBDOMAIN}`,
        'PUT',
        recordData
      );
    } else {
      console.log(`➕ Creating new A record for ${SUBDOMAIN}...\n`);
      
      // Create new record
      await makeGoDaddyRequest(
        `/domains/${DOMAIN}/records`,
        'PATCH',
        recordData
      );
    }

    console.log('✅ DNS Configuration Complete!');
    console.log('================================\n');
    console.log('🌐 Toledo Tool & Die Platform URLs:');
    console.log(`   Production: https://${SUBDOMAIN}.${DOMAIN}`);
    console.log('   Vercel: https://toledo-tool-die-platform.vercel.app');
    console.log('   GitHub: https://github.com/thefortaiagency/toledo-tool-die-platform\n');
    console.log('⏱️  DNS propagation may take 5-30 minutes');
    console.log('📊 Platform Features:');
    console.log('   • Real-time production metrics');
    console.log('   • 1,135 imported production records');
    console.log('   • AI-powered insights');
    console.log('   • Supabase integration');
    
  } catch (error) {
    console.error('❌ Error configuring DNS:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupToledoDNS();