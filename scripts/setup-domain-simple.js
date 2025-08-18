#!/usr/bin/env node

/**
 * Simple domain setup for toledotool.thefortaiagency.com
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// GoDaddy API Credentials
const GODADDY_API_KEY = '9jHwmx1uNpS_KYhM4NMXJez63FjXEcjKhu';
const GODADDY_API_SECRET = 'QYDxHfEyfpLCeJsS8r3CzU';

// Domain details
const DOMAIN = 'thefortaiagency.com';
const SUBDOMAIN = 'toledotool';
const FULL_DOMAIN = `${SUBDOMAIN}.${DOMAIN}`;
const VERCEL_CNAME = 'cname.vercel-dns.com';

async function makeGoDaddyRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`https://api.godaddy.com/v1${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GoDaddy API Error ${response.status}: ${errorText}`);
  }

  return response.status === 204 ? null : response.json();
}

async function setupDomain() {
  console.log('🚀 Setting up toledotool.thefortaiagency.com DNS\n');

  try {
    // 1. Check if CNAME record exists
    console.log('📋 Checking existing DNS records...');
    let recordExists = false;
    
    try {
      const existingRecords = await makeGoDaddyRequest(`/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}`);
      if (existingRecords && existingRecords.length > 0) {
        recordExists = true;
        console.log(`Found existing CNAME: ${SUBDOMAIN}.${DOMAIN} → ${existingRecords[0].data}`);
      }
    } catch (error) {
      console.log('No existing CNAME record found');
    }

    // 2. Create or update CNAME record
    console.log('\n🌐 Configuring DNS record...');
    
    if (recordExists) {
      // Update existing record
      await makeGoDaddyRequest(
        `/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}`,
        'PUT',
        [{
          data: VERCEL_CNAME,
          ttl: 600
        }]
      );
      console.log('✅ Updated existing CNAME record');
    } else {
      // Create new record
      await makeGoDaddyRequest(
        `/domains/${DOMAIN}/records`,
        'PATCH',
        [{
          type: 'CNAME',
          name: SUBDOMAIN,
          data: VERCEL_CNAME,
          ttl: 600
        }]
      );
      console.log('✅ Created new CNAME record');
    }

    // 3. Verify configuration
    console.log('\n🔍 Verifying DNS configuration...');
    const verifyRecords = await makeGoDaddyRequest(`/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}`);
    
    if (verifyRecords && verifyRecords.length > 0) {
      console.log('✅ DNS Configuration Verified:');
      console.log(`   ${SUBDOMAIN}.${DOMAIN} → ${verifyRecords[0].data}`);
      console.log(`   TTL: ${verifyRecords[0].ttl} seconds`);
    }

    // 4. Display next steps
    console.log('\n✨ DNS Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Domain: https://${FULL_DOMAIN}`);
    console.log(`📍 CNAME Target: ${VERCEL_CNAME}`);
    console.log('\n📋 Next Steps:');
    console.log('1. Run: vercel domains add toledotool.thefortaiagency.com');
    console.log('2. Deploy: vercel --prod');
    console.log('3. DNS propagation takes 5-30 minutes');
    console.log('4. SSL certificate will be auto-provisioned by Vercel');
    
    console.log('\n💡 Manual Vercel Commands:');
    console.log('   vercel domains add toledotool.thefortaiagency.com');
    console.log('   vercel --prod');
    console.log('   vercel domains ls  # To verify');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDomain();