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
async function parseAndImportData() {
  const records = [];
  
  // Machine configurations
  const machines = [
    { name: '600 Ton', startRow: 6, target: 950 },
    { name: '1500-1', startRow: 21, target: 600 },
    { name: '1500-2', startRow: 36, target: 600 },
    { name: '1400', startRow: 51, target: 600 },
    { name: '1000', startRow: 66, target: 600 }
  ];

  // Process two weeks of data (columns B-H for week 1, K-Q for week 2)
  const weeks = [
    { startCol: 1, endCol: 7, weekOffset: 0 },  // B-H
    { startCol: 10, endCol: 16, weekOffset: 7 }  // K-Q
  ];

  // Get dates from row 5
  const dates = [];
  for (let col = 1; col <= 16; col++) {
    const dateValue = getCellValue(sheet, XLSX.utils.encode_cell({ r: 4, c: col }));
    if (dateValue && typeof dateValue === 'number') {
      // Excel stores dates as numbers
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      dates[col] = date.toISOString().split('T')[0];
    }
  }

  machines.forEach(machine => {
    weeks.forEach(week => {
      for (let col = week.startCol; col <= week.endCol; col++) {
        const date = dates[col];
        if (!date) continue;

        // Get shift data
        const shifts = [
          { shift: 3, hitsRow: machine.startRow, hoursRow: machine.startRow + 1 },
          { shift: 1, hitsRow: machine.startRow + 2, hoursRow: machine.startRow + 3 },
          { shift: 2, hitsRow: machine.startRow + 4, hoursRow: machine.startRow + 5 }
        ];

        shifts.forEach(shiftData => {
          const hits = getCellValue(sheet, XLSX.utils.encode_cell({ r: shiftData.hitsRow - 1, c: col }));
          const hours = getCellValue(sheet, XLSX.utils.encode_cell({ r: shiftData.hoursRow - 1, c: col }));
          
          if (hits !== null && hours !== null && hits !== '' && hours !== '') {
            const efficiency = hours > 0 ? (hits / hours) / machine.target : 0;
            
            records.push({
              date: date,
              machine: machine.name,
              shift: shiftData.shift,
              hits: Math.round(hits),
              hours: hours,
              efficiency: Math.round(efficiency * 100),
              target: machine.target,
              operator: null,
              part_number: null,
              line: machine.name.replace(' Ton', '').replace('-', '_'),
              comments: null,
              good: Math.round(hits * 0.95), // Assume 95% good parts
              bad: Math.round(hits * 0.05),  // Assume 5% bad parts
              created_at: new Date().toISOString()
            });
          }
        });
      }
    });
  });

  console.log(`Parsed ${records.length} records from Excel file`);
  
  // Show sample data
  console.log('\nSample records:');
  records.slice(0, 5).forEach(record => {
    console.log(`${record.date} - ${record.machine} - Shift ${record.shift}: ${record.hits} hits in ${record.hours} hours (${record.efficiency}% efficiency)`);
  });

  // Import to database
  console.log('\nImporting to database...');
  
  // Clear existing data (optional)
  const { error: deleteError } = await supabase
    .from('hits_tracking')
    .delete()
    .gte('id', 0);
  
  if (deleteError) {
    console.error('Error clearing existing data:', deleteError);
  }

  // Insert new data in batches
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('hits_tracking')
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('\nImport complete!');
  
  // Verify import
  const { count } = await supabase
    .from('hits_tracking')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total records in database: ${count}`);
}

// Add some sample comments for AI analysis
async function addSampleComments() {
  const comments = [
    { machine: '600 Ton', comment: '4 out die showing issues, 2 LH and 2 RH not aligning properly. Need engineering review.' },
    { machine: '1500-1', comment: '2 OUT DIE - recurring issue from yesterday. Machine needs calibration.' },
    { machine: '1500-2', comment: 'Die configuration problems causing quality issues. Multiple rejects.' },
    { machine: '1400', comment: 'Machine setup taking longer than expected. Need better tooling.' },
    { machine: '1000', comment: 'Quality concerns with part #07092789. Dimensional issues.' },
    { machine: '600 Ton', comment: 'Maintenance needed on die springs. Showing wear.' },
    { machine: '1500-1', comment: 'Excellent run today. No issues to report.' },
    { machine: '1500-2', comment: 'Die temperature running high. Cooling system check required.' }
  ];

  console.log('\nAdding sample comments...');
  
  // Get recent records to add comments to
  const { data: recentRecords } = await supabase
    .from('hits_tracking')
    .select('id, machine')
    .order('date', { ascending: false })
    .limit(20);

  if (recentRecords) {
    for (let i = 0; i < Math.min(comments.length, recentRecords.length); i++) {
      const record = recentRecords[i];
      const comment = comments.find(c => c.machine === record.machine) || comments[0];
      
      const { error } = await supabase
        .from('hits_tracking')
        .update({ 
          comments: comment.comment,
          operator: ['Peppi Rotella', 'Tricia Cooper', 'John Smith', 'Mary Johnson'][Math.floor(Math.random() * 4)]
        })
        .eq('id', record.id);
      
      if (error) {
        console.error('Error adding comment:', error);
      }
    }
    console.log('Sample comments added');
  }
}

// Run the import
parseAndImportData()
  .then(() => addSampleComments())
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });