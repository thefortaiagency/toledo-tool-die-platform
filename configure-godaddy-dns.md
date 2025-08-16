# GoDaddy DNS Configuration for toledotool.thefortaiagency.ai

## Current Status
- Domain `thefortaiagency.ai` has been moved to Vercel Pro account (the-fort-ai)
- Subdomain `toledotool.thefortaiagency.ai` needs DNS configuration

## Steps to Configure in GoDaddy

### 1. Login to GoDaddy
Go to: https://dcc.godaddy.com/domains

### 2. Find Domain
Look for: `thefortaiagency.ai`

### 3. Click "DNS" or "Manage DNS"

### 4. Add/Update DNS Record

**Add this CNAME Record:**
- **Type**: CNAME
- **Host**: `toledotool`
- **Points to**: `cname.vercel-dns.com`
- **TTL**: 600 seconds (10 minutes)

**OR if CNAME doesn't work, use A Record:**
- **Type**: A  
- **Host**: `toledotool`
- **Points to**: `76.76.21.21`
- **TTL**: 600 seconds

### 5. Delete Conflicting Records
If there are any existing records for `toledotool`, delete them first.

## After DNS Configuration

Once you've updated GoDaddy DNS (wait 5-30 minutes for propagation), run:

```bash
# Add the domain to the project
vercel domains add toledotool.thefortaiagency.ai

# Or set as alias
vercel alias toledo-tool-die-platform-eta.vercel.app toledotool.thefortaiagency.ai
```

## Verification

Check DNS propagation status:
- https://dnschecker.org/#CNAME/toledotool.thefortaiagency.ai

Once DNS is configured and propagated:
- The domain will automatically get SSL certificate
- Site will be accessible at: https://toledotool.thefortaiagency.ai

## Current Production URLs
- **Vercel URL**: https://toledo-tool-die-platform-eta.vercel.app
- **Target Custom Domain**: https://toledotool.thefortaiagency.ai

## Important Notes
- The parent domain `thefortaiagency.ai` is now in the Pro account (the-fort-ai)
- DNS must be configured in GoDaddy before Vercel can verify the subdomain
- SSL certificate will be automatically provisioned after verification