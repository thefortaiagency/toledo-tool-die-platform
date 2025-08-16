# Domain Setup Instructions for toledotool.thefortaiagency.ai

## Steps to Configure Domain

### 1. Add Domain to Vercel (via Vercel Dashboard)

1. Go to https://vercel.com/the-fort-ai/toledo-tool-die-platform/settings/domains
2. Click "Add Domain"
3. Enter: `toledotool.thefortaiagency.ai`
4. Click "Add"

### 2. Get DNS Records from Vercel

After adding the domain, Vercel will show you one of these options:

#### Option A: CNAME Record (Recommended for Subdomains)
- **Type**: CNAME
- **Name**: toledotool
- **Value**: `cname.vercel-dns.com.`

#### Option B: A Records (If CNAME doesn't work)
- **Type**: A
- **Name**: toledotool
- **Value**: `76.76.21.21`

### 3. Configure in GoDaddy

1. Log into GoDaddy: https://dcc.godaddy.com/domains
2. Find `thefortaiagency.ai` domain
3. Click "DNS" or "Manage DNS"
4. Delete any existing records for `toledotool` subdomain
5. Add new record:

#### For CNAME (Preferred):
- **Type**: CNAME
- **Host**: toledotool
- **Points to**: cname.vercel-dns.com
- **TTL**: 600 seconds (or 1 hour)

#### For A Record (Alternative):
- **Type**: A
- **Host**: toledotool
- **Points to**: 76.76.21.21
- **TTL**: 600 seconds

### 4. Remove from Old Vercel Account

If the domain is currently pointing to the old free account:
1. Check if it exists in the old account
2. Remove it from there first
3. Then add to new Pro account

### 5. Verify Domain

After DNS propagation (5-30 minutes):
1. Go back to Vercel dashboard
2. The domain should show "Valid Configuration" ✅
3. SSL certificate will be automatically provisioned

### 6. Test the Domain

Once configured, visit:
- https://toledotool.thefortaiagency.ai

## Current Production URLs

- **Vercel URL**: https://toledo-tool-die-platform-eta.vercel.app
- **Custom Domain**: https://toledotool.thefortaiagency.ai (pending setup)

## Troubleshooting

If domain doesn't work after 30 minutes:
1. Check DNS propagation: https://dnschecker.org/#CNAME/toledotool.thefortaiagency.ai
2. Ensure no conflicting records in GoDaddy
3. Try using A record instead of CNAME
4. Contact Vercel support if issues persist

## CLI Commands (After Domain is Added)

```bash
# Check domain status
vercel domains ls

# Inspect specific domain
vercel domains inspect toledotool.thefortaiagency.ai

# Add domain (if not using dashboard)
vercel domains add toledotool.thefortaiagency.ai

# Set production alias
vercel alias set toledo-tool-die-platform-eta.vercel.app toledotool.thefortaiagency.ai
```