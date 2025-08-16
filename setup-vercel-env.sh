#!/bin/bash

echo "Setting up Vercel environment variables for Pro account..."

# Add environment variables
echo "https://zdwtgafaoevevrzrizhs.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTUzNzcsImV4cCI6MjA3MDg3MTM3N30.i6axuHvUs5RRC8vybo7qRMUt68st1nLBQM7VRuyqO48" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "Toledo Tool & Die Metrics" | vercel env add NEXT_PUBLIC_APP_NAME production
echo "https://toledo-tool-die-platform.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production

echo "Environment variables added. Now deploying..."
vercel --prod