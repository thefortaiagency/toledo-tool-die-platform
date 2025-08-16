# Domain Ownership Verification for toledotool.thefortaiagency.ai

## Steps to Verify Domain Ownership

### 1. Get the Verification TXT Record from Vercel Dashboard

1. Go to: https://vercel.com/the-fort-ai/toledo-tool-die-platform/settings/domains
2. Click "Add Domain"
3. Enter: `toledotool.thefortaiagency.ai`
4. When it says the domain is linked to another account, it will show a TXT record value
5. Copy the TXT verification value (it will look something like: `vc-domain-verify=XXXXXXXXXXXXXX`)

### 2. Add TXT Record in GoDaddy

1. Login to GoDaddy: https://dcc.godaddy.com/domains
2. Find `thefortaiagency.ai` domain
3. Click "DNS" or "Manage DNS"
4. Add a new TXT record:
   - **Type**: TXT
   - **Host**: `_vercel`
   - **Value**: [Paste the verification value from Vercel]
   - **TTL**: 600 seconds

### 3. Wait for DNS Propagation
- Usually takes 5-15 minutes
- Check propagation: https://dnschecker.org/#TXT/_vercel.thefortaiagency.ai

### 4. Complete Verification in Vercel
1. Go back to Vercel dashboard
2. Click "Verify" or try adding the domain again
3. Once verified, Vercel will accept the domain

### 5. Add CNAME Record for the Subdomain
After verification, add the actual subdomain record in GoDaddy:
- **Type**: CNAME
- **Host**: `toledotool`
- **Points to**: `cname.vercel-dns.com`
- **TTL**: 600 seconds

### 6. Remove TXT Record (Optional)
After successful verification, you can remove the TXT record from GoDaddy as it's no longer needed.

## Alternative: Use Vercel Dashboard

If the CLI isn't working, you can do everything through the Vercel web interface:

1. Go to: https://vercel.com/the-fort-ai/toledo-tool-die-platform/settings/domains
2. Click "Add Domain"
3. Enter `toledotool.thefortaiagency.ai`
4. Follow the on-screen instructions for verification
5. Vercel will show you exactly what DNS records to add

## Current Status
- Domain `thefortaiagency.ai` is in the Pro account (the-fort-ai)
- Subdomain `toledotool.thefortaiagency.ai` needs ownership verification
- Once verified, it can be assigned to the toledo-tool-die-platform project

## Expected Result
After completing these steps:
- ✅ Domain verified and assigned to project
- ✅ SSL certificate automatically provisioned
- ✅ Site accessible at: https://toledotool.thefortaiagency.ai