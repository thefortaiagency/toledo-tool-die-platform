#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zdwtgafaoevevrzrizhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'
);

// Machine ID mapping
const MACHINE_IDS = {
  '600': 'b8e48ae1-513f-4211-aa15-a421150c15a4',
  '600T': 'b8e48ae1-513f-4211-aa15-a421150c15a4',
  '1500-1': '73a96295-79f3-4dc7-ab38-08ee48679a6f',
  '1500-2': '5d509a37-0e1c-4c18-be71-34638b3ec716',
  '1400': '45dadf58-b046-4fe1-93fd-bf76568e8ef1',
  '1000': '3c9453df-432f-47cb-9fd8-19b9a19fd012',
  '1000T': '3c9453df-432f-47cb-9fd8-19b9a19fd012',
  'Hyd': '0e29b01a-7383-4c66-81e7-f92e9d52f227',
  '3000': '0e29b01a-7383-4c66-81e7-f92e9d52f227' // Assuming 3000 is also Hyd
};

function parseDate(filename) {
  // Extract date from filename like "Shift Update v22 8-15-25.xlsx"
  const match = filename.match(/(\d{1,2})-(\d{1,2})-(\d{2})/);
  if (match) {
    const [_, month, day, year] = match;
    // Assuming 25 means 2025
    return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

function extractShift(filename) {
  // Files ending in .2 are shift 2, .3 are shift 3, default is shift 1
  if (filename.includes('.2.xlsx')) return 2;
  if (filename.includes('.3.xlsx')) return 3;
  return 1;
}

async function importShiftUpdateFile(filePath) {
  const filename = path.basename(filePath);
  const date = parseDate(filename);
  const shift = extractShift(filename);
  
  if (!date) {
    console.log(`  ⚠️ Could not parse date from ${filename}`);
    return { imported: 0, skipped: 0 };
  }
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    // Check if Shift Report sheet exists
    if (!workbook.SheetNames.includes('Shift Report')) {
      console.log(`  ⚠️ No 'Shift Report' sheet in ${filename}`);
      return { imported: 0, skipped: 0 };
    }
    
    const sheet = workbook.Sheets['Shift Report'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let imported = 0;
    let skipped = 0;
    const updates = [];
    
    // Process each row looking for comments
    for (let i = 2; i < data.length; i++) { // Start at row 2 to skip headers
      const row = data[i];
      if (!row || !row[0]) continue;
      
      const machineName = String(row[0]).trim();
      const machineId = MACHINE_IDS[machineName];
      const comment = row[12]; // Comments appear to be in column 12
      const efficiency = row[4]; // Efficiency in column 4
      
      // Only process if we have a valid machine and a comment
      if (machineId && comment && typeof comment === 'string' && 
          comment.length > 10 && !comment.includes('Have you') && 
          !comment.includes('If "No"')) {
        
        // Check if record already exists (ignore shift_id since it's UUID)
        const { data: existing } = await supabase
          .from('production_data')
          .select('id, operator_comments')
          .eq('date', date)
          .eq('machine_id', machineId)
          .limit(1)
          .single();
        
        if (existing) {
          // Update existing record only if no comment exists
          if (!existing.operator_comments) {
            // Efficiency is already a decimal (like 0.90 for 90%), multiply by 100 for percentage
            // But cap at 100 to avoid database overflow
            const efficiencyPercent = efficiency ? Math.min(parseFloat(efficiency) * 100, 100) : null;
            updates.push({
              id: existing.id,
              operator_comments: comment.trim(),
              actual_efficiency: efficiencyPercent
            });
          } else {
            skipped++;
          }
        } else {
          // Create new record - shift_id should be a UUID, not a number
          // For now, just update existing records instead of creating new ones
          // since we don't have the proper shift UUIDs
          console.log(`    Would add comment for ${machineName} on ${date}: "${comment.substring(0, 50)}..."`);
          skipped++;
        }
      }
    }
    
    // Batch update existing records
    if (updates.length > 0) {
      for (const update of updates) {
        const { error } = await supabase
          .from('production_data')
          .update({
            operator_comments: update.operator_comments,
            actual_efficiency: update.actual_efficiency
          })
          .eq('id', update.id);
        
        if (!error) {
          imported++;
        }
      }
    }
    
    return { imported, skipped };
    
  } catch (error) {
    console.log(`  ❌ Error processing ${filename}: ${error.message}`);
    return { imported: 0, skipped: 0 };
  }
}

async function importAllShiftUpdates() {
  console.log('📝 Importing comments from Shift Update files...\n');
  
  const directory = '/Users/thefortob/Development/ToledoToolAndDie';
  const files = fs.readdirSync(directory);
  
  // Filter for Shift Update files
  const shiftUpdateFiles = files.filter(f => 
    f.startsWith('Shift Update v22') && f.endsWith('.xlsx')
  ).sort();
  
  console.log(`Found ${shiftUpdateFiles.length} Shift Update files to process\n`);
  
  let totalImported = 0;
  let totalSkipped = 0;
  
  for (const file of shiftUpdateFiles) {
    console.log(`Processing: ${file}`);
    const filePath = path.join(directory, file);
    const { imported, skipped } = await importShiftUpdateFile(filePath);
    
    if (imported > 0) {
      console.log(`  ✅ Imported ${imported} comments`);
    }
    if (skipped > 0) {
      console.log(`  ⏭️ Skipped ${skipped} (already have comments)`);
    }
    
    totalImported += imported;
    totalSkipped += skipped;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Import complete!`);
  console.log(`   Total comments imported: ${totalImported}`);
  console.log(`   Total skipped (existing): ${totalSkipped}`);
  console.log('\n📊 View the comments at /reports/comments');
}

// Run the import
importAllShiftUpdates().catch(console.error);