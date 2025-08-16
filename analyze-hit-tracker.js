const XLSX = require('xlsx');
const fs = require('fs');

console.log('=== ANALYZING HITS TRACKING 2025 ===\n');

const file = '/Users/thefortob/Development/ToledoToolAndDie/Hits Tracking 2025.xlsx';
const workbook = XLSX.readFile(file);

console.log('Available sheets:', workbook.SheetNames);
console.log('\n');

// Analyze each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Sheet: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Rows: ${data.length}, Columns: ${data[0]?.length || 0}`);
  
  if (data.length > 0) {
    // Show headers
    console.log('\nHeaders (first row):');
    console.log(data[0]);
    
    // Show sample data
    console.log('\nSample data (rows 2-5):');
    for (let i = 1; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (row && row.length > 0) {
        console.log(`Row ${i + 1}:`, row.slice(0, 10)); // First 10 columns
      }
    }
    
    // Try to identify data patterns
    console.log('\nData Analysis:');
    let dateColumns = [];
    let numericColumns = [];
    let partColumns = [];
    
    // Check first data row to identify column types
    if (data.length > 1) {
      const sampleRow = data[1];
      data[0].forEach((header, idx) => {
        const value = sampleRow[idx];
        if (header && typeof header === 'string') {
          if (header.toLowerCase().includes('date') || header.toLowerCase().includes('week')) {
            dateColumns.push({ idx, name: header });
          } else if (header.toLowerCase().includes('part') || header.toLowerCase().includes('die')) {
            partColumns.push({ idx, name: header });
          } else if (typeof value === 'number') {
            numericColumns.push({ idx, name: header });
          }
        }
      });
    }
    
    console.log('  Date columns:', dateColumns.map(c => c.name).join(', ') || 'None found');
    console.log('  Part columns:', partColumns.map(c => c.name).join(', ') || 'None found');
    console.log('  Numeric columns:', numericColumns.length, 'found');
    
    // Calculate totals for numeric columns
    if (numericColumns.length > 0) {
      console.log('\nNumeric Column Totals:');
      numericColumns.slice(0, 5).forEach(col => {
        let total = 0;
        let count = 0;
        for (let i = 1; i < data.length; i++) {
          const value = data[i][col.idx];
          if (typeof value === 'number') {
            total += value;
            count++;
          }
        }
        console.log(`  ${col.name}: Total = ${total.toLocaleString()}, Avg = ${(total / count).toFixed(2)}`);
      });
    }
  }
});

// Extract and structure the data for import
console.log('\n\n=== PREPARING DATA FOR IMPORT ===\n');

const hitTrackerData = [];
const summaryData = {
  totalHits: 0,
  totalEfficiency: 0,
  machineData: {},
  weeklyData: [],
  partData: {}
};

// Process main data sheet (usually first sheet)
const mainSheet = workbook.Sheets[workbook.SheetNames[0]];
const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });

if (mainData.length > 0) {
  const headers = mainData[0];
  
  // Process each data row
  for (let i = 1; i < mainData.length; i++) {
    const row = mainData[i];
    if (!row || row.length === 0) continue;
    
    const record = {};
    headers.forEach((header, idx) => {
      if (header && row[idx] !== undefined) {
        record[header] = row[idx];
      }
    });
    
    if (Object.keys(record).length > 0) {
      hitTrackerData.push(record);
      
      // Accumulate summary data
      // Look for common fields like hits, efficiency, machine, etc.
      if (record['Total Hits'] || record['Hits'] || record['Hit Count']) {
        const hits = record['Total Hits'] || record['Hits'] || record['Hit Count'] || 0;
        summaryData.totalHits += hits;
      }
      
      if (record['Efficiency'] || record['Eff %'] || record['Efficiency %']) {
        const eff = record['Efficiency'] || record['Eff %'] || record['Efficiency %'] || 0;
        summaryData.totalEfficiency += eff;
      }
      
      // Track by machine if machine column exists
      if (record['Machine'] || record['Press']) {
        const machine = record['Machine'] || record['Press'];
        if (!summaryData.machineData[machine]) {
          summaryData.machineData[machine] = {
            hits: 0,
            efficiency: 0,
            count: 0
          };
        }
        summaryData.machineData[machine].count++;
      }
    }
  }
}

console.log(`Total records to import: ${hitTrackerData.length}`);
console.log(`Total hits tracked: ${summaryData.totalHits.toLocaleString()}`);
console.log(`Machines found: ${Object.keys(summaryData.machineData).join(', ') || 'None identified'}`);

// Save processed data for import
const importData = {
  timestamp: new Date().toISOString(),
  source: 'Hits Tracking 2025.xlsx',
  recordCount: hitTrackerData.length,
  summary: summaryData,
  data: hitTrackerData.slice(0, 100) // First 100 records for initial import
};

fs.writeFileSync('hit-tracker-import.json', JSON.stringify(importData, null, 2));
console.log('\n✓ Data prepared for import and saved to hit-tracker-import.json');

// Create TypeScript interface based on data structure
if (hitTrackerData.length > 0) {
  const sampleRecord = hitTrackerData[0];
  console.log('\n=== TypeScript Interface for Hit Tracker Data ===');
  console.log('export interface HitTrackerRecord {');
  Object.keys(sampleRecord).forEach(key => {
    const value = sampleRecord[key];
    const type = typeof value === 'number' ? 'number' : 
                 value instanceof Date ? 'Date' : 'string';
    console.log(`  '${key}': ${type};`);
  });
  console.log('}');
}