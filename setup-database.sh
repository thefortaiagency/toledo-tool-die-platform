#!/bin/bash

echo "🏭 Toledo Tool & Die - Database Setup"
echo "====================================="
echo ""
echo "This script will help you set up the database in Supabase."
echo ""
echo "📋 INSTRUCTIONS:"
echo ""
echo "1. Go to your Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/zdwtgafaoevevrzrizhs"
echo ""
echo "2. Click on 'SQL Editor' in the left sidebar"
echo ""
echo "3. Click 'New Query'"
echo ""
echo "4. Copy and paste the contents of database-schema.sql"
echo ""
echo "5. Click 'Run' to execute the SQL"
echo ""
echo "✅ The database schema includes:"
echo "   - 10 tables for production tracking"
echo "   - 6 machines (600, 1000, 1400, 1500-1, 1500-2, 3000 ton)"
echo "   - 3 shifts (First, Second, Third)"
echo "   - AI insights table"
echo "   - All necessary indexes and triggers"
echo ""
echo "📊 After running the schema, you can:"
echo "   1. Import Excel data: node import-excel-data.js"
echo "   2. Access the platform: http://localhost:3011"
echo ""
echo "Press Enter to open the SQL file in your editor..."
read

# Try to open the SQL file in the default editor
if command -v code &> /dev/null; then
    code database-schema.sql
elif command -v open &> /dev/null; then
    open database-schema.sql
else
    cat database-schema.sql
fi

echo ""
echo "✅ Database schema file opened!"
echo "   Copy the contents and run in Supabase SQL Editor"