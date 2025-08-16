const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSchema() {
  console.log('🚀 EXECUTING SCRAP DATA SCHEMA IN SUPABASE');
  console.log('==========================================\n');

  // Read the schema file
  const schemaPath = path.join(__dirname, '../lib/db/schema/scrap.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split the schema into individual statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Extract statement type and name for logging
    const statementType = statement.match(/^(CREATE|ALTER|INSERT|DROP)/i)?.[1] || 'SQL';
    const tableName = statement.match(/(?:TABLE|INDEX|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)?.[1] || '';
    
    console.log(`${i + 1}. Executing ${statementType} ${tableName}...`);
    
    try {
      // Execute the SQL statement using Supabase's rpc function
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).single();

      if (error) {
        // Check if it's a "already exists" error which is okay
        if (error.message?.includes('already exists') || error.code === '42P07') {
          console.log(`   ✅ ${tableName} already exists (skipped)`);
          successCount++;
        } else {
          console.error(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      // Try alternative approach - direct SQL execution
      try {
        // For Supabase, we can't directly execute arbitrary SQL
        // So we'll create tables using the Supabase client methods
        
        if (statementType === 'CREATE' && tableName === 'scrap_data') {
          console.log('   Creating scrap_data table via Supabase client...');
          
          // Check if table exists first
          const { data: tables } = await supabase
            .from('scrap_data')
            .select('id')
            .limit(1);
          
          if (tables !== null) {
            console.log(`   ✅ Table scrap_data already exists`);
            successCount++;
          } else {
            console.log(`   ⚠️  Table needs to be created manually in Supabase dashboard`);
            errorCount++;
          }
        } else {
          console.log(`   ⚠️  Statement needs manual execution: ${statementType} ${tableName}`);
          errorCount++;
        }
      } catch (innerErr) {
        console.error(`   ❌ Error: ${innerErr.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully executed: ${successCount} statements`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} statements`);
    console.log('\n⚠️  MANUAL STEPS REQUIRED:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of lib/db/schema/scrap.sql');
    console.log('4. Paste and execute in the SQL Editor');
    console.log('\nThis is needed because Supabase doesn\'t allow arbitrary SQL execution via API.');
  } else {
    console.log('\n✅ Schema execution complete!');
  }
  
  // Test if the table exists
  console.log('\n🔍 Testing table access...');
  try {
    const { data, error } = await supabase
      .from('scrap_data')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Table not accessible. Please create it manually in Supabase.');
      console.log('\n📋 SQL to execute in Supabase SQL Editor:\n');
      console.log(schema);
    } else {
      console.log('✅ Table scrap_data is accessible and ready for data!');
    }
  } catch (err) {
    console.log('❌ Cannot access table. Manual creation required.');
  }
}

// Run the schema execution
executeSchema().catch(console.error);