#!/bin/bash

echo "🔐 Setting up Gmail credentials for Toledo Tool & Die Platform..."
echo "================================================================"

# Function to add or update environment variable
add_env() {
    local key=$1
    local value=$2
    echo -n "Adding/updating $key... "
    
    # Remove existing if it exists
    vercel env rm "$key" production --yes 2>/dev/null
    
    # Add new value
    echo "$value" | vercel env add "$key" production 2>/dev/null && echo "✅" || echo "❌"
}

# Gmail Configuration for Bug Reports
echo "Setting up Gmail configuration..."
add_env "GMAIL_USER" "info@aimpactnexus.ai"
add_env "GMAIL_APP_PASSWORD" "pozmxmzqqhidndtu"

echo ""
echo "✅ Gmail configuration complete!"
echo ""
echo "Now deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🐛 Bug reporting system is now active!"
echo ""
echo "Users can now:"
echo "• Click the 'Report' button in the top navigation"
echo "• Submit bug reports and feature requests"
echo "• Reports will be sent to aoberlin@thefortaiagency.ai"
echo ""
echo "Test the bug report system at your deployed URL."