#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zdwtgafaoevevrzrizhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'
);

async function fixDuplicateShifts() {
  console.log('🔧 Fixing Duplicate Shifts\n');
  console.log('=' .repeat(60));
  
  // Map of which shifts to keep (the ones with more usage)
  const shiftsToKeep = {
    'First': '621b9121-9ffc-4b9f-9754-52d98643687b',   // 186 records
    'Second': 'd3ef181f-a916-4f4d-8c1d-aee14a570519',  // 284 records  
    'Third': '0c9061dc-df6b-49eb-80ff-27a0a0a524c7'    // 104 records
  };
  
  const shiftsToRemove = {
    'First': '11111111-1111-1111-1111-111111111111',   // 26 records
    'Second': '22222222-2222-2222-2222-222222222222',  // 26 records
    'Third': '33333333-3333-3333-3333-333333333333'    // 6 records
  };
  
  try {
    // Step 1: Update production_data records to use the primary shift IDs
    console.log('Step 1: Migrating production records to primary shift IDs...\n');
    
    for (const [shiftName, oldId] of Object.entries(shiftsToRemove)) {
      const newId = shiftsToKeep[shiftName];
      
      // Count records to update
      const { count } = await supabase
        .from('production_data')
        .select('*', { count: 'exact', head: true })
        .eq('shift_id', oldId);
      
      if (count > 0) {
        console.log(`Updating ${count} records from ${shiftName} (${oldId.substring(0, 8)}...)`);
        console.log(`  → to primary ${shiftName} (${newId.substring(0, 8)}...)`);
        
        // Update the records
        const { error } = await supabase
          .from('production_data')
          .update({ shift_id: newId })
          .eq('shift_id', oldId);
        
        if (error) {
          console.error(`❌ Error updating records: ${error.message}`);
          return;
        } else {
          console.log(`✅ Successfully updated ${count} records\n`);
        }
      } else {
        console.log(`No records to update for ${shiftName} duplicate\n`);
      }
    }
    
    // Step 2: Delete the duplicate shift records
    console.log('\nStep 2: Removing duplicate shift records...\n');
    
    for (const [shiftName, idToRemove] of Object.entries(shiftsToRemove)) {
      console.log(`Removing duplicate ${shiftName} shift (${idToRemove.substring(0, 8)}...)`);
      
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', idToRemove);
      
      if (error) {
        console.error(`❌ Error removing shift: ${error.message}`);
      } else {
        console.log(`✅ Removed duplicate ${shiftName} shift`);
      }
    }
    
    // Step 3: Verify the fix
    console.log('\n' + '=' .repeat(60));
    console.log('Verification:\n');
    
    const { data: remainingShifts } = await supabase
      .from('shifts')
      .select('*')
      .order('shift_name');
    
    console.log('Remaining shifts in database:');
    remainingShifts?.forEach(shift => {
      console.log(`  • ${shift.shift_name}: ${shift.start_time} - ${shift.end_time}`);
    });
    
    // Check for any remaining duplicates
    const names = {};
    remainingShifts?.forEach(shift => {
      names[shift.shift_name] = (names[shift.shift_name] || 0) + 1;
    });
    
    const hasDuplicates = Object.values(names).some(count => count > 1);
    
    if (!hasDuplicates) {
      console.log('\n✅ SUCCESS! All duplicate shifts have been removed.');
      console.log('The shift dropdown will now show each shift only once.');
    } else {
      console.log('\n⚠️  Warning: Some duplicates may still exist.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixDuplicateShifts();