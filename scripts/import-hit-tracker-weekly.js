const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read the Excel file
const workbook = XLSX.readFile('/Users/thefortob/Development/ToledoToolAndDie/Hits Tracking 2025.xlsx');
const sheet = workbook.Sheets['Sheet1'];

// Helper function to get cell value
function getCellValue(sheet, address) {
  const cell = sheet[address];
  return cell ? cell.v : null;
}

// Parse the data structure
async function parseAndImportWeeklyData() {
  const records = [];
  
  // Machine configurations with their rows in the spreadsheet
  const machines = [
    { name: '600 Ton', dailyHitsRow: 12, machineId: '600-ton' },
    { name: '1500-1', dailyHitsRow: 27, machineId: '1500-1' },
    { name: '1500-2', dailyHitsRow: 42, machineId: '1500-2' },
    { name: '1400', dailyHitsRow: 57, machineId: '1400' },
    { name: '1000', dailyHitsRow: 72, machineId: '1000' }
  ];

  // Process two weeks of data
  const weeks = [
    { 
      startCol: 1, // B column
      weekStartDate: '2024-12-30', // Week 1 starts
      weekColumns: {
        monday: 1,    // B
        tuesday: 2,   // C
        wednesday: 3, // D
        thursday: 4,  // E
        friday: 5,    // F
        saturday: 6,  // G
        sunday: 7     // H
      }
    },
    { 
      startCol: 10, // K column
      weekStartDate: '2025-01-06', // Week 2 starts
      weekColumns: {
        monday: 10,    // K
        tuesday: 11,   // L
        wednesday: 12, // M
        thursday: 13,  // N
        friday: 14,    // O
        saturday: 15,  // P
        sunday: 16     // Q
      }
    }
  ];

  // Process each machine and week
  for (const machine of machines) {
    for (const week of weeks) {
      const weekData = {
        date: week.weekStartDate,
        machine_id: machine.machineId,
        monday_hits: getCellValue(sheet, XLSX.utils.encode_cell({ r: machine.dailyHitsRow - 1, c: week.weekColumns.monday })) || 0,
        tuesday_hits: getCellValue(sheet, XLSX.utils.encode_cell({ r: machine.dailyHitsRow - 1, c: week.weekColumns.tuesday })) || 0,
        wednesday_hits: getCellValue(sheet, XLSX.utils.encode_cell({ r: machine.dailyHitsRow - 1, c: week.weekColumns.wednesday })) || 0,
        thursday_hits: getCellValue(sheet, XLSX.utils.encode_cell({ r: machine.dailyHitsRow - 1, c: week.weekColumns.thursday })) || 0,
        friday_hits: getCellValue(sheet, XLSX.utils.encode_cell({ r: machine.dailyHitsRow - 1, c: week.weekColumns.friday })) || 0,
        saturday_hits: getCellValue(sheet, XLSX.utils.encode_cell({ r: machine.dailyHitsRow - 1, c: week.weekColumns.saturday })) || 0,
        sunday_hits: getCellValue(sheet, XLSX.utils.encode_cell({ r: machine.dailyHitsRow - 1, c: week.weekColumns.sunday })) || 0
      };

      // Calculate weekly total and average
      const dailyHits = [
        weekData.monday_hits,
        weekData.tuesday_hits,
        weekData.wednesday_hits,
        weekData.thursday_hits,
        weekData.friday_hits,
        weekData.saturday_hits,
        weekData.sunday_hits
      ];

      weekData.weekly_total = dailyHits.reduce((sum, hits) => sum + (hits || 0), 0);
      weekData.weekly_average = weekData.weekly_total / 7;

      // Only add if there's actual data
      if (weekData.weekly_total > 0) {
        records.push(weekData);
        console.log(`${machine.name} - Week of ${week.weekStartDate}: ${weekData.weekly_total} total hits`);
      }
    }
  }

  console.log(`\nParsed ${records.length} weekly records from Excel file`);
  
  // Import to database
  console.log('\nImporting to database...');
  
  // Insert new data
  for (const record of records) {
    const { data, error } = await supabase
      .from('hits_tracking')
      .upsert(record, { onConflict: 'machine_id,date' })
      .select();
    
    if (error) {
      console.error(`Error inserting record for ${record.machine_id} - ${record.date}:`, error);
    } else {
      console.log(`✓ Imported ${record.machine_id} - Week of ${record.date}`);
    }
  }

  console.log('\nImport complete!');
  
  // Verify import
  const { data: allRecords, count } = await supabase
    .from('hits_tracking')
    .select('*', { count: 'exact' });
  
  console.log(`Total records in database: ${count || allRecords?.length || 0}`);
  
  // Show sample data
  if (allRecords && allRecords.length > 0) {
    console.log('\nSample record from database:');
    const sample = allRecords[0];
    console.log(`Machine: ${sample.machine_id}`);
    console.log(`Week of: ${sample.date}`);
    console.log(`Weekly Total: ${sample.weekly_total}`);
    console.log(`Daily breakdown: Mon=${sample.monday_hits}, Tue=${sample.tuesday_hits}, Wed=${sample.wednesday_hits}, Thu=${sample.thursday_hits}, Fri=${sample.friday_hits}`);
  }
}

// Run the import
parseAndImportWeeklyData()
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });