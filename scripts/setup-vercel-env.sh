#!/bin/bash

echo "🔐 Setting up Vercel environment variables for Toledo Tool & Die Platform"

# Supabase Configuration
echo "NEXT_PUBLIC_SUPABASE_URL=https://zdwtgafaoevevrzrizhs.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTUzNzcsImV4cCI6MjA3MDg3MTM3N30.i6axuHvUs5RRC8vybo7qRMUt68st1nLBQM7VRuyqO48" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# OpenAI Configuration (if needed for AI features)
echo "OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE" | vercel env add OPENAI_API_KEY production

# Application Settings
echo "NEXT_PUBLIC_APP_NAME=Toledo Tool & Die Metrics" | vercel env add NEXT_PUBLIC_APP_NAME production

echo "✅ Environment variables added to Vercel!"
echo ""
echo "⚠️  IMPORTANT: Replace YOUR_OPENAI_KEY_HERE with actual key in Vercel dashboard"
echo ""
echo "To verify, run: vercel env ls"