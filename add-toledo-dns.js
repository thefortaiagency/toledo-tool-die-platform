#!/usr/bin/env node

/**
 * Add DNS records for toledotool.thefortaiagency.ai
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// GoDaddy API credentials - you'll need to set these
const GODADDY_API_KEY = process.env.GODADDY_API_KEY || '';
const GODADDY_API_SECRET = process.env.GODADDY_API_SECRET || '';

if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
  console.error('❌ GoDaddy API credentials not found!');
  console.log('\nTo set up GoDaddy API access:');
  console.log('1. Go to: https://developer.godaddy.com/keys');
  console.log('2. Create a production API key');
  console.log('3. Set environment variables:');
  console.log('   export GODADDY_API_KEY="your_key"');
  console.log('   export GODADDY_API_SECRET="your_secret"');
  console.log('\nOr create ~/.godaddy/credentials.json with:');
  console.log('   {"key": "your_key", "secret": "your_secret"}');
  process.exit(1);
}

const DOMAIN = 'thefortaiagency.ai';
const SUBDOMAIN = 'toledotool';

// DNS records to add
const DNS_RECORDS = [
  {
    type: 'TXT',
    name: '_vercel',
    data: 'vc-domain-verify=toledotool.thefortaiagency.ai,875856d529df9573eae4',
    ttl: 600
  },
  {
    type: 'CNAME',
    name: 'toledotool',
    data: '51069e085498d924.vercel-dns-016.com',
    ttl: 600
  }
];

class GoDaddyDNS {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://api.godaddy.com/v1';
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `sso-key ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GoDaddy API Error ${response.status}: ${errorText}`);
    }

    return response.status === 204 ? null : response.json();
  }

  async getDNSRecords(domain, type, name) {
    console.log(`🔍 Checking existing ${type} record for ${name}.${domain}...`);
    try {
      const records = await this.makeRequest(`/domains/${domain}/records/${type}/${name}`);
      return records;
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`  ➡️ No existing ${type} record found for ${name}`);
        return null;
      }
      throw error;
    }
  }

  async addOrUpdateDNSRecord(domain, record) {
    const { type, name, data, ttl } = record;
    
    console.log(`\n📝 Processing ${type} record for ${name === '@' ? domain : name + '.' + domain}`);
    console.log(`  Value: ${data}`);
    
    try {
      if (type === 'TXT' && name === '_vercel') {
        // For TXT records, we need to ADD to existing records, not replace
        console.log(`  ➕ Adding new ${type} record (keeping existing ones)...`);
        
        // Get all existing records first
        const allRecords = await this.makeRequest(`/domains/${domain}/records`);
        const txtRecords = allRecords.filter(r => r.type === 'TXT' && r.name === '_vercel');
        
        // Check if this exact record already exists
        const recordExists = txtRecords.some(r => r.data === data);
        
        if (recordExists) {
          console.log(`  ✅ ${type} record already exists, skipping...`);
        } else {
          // Add the new record using PATCH
          await this.makeRequest(
            `/domains/${domain}/records`,
            'PATCH',
            [{ type, name, data, ttl }]
          );
          console.log(`  ✅ ${type} record added successfully!`);
        }
      } else if (type === 'CNAME') {
        // For CNAME, we replace the existing one
        const existing = await this.getDNSRecords(domain, type, name);
        
        if (existing && existing.length > 0) {
          console.log(`  ✏️ Updating existing ${type} record...`);
          await this.makeRequest(
            `/domains/${domain}/records/${type}/${name}`,
            'PUT',
            [{ data, ttl }]
          );
          console.log(`  ✅ ${type} record updated successfully!`);
        } else {
          console.log(`  ➕ Adding new ${type} record...`);
          await this.makeRequest(
            `/domains/${domain}/records`,
            'PATCH',
            [{ type, name, data, ttl }]
          );
          console.log(`  ✅ ${type} record added successfully!`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to add/update ${type} record:`, error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 Toledo Tool & Die DNS Configuration');
  console.log('=====================================\n');
  console.log(`Domain: ${SUBDOMAIN}.${DOMAIN}`);
  console.log(`Target: Vercel Pro Account\n`);

  const dns = new GoDaddyDNS(GODADDY_API_KEY, GODADDY_API_SECRET);

  try {
    // Add each DNS record
    for (const record of DNS_RECORDS) {
      await dns.addOrUpdateDNSRecord(DOMAIN, record);
    }

    console.log('\n✨ DNS Configuration Complete!');
    console.log('=================================\n');
    console.log('Next steps:');
    console.log('1. Wait 5-15 minutes for DNS propagation');
    console.log('2. Check propagation: https://dnschecker.org/#CNAME/toledotool.thefortaiagency.ai');
    console.log('3. Verify in Vercel dashboard: https://vercel.com/the-fort-ai/toledo-tool-die-platform/settings/domains');
    console.log('4. Site will be accessible at: https://toledotool.thefortaiagency.ai');
    
  } catch (error) {
    console.error('\n❌ DNS configuration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GoDaddyDNS, DNS_RECORDS };