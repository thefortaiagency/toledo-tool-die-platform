#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zdwtgafaoevevrzrizhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'
);

async function fixDuplicateShifts() {
  console.log('🔧 Analyzing Duplicate Shifts Issue\n');
  console.log('=' .repeat(60));
  
  const shiftsToKeep = {
    'First': '621b9121-9ffc-4b9f-9754-52d98643687b',   
    'Second': 'd3ef181f-a916-4f4d-8c1d-aee14a570519',  
    'Third': '0c9061dc-df6b-49eb-80ff-27a0a0a524c7'    
  };
  
  const shiftsToRemove = {
    'First': '11111111-1111-1111-1111-111111111111',   
    'Second': '22222222-2222-2222-2222-222222222222',  
    'Third': '33333333-3333-3333-3333-333333333333'    
  };
  
  try {
    // First, let's analyze the conflicts
    console.log('Analyzing potential conflicts...\n');
    
    for (const [shiftName, oldId] of Object.entries(shiftsToRemove)) {
      const newId = shiftsToKeep[shiftName];
      
      // Get records with the duplicate shift
      const { data: duplicateRecords } = await supabase
        .from('production_data')
        .select('date, machine_id, id')
        .eq('shift_id', oldId);
      
      if (duplicateRecords && duplicateRecords.length > 0) {
        console.log(`Found ${duplicateRecords.length} records using duplicate ${shiftName} shift`);
        
        // Check for conflicts
        let conflicts = 0;
        let canMigrate = 0;
        
        for (const record of duplicateRecords) {
          const { data: existing } = await supabase
            .from('production_data')
            .select('id')
            .eq('date', record.date)
            .eq('machine_id', record.machine_id)
            .eq('shift_id', newId);
          
          if (existing && existing.length > 0) {
            conflicts++;
          } else {
            canMigrate++;
          }
        }
        
        console.log(`  • ${canMigrate} records can be migrated safely`);
        console.log(`  • ${conflicts} records have conflicts (same date/machine already exists)\n`);
        
        if (conflicts > 0) {
          console.log(`  ⚠️  Conflicting records will be deleted to maintain data integrity`);
          
          // Delete conflicting records
          for (const record of duplicateRecords) {
            const { data: existing } = await supabase
              .from('production_data')
              .select('id')
              .eq('date', record.date)
              .eq('machine_id', record.machine_id)
              .eq('shift_id', newId);
            
            if (existing && existing.length > 0) {
              // Delete the duplicate record
              const { error } = await supabase
                .from('production_data')
                .delete()
                .eq('id', record.id);
              
              if (!error) {
                console.log(`    Deleted conflicting record ID: ${record.id.substring(0, 8)}...`);
              }
            }
          }
        }
        
        // Now migrate the non-conflicting records
        if (canMigrate > 0) {
          const { error } = await supabase
            .from('production_data')
            .update({ shift_id: newId })
            .eq('shift_id', oldId);
          
          if (error) {
            console.log(`  ❌ Error migrating records: ${error.message}`);
          } else {
            console.log(`  ✅ Successfully migrated ${canMigrate} records`);
          }
        }
      }
    }
    
    // Now remove the duplicate shifts
    console.log('\n' + '=' .repeat(60));
    console.log('Removing duplicate shift records...\n');
    
    for (const [shiftName, idToRemove] of Object.entries(shiftsToRemove)) {
      // First check if any records still use this shift
      const { count } = await supabase
        .from('production_data')
        .select('*', { count: 'exact', head: true })
        .eq('shift_id', idToRemove);
      
      if (count === 0) {
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', idToRemove);
        
        if (error) {
          console.log(`❌ Error removing ${shiftName} duplicate: ${error.message}`);
        } else {
          console.log(`✅ Removed duplicate ${shiftName} shift`);
        }
      } else {
        console.log(`⚠️  Cannot remove ${shiftName} duplicate - still has ${count} records`);
      }
    }
    
    // Final verification
    console.log('\n' + '=' .repeat(60));
    console.log('Final Status:\n');
    
    const { data: remainingShifts } = await supabase
      .from('shifts')
      .select('*')
      .order('shift_name');
    
    console.log('Shifts in database:');
    for (const shift of remainingShifts) {
      const { count } = await supabase
        .from('production_data')
        .select('*', { count: 'exact', head: true })
        .eq('shift_id', shift.id);
      
      console.log(`  • ${shift.shift_name} (${shift.start_time} - ${shift.end_time})`);
      console.log(`    ID: ${shift.id}`);
      console.log(`    Used by: ${count} production records`);
    }
    
    // Check for duplicates
    const names = {};
    remainingShifts?.forEach(shift => {
      names[shift.shift_name] = (names[shift.shift_name] || 0) + 1;
    });
    
    const duplicateCount = Object.values(names).filter(count => count > 1).length;
    
    console.log('\n' + '=' .repeat(60));
    if (duplicateCount === 0) {
      console.log('✅ SUCCESS! All shifts are now unique.');
    } else {
      console.log(`⚠️  ${duplicateCount} shift names still have duplicates.`);
      console.log('This may be due to records that couldn\'t be migrated.');
      console.log('Manual intervention may be required.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixDuplicateShifts();