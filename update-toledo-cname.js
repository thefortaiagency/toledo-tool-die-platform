#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GODADDY_API_KEY = '9jHwmx1uNpS_KYhM4NMXJez63FjXEcjKhu';
const GODADDY_API_SECRET = 'QYDxHfEyfpLCeJsS8r3CzU';

async function updateCNAME() {
  console.log('🔧 Updating CNAME for toledotool.thefortaiagency.ai\n');
  
  const domain = 'thefortaiagency.ai';
  const subdomain = 'toledotool';
  const newCname = '51069e085498d924.vercel-dns-016.com';
  
  try {
    // First, get all records
    const getResponse = await fetch(
      `https://api.godaddy.com/v1/domains/${domain}/records`,
      {
        headers: {
          'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get records: ${await getResponse.text()}`);
    }
    
    const allRecords = await getResponse.json();
    console.log(`Found ${allRecords.length} total DNS records\n`);
    
    // Filter out the old CNAME for toledotool
    const filteredRecords = allRecords.filter(record => 
      !(record.type === 'CNAME' && record.name === subdomain)
    );
    
    // Add the new CNAME
    filteredRecords.push({
      type: 'CNAME',
      name: subdomain,
      data: newCname,
      ttl: 600
    });
    
    console.log(`Updating CNAME from old Vercel to: ${newCname}\n`);
    
    // Update all records (GoDaddy requires full replacement)
    const updateResponse = await fetch(
      `https://api.godaddy.com/v1/domains/${domain}/records`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filteredRecords)
      }
    );
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update records: ${await updateResponse.text()}`);
    }
    
    console.log('✅ CNAME updated successfully!');
    console.log('\nVerification:');
    console.log(`  TXT record: _vercel.thefortaiagency.ai`);
    console.log(`  CNAME: toledotool.thefortaiagency.ai → ${newCname}`);
    console.log('\nNext steps:');
    console.log('1. Wait 5-15 minutes for DNS propagation');
    console.log('2. Run: vercel domains add toledotool.thefortaiagency.ai');
    console.log('3. Site will be live at: https://toledotool.thefortaiagency.ai');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateCNAME();