#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zdwtgafaoevevrzrizhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'
);

async function runMigration() {
  console.log('🔧 Adding issue tracking fields to production_data table...\n');
  
  try {
    // Test if we can connect
    const { data: testData, error: testError } = await supabase
      .from('production_data')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot connect to database:', testError);
      return;
    }
    
    console.log('✅ Connected to database');
    
    // Since we can't check columns directly, we'll test with an insert
    
    // Since we can't directly alter the table via Supabase client,
    // we'll provide instructions and test what we can
    
    console.log('\n📋 MIGRATION INSTRUCTIONS:');
    console.log('=' .repeat(60));
    console.log('\n1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and run the SQL from: scripts/add-issue-tracking-fields.sql');
    console.log('\nOr run this SQL directly:\n');
    
    const migrationSQL = `
-- Add issue tracking columns to production_data table
ALTER TABLE production_data
ADD COLUMN IF NOT EXISTS issue_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS severity_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS actions_taken TEXT[],
ADD COLUMN IF NOT EXISTS root_cause TEXT,
ADD COLUMN IF NOT EXISTS parts_replaced TEXT,
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS safety_concern BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issue_category ON production_data(issue_category);
CREATE INDEX IF NOT EXISTS idx_severity_level ON production_data(severity_level);
CREATE INDEX IF NOT EXISTS idx_follow_up ON production_data(follow_up_required) WHERE follow_up_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_safety ON production_data(safety_concern) WHERE safety_concern = TRUE;
`;
    
    console.log(migrationSQL);
    
    console.log('\n4. After running the migration, test with a sample insert:\n');
    
    // Try to insert a test record with new fields to see if they exist
    const testRecord = {
      date: '2025-08-16',
      machine_id: 'b8e48ae1-513f-4211-aa15-a421150c15a4', // 600 Ton
      shift_id: null, // We don't have shift UUIDs readily available
      total_cycles: 1000,
      good_parts: 950,
      scrap_parts: 50,
      downtime_minutes: 15,
      scheduled_hours: 8,
      actual_hours: 7.75,
      actual_efficiency: 95,
      operator_comments: 'Test entry with issue tracking',
      // New fields
      issue_category: 'die_tooling',
      severity_level: 'minor',
      actions_taken: ['adjusted_settings', 'called_maintenance'],
      root_cause: 'Worn die spring',
      parts_replaced: 'Die spring #123',
      follow_up_required: true,
      safety_concern: false
    };
    
    console.log('Testing if new fields exist by attempting insert...');
    
    const { data: insertTest, error: insertError } = await supabase
      .from('production_data')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      if (insertError.message.includes('column') || insertError.message.includes('issue_category')) {
        console.log('\n⚠️  New columns not found. Please run the SQL migration first.');
        console.log('Error:', insertError.message);
      } else if (insertError.message.includes('shift_id')) {
        console.log('\n⚠️  Shift ID issue - columns might exist but shift_id constraint is blocking.');
        console.log('This is expected. Please run the full SQL migration.');
      } else {
        console.log('\n⚠️  Insert test failed:', insertError.message);
      }
    } else {
      console.log('\n✅ New fields already exist! Test record inserted successfully.');
      
      // Clean up test record
      if (insertTest && insertTest[0]) {
        await supabase
          .from('production_data')
          .delete()
          .eq('id', insertTest[0].id);
        console.log('✅ Test record cleaned up');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('BENEFITS OF THIS MIGRATION:');
    console.log('- Structured issue tracking for better analytics');
    console.log('- Safety concern flagging for immediate attention');
    console.log('- Follow-up tracking to ensure issues are resolved');
    console.log('- Root cause analysis for preventive maintenance');
    console.log('- Standardized categories based on real production data');
    
  } catch (error) {
    console.error('❌ Migration check failed:', error);
  }
}

// Run the migration check
runMigration();