const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse shift data from Excel files
function extractShiftData(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);
  
  // Extract date from filename (e.g., "8.14.25.2" or "Shift Update v22 8-2-25")
  let fileDate = null;
  const dateMatch = fileName.match(/(\d{1,2})[\.\-](\d{1,2})[\.\-](\d{2,4})/);
  if (dateMatch) {
    const [_, month, day, year] = dateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    fileDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    console.log(`  📅 Date extracted: ${fileDate.toISOString().split('T')[0]}`);
  }
  
  // Extract shift number from filename (e.g., ".2" means 2nd shift, ".3" means 3rd shift)
  let shiftNumber = null;
  const shiftMatch = fileName.match(/\.(\d)\.xlsx$/);
  if (shiftMatch) {
    shiftNumber = parseInt(shiftMatch[1]);
    console.log(`  👥 Shift extracted: ${shiftNumber === 1 ? '1st' : shiftNumber === 2 ? '2nd' : '3rd'} shift`);
  }
  
  try {
    const workbook = XLSX.readFile(filePath);
    const shiftData = {
      fileName,
      date: fileDate,
      shift: shiftNumber,
      production: [],
      manning: {}
    };
    
    // Process Shift Report sheet
    if (workbook.SheetNames.includes('Shift Report')) {
      const worksheet = workbook.Sheets['Shift Report'];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Look for production data by machine
      const machines = ['600', '1000', '1400', '1500-1', '1500-2', '3000', 'Hyd'];
      
      jsonData.forEach((row, rowIdx) => {
        // Check if this row contains a machine
        const firstCell = row[0]?.toString() || '';
        if (machines.includes(firstCell)) {
          const machineData = {
            machine: firstCell,
            row: rowIdx,
            efficiency: row[4] || null,
            totalStrokes: row[5] || null,
            details: []
          };
          
          // Look for detailed data below this machine
          for (let i = rowIdx + 1; i < Math.min(rowIdx + 20, jsonData.length); i++) {
            const detailRow = jsonData[i];
            if (detailRow[3] && detailRow[4]) { // Has job and part number
              machineData.details.push({
                job: detailRow[3],
                partNumber: detailRow[4],
                hits: detailRow[5] || 0,
                hours: detailRow[6] || 0
              });
            }
            // Stop if we hit another machine or empty section
            if (machines.includes(detailRow[0]?.toString() || '') || 
                (detailRow[0] === '' && detailRow[1] === '' && detailRow[2] === '')) {
              break;
            }
          }
          
          shiftData.production.push(machineData);
        }
        
        // Look for shift indicator
        if (row[6] === 'Shift:' && row[7]) {
          shiftData.extractedShift = row[7];
          console.log(`  📋 Shift from data: ${row[7]}`);
        }
        
        // Look for date
        if (row[0] === 'Date:' && row[1]) {
          shiftData.extractedDate = row[1];
          console.log(`  📅 Date from data: ${row[1]}`);
        }
      });
      
      // Calculate manning insights from production data
      const activeMachines = shiftData.production.filter(m => m.totalStrokes > 0).length;
      const totalMachines = machines.length;
      
      shiftData.manning = {
        activeMachines,
        totalMachines,
        utilizationRate: ((activeMachines / totalMachines) * 100).toFixed(1),
        estimatedOperators: activeMachines, // Assume 1 operator per active machine minimum
        totalHitsProduced: shiftData.production.reduce((sum, m) => sum + (m.totalStrokes || 0), 0),
        averageEfficiency: (
          shiftData.production
            .filter(m => m.efficiency)
            .reduce((sum, m, _, arr) => sum + (m.efficiency / arr.length), 0)
        ).toFixed(1)
      };
    }
    
    return shiftData;
    
  } catch (error) {
    console.error(`  ❌ Error processing file: ${error.message}`);
    return null;
  }
}

// Generate manning records from shift data
async function generateManningRecords(shiftDataArray) {
  console.log('\n📊 Generating manning insights from shift data...\n');
  
  const manningRecords = [];
  
  for (const shiftData of shiftDataArray) {
    if (!shiftData || !shiftData.date) continue;
    
    // Map shift number to shift name
    const shiftNames = {
      1: 'First Shift',
      2: 'Second Shift', 
      3: 'Third Shift'
    };
    
    const shiftName = shiftNames[shiftData.shift] || shiftData.extractedShift || 'Unknown';
    
    // Get shift ID from database
    const { data: shifts } = await supabase
      .from('shifts')
      .select('id, shift_name')
      .eq('shift_name', shiftName)
      .single();
    
    const shiftId = shifts?.id;
    
    // Create manning summary record
    const manningSummary = {
      date: shiftData.date.toISOString().split('T')[0],
      shift_name: shiftName,
      shift_id: shiftId,
      active_machines: shiftData.manning.activeMachines,
      total_machines: shiftData.manning.totalMachines,
      machine_utilization: parseFloat(shiftData.manning.utilizationRate),
      estimated_operators: shiftData.manning.estimatedOperators,
      total_production: shiftData.manning.totalHitsProduced,
      avg_efficiency: parseFloat(shiftData.manning.averageEfficiency) || 0,
      source_file: shiftData.fileName
    };
    
    // For each active machine, create a manning record
    for (const machine of shiftData.production) {
      if (machine.totalStrokes > 0) {
        const record = {
          date: shiftData.date.toISOString().split('T')[0],
          shift_id: shiftId,
          machine_number: machine.machine,
          hours_worked: machine.details.reduce((sum, d) => sum + (d.hours || 0), 0),
          parts_produced: machine.totalStrokes,
          production_efficiency: machine.efficiency ? (machine.efficiency * 100) : null,
          attendance_status: 'present', // Assume present if machine was running
          imported_from: shiftData.fileName
        };
        
        manningRecords.push(record);
      }
    }
    
    console.log(`✅ Processed ${shiftData.fileName}:`);
    console.log(`   - Date: ${manningSummary.date}`);
    console.log(`   - Shift: ${manningSummary.shift_name}`);
    console.log(`   - Active Machines: ${manningSummary.active_machines}/${manningSummary.total_machines}`);
    console.log(`   - Utilization: ${manningSummary.machine_utilization}%`);
    console.log(`   - Total Production: ${manningSummary.total_production} hits`);
  }
  
  return manningRecords;
}

// Main execution
async function main() {
  console.log('🚀 Toledo Tool & Die Manning Data Extraction\n');
  console.log('=' .repeat(60));
  
  const excelDir = '/Users/thefortob/Development/ToledoToolAndDie';
  
  // Get all Excel files
  const files = fs.readdirSync(excelDir)
    .filter(file => (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
                    (file.includes('Shift') || /\d{1,2}\.\d{1,2}\.\d{2}/.test(file)))
    .sort();
  
  console.log(`\n📁 Found ${files.length} Excel files to process`);
  
  // Process files
  const allShiftData = [];
  
  for (const file of files.slice(0, 10)) { // Process first 10 files as sample
    const filePath = path.join(excelDir, file);
    const shiftData = extractShiftData(filePath);
    if (shiftData) {
      allShiftData.push(shiftData);
    }
  }
  
  // Generate manning records
  const manningRecords = await generateManningRecords(allShiftData);
  
  // Save to JSON for review
  const outputPath = path.join(__dirname, 'manning-data-extract.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    summary: {
      filesProcessed: allShiftData.length,
      totalRecords: manningRecords.length,
      dateRange: {
        start: allShiftData.reduce((min, s) => s.date < min ? s.date : min, allShiftData[0]?.date),
        end: allShiftData.reduce((max, s) => s.date > max ? s.date : max, allShiftData[0]?.date)
      }
    },
    shiftData: allShiftData,
    manningRecords
  }, null, 2));
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Extraction complete!');
  console.log(`📄 Data saved to: ${outputPath}`);
  console.log('\nSummary:');
  console.log(`  - Files processed: ${allShiftData.length}`);
  console.log(`  - Manning records generated: ${manningRecords.length}`);
  console.log('\n💡 Next steps:');
  console.log('  1. Review the extracted data in manning-data-extract.json');
  console.log('  2. Run the import script to load into database');
  console.log('  3. Update AI Report Generator to include manning reports');
}

main().catch(console.error);