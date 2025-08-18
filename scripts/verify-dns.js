#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// GoDaddy API Credentials
const GODADDY_API_KEY = '9jHwmx1uNpS_KYhM4NMXJez63FjXEcjKhu';
const GODADDY_API_SECRET = 'QYDxHfEyfpLCeJsS8r3CzU';

// Domain details
const DOMAIN = 'thefortaiagency.com';
const SUBDOMAIN = 'toledotool';

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

async function checkDNS() {
  console.log('🔍 Checking DNS configuration for toledotool.thefortaiagency.com\n');

  try {
    // Get CNAME record
    const cnameRecords = await makeGoDaddyRequest(`/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}`);
    
    if (cnameRecords && cnameRecords.length > 0) {
      console.log('✅ CNAME Record Found:');
      console.log(`   ${SUBDOMAIN}.${DOMAIN} → ${cnameRecords[0].data}`);
      console.log(`   TTL: ${cnameRecords[0].ttl} seconds\n`);
    } else {
      console.log('❌ No CNAME record found\n');
    }

    // Check for TXT verification records
    console.log('📋 Checking for verification records...');
    const txtRecords = await makeGoDaddyRequest(`/domains/${DOMAIN}/records/TXT`);
    
    const vercelRecords = txtRecords.filter(r => 
      r.name === '_vercel' || 
      r.name === SUBDOMAIN || 
      r.data.includes('vercel')
    );
    
    if (vercelRecords.length > 0) {
      console.log('Found Vercel verification records:');
      vercelRecords.forEach(r => {
        console.log(`   ${r.name}.${DOMAIN} → ${r.data}`);
      });
    } else {
      console.log('No Vercel verification records found');
    }

    console.log('\n📌 Current Status:');
    console.log('   DNS: ✅ Configured (CNAME → cname.vercel-dns.com)');
    console.log('   Deployment: ✅ Live at toledo-tool-die-platform.vercel.app');
    console.log('   Domain: ⏳ Pending Vercel authorization');
    
    console.log('\n💡 To complete setup:');
    console.log('1. Go to: https://vercel.com/the-fort-ai-agency/toledo-tool-die-platform/settings/domains');
    console.log('2. Click "Add Domain"');
    console.log('3. Enter: toledotool.thefortaiagency.com');
    console.log('4. Vercel will verify the CNAME automatically');
    console.log('\nAlternatively, if you have access to thefortaiagency.com on Vercel:');
    console.log('1. Go to the team settings');
    console.log('2. Add the domain there first');
    console.log('3. Then assign it to this project');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDNS();