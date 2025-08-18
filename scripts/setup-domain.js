#!/usr/bin/env node

/**
 * Create toledotool.thefortaiagency.com subdomain and configure with Vercel
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { execSync } = require('child_process');

// GoDaddy API Credentials
const GODADDY_API_KEY = '9jHwmx1uNpS_KYhM4NMXJez63FjXEcjKhu';
const GODADDY_API_SECRET = 'QYDxHfEyfpLCeJsS8r3CzU';

// Domain and subdomain details
const DOMAIN = 'thefortaiagency.com';
const SUBDOMAIN = 'toledotool';
const FULL_DOMAIN = `${SUBDOMAIN}.${DOMAIN}`;

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

async function getVercelProject() {
  // For now, just return the project name
  // Vercel will auto-detect from the current directory
  return 'toledo-tool-die-platform';
}

async function setupDomain() {
  console.log('🚀 Setting up toledotool.thefortaiagency.com\n');

  try {
    // 1. Get Vercel project name
    const projectName = await getVercelProject();
    
    // 2. Add domain to Vercel
    console.log(`\n🔗 Adding ${FULL_DOMAIN} to Vercel project...`);
    try {
      execSync(`vercel domains add ${FULL_DOMAIN}`, { 
        stdio: 'inherit',
        encoding: 'utf-8' 
      });
      console.log('✅ Domain added to Vercel successfully');
    } catch (vercelError) {
      if (vercelError.toString().includes('already exists')) {
        console.log('ℹ️  Domain already exists in Vercel');
      } else {
        console.log('⚠️  Could not add domain to Vercel automatically');
        console.log('Please run manually: vercel domains add ' + FULL_DOMAIN);
      }
    }

    // 3. Get Vercel's CNAME target
    console.log('\n📋 Getting Vercel CNAME target...');
    let vercelTarget = 'cname.vercel-dns.com';
    
    // Use the standard Vercel CNAME target
    console.log('Using standard Vercel CNAME target');

    // 4. Create CNAME record in GoDaddy
    console.log('\n🌐 Creating DNS record in GoDaddy...');
    
    // First, check if record exists
    const existingRecords = await makeGoDaddyRequest(`/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}`);
    
    if (existingRecords && existingRecords.length > 0) {
      console.log('Record exists, updating...');
      // Update existing record
      await makeGoDaddyRequest(
        `/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}`,
        'PUT',
        [{
          data: vercelTarget,
          ttl: 600
        }]
      );
    } else {
      console.log('Creating new CNAME record...');
      // Create new record
      await makeGoDaddyRequest(
        `/domains/${DOMAIN}/records`,
        'PATCH',
        [{
          type: 'CNAME',
          name: SUBDOMAIN,
          data: vercelTarget,
          ttl: 600
        }]
      );
    }
    
    console.log('✅ DNS record configured successfully');

    // 5. Verify DNS configuration
    console.log('\n🔍 Verifying DNS configuration...');
    const records = await makeGoDaddyRequest(`/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}`);
    
    if (records && records.length > 0) {
      console.log(`✅ CNAME record confirmed:`);
      console.log(`   ${SUBDOMAIN}.${DOMAIN} → ${records[0].data}`);
    }

    // 6. Deploy to Vercel
    console.log('\n🚀 Deploying to Vercel...');
    try {
      const deployResult = execSync('vercel --prod', { encoding: 'utf-8' });
      console.log('✅ Deployment initiated');
      
      // Extract deployment URL
      const urlMatch = deployResult.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        console.log(`📌 Deployment URL: ${urlMatch[0]}`);
      }
    } catch (deployError) {
      console.log('⚠️  Could not deploy automatically');
      console.log('Please run: vercel --prod');
    }

    // Final instructions
    console.log('\n✨ Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Domain: https://${FULL_DOMAIN}`);
    console.log('⏱️  DNS propagation may take 5-30 minutes');
    console.log('\n📋 Next Steps:');
    console.log('1. Wait for DNS propagation (5-30 minutes)');
    console.log(`2. Visit https://${FULL_DOMAIN} to test`);
    console.log('3. SSL certificate will be automatically provisioned by Vercel');
    
    // Check current deployment status
    console.log('\n📊 Current Status:');
    console.log(`   Domain: ${FULL_DOMAIN}`);
    console.log(`   CNAME: ${vercelTarget}`);
    console.log(`   Project: ${projectName}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDomain();