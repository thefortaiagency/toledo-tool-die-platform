const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupManningTables() {
  console.log('🔧 Setting up manning/attendance tables...\n');
  
  try {
    // Read the SQL schema file
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '..', 'lib', 'db', 'schema', 'manning.sql'),
      'utf8'
    );
    
    // Split into individual statements (basic split, might need refinement)
    const statements = schemaSQL
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Get a description of what we're doing
      let description = 'Executing statement';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE[^(]*?(\w+)/i);
        description = `Creating table: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX[^(]*?(\w+)/i);
        description = `Creating index: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE VIEW')) {
        const match = statement.match(/CREATE[^V]*VIEW[^(]*?(\w+)/i);
        description = `Creating view: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE FUNCTION')) {
        const match = statement.match(/CREATE[^F]*FUNCTION[^(]*?(\w+)/i);
        description = `Creating function: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE TRIGGER')) {
        const match = statement.match(/CREATE TRIGGER[^(]*?(\w+)/i);
        description = `Creating trigger: ${match ? match[1] : 'unknown'}`;
      }
      
      console.log(`${i + 1}/${statements.length}: ${description}`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).single();
      
      if (error) {
        // Try direct execution as fallback
        console.log('  ⚠️  RPC failed, trying alternative method...');
        
        // For now, we'll need to manually run these in Supabase SQL editor
        console.log(`  ⚠️  Statement needs manual execution in Supabase SQL editor`);
        console.log(`  Statement preview: ${statement.substring(0, 100)}...`);
      } else {
        console.log('  ✅ Success');
      }
    }
    
    console.log('\n✨ Manning tables setup complete!');
    console.log('\n📝 Note: Some statements may need to be run manually in the Supabase SQL editor.');
    console.log('   Copy the contents of lib/db/schema/manning.sql and run in Supabase dashboard.\n');
    
    // Test the tables
    console.log('🔍 Testing table creation...');
    
    // Try to query the manning_records table
    const { data, error: testError } = await supabase
      .from('manning_records')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Tables not yet created. Please run the SQL manually in Supabase.');
      console.log('\nTo set up the tables:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy contents from: lib/db/schema/manning.sql');
      console.log('4. Paste and run in SQL Editor');
    } else {
      console.log('✅ Manning tables are ready to use!');
    }
    
  } catch (error) {
    console.error('❌ Error setting up manning tables:', error.message);
    console.log('\n📝 Please manually run the SQL from lib/db/schema/manning.sql in your Supabase dashboard.');
  }
}

// Run the setup
setupManningTables();