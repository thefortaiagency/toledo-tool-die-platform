#!/bin/bash

# Toledo Tool & Die DNS Configuration for GoDaddy
# Domain: toledotool.thefortaiagency.ai

echo "🏭 Toledo Tool & Die - DNS Configuration"
echo "========================================="
echo ""
echo "Setting up toledotool.thefortaiagency.ai"
echo ""

# GoDaddy API credentials (from environment)
GODADDY_API_KEY="${GODADDY_API_KEY}"
GODADDY_API_SECRET="${GODADDY_API_SECRET}"

if [ -z "$GODADDY_API_KEY" ] || [ -z "$GODADDY_API_SECRET" ]; then
    echo "❌ Error: GoDaddy API credentials not found in environment"
    echo "Please set GODADDY_API_KEY and GODADDY_API_SECRET"
    exit 1
fi

# Domain info
BASE_DOMAIN="thefortaiagency.ai"
SUBDOMAIN="toledotool"
VERCEL_IP="76.76.21.21"

echo "📝 Configuration:"
echo "  Domain: ${SUBDOMAIN}.${BASE_DOMAIN}"
echo "  Vercel IP: ${VERCEL_IP}"
echo ""

# Create the DNS record
echo "🔧 Creating A record for ${SUBDOMAIN}..."

curl -X PATCH "https://api.godaddy.com/v1/domains/${BASE_DOMAIN}/records" \
  -H "Authorization: sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}" \
  -H "Content-Type: application/json" \
  -d "[
    {
      \"type\": \"A\",
      \"name\": \"${SUBDOMAIN}\",
      \"data\": \"${VERCEL_IP}\",
      \"ttl\": 600
    }
  ]"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DNS record created successfully!"
    echo ""
    echo "🌐 Your Toledo Tool & Die platform will be available at:"
    echo "   https://toledotool.thefortaiagency.ai"
    echo ""
    echo "⏱️  DNS propagation may take 5-30 minutes"
    echo ""
    echo "📊 Vercel Production URL:"
    echo "   https://toledo-tool-die-platform.vercel.app"
    echo ""
    echo "🔗 GitHub Repository:"
    echo "   https://github.com/thefortaiagency/toledo-tool-die-platform"
else
    echo ""
    echo "❌ Failed to create DNS record"
    echo "Please check your GoDaddy API credentials"
fi