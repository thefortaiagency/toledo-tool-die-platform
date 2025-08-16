const XLSX = require('xlsx')
const fs = require('fs')

// Read the Excel file
const workbook = XLSX.readFile('/Users/thefortob/Development/ToledoToolAndDie/Hits Tracking 2025.xlsx')
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

console.log('Excel File Analysis')
console.log('='*80)
console.log(`Total Rows: ${data.length}`)
console.log(`Total Columns: ${data[0] ? data[0].length : 0}`)
console.log('')

// Machine row positions based on the expected structure
const machineRows = {
  '600 Ton': 4,
  '1500-1': 18,
  '1500-2': 32,
  '1400': 46,
  '1000T': 60,
  'Hyd': 74
}

console.log('Machine Data Analysis:')
console.log('-'*40)

// Check each machine's data
for (const [machineName, row] of Object.entries(machineRows)) {
  console.log(`\n${machineName} (Row ${row + 1}):`);
  
  if (row < data.length && data[row]) {
    // Count non-null values in this machine's row
    let dataCount = 0;
    let totalHits = 0;
    let weekCount = 0;
    
    // Check each week column (every 9 columns starting from column 1)
    for (let col = 1; col < data[row].length; col += 9) {
      // Check if this week has any data
      let weekHits = 0;
      let hasData = false;
      
      for (let day = 0; day < 7; day++) {
        const value = data[row][col + day];
        if (value !== null && value !== undefined && value !== '' && value !== 0) {
          hasData = true;
          weekHits += parseFloat(value) || 0;
        }
      }
      
      if (hasData) {
        weekCount++;
        totalHits += weekHits;
        
        // Show first and last week with data
        if (weekCount === 1) {
          // Calculate week date
          const weekNum = Math.floor(col / 9) + 1;
          console.log(`  First data: Week ${weekNum} (Col ${col + 1})`);
        }
      }
      
      dataCount += hasData ? 1 : 0;
    }
    
    console.log(`  Weeks with data: ${weekCount}`);
    console.log(`  Total hits across all weeks: ${totalHits.toLocaleString()}`);
    
    if (weekCount === 0) {
      console.log(`  ⚠️  NO DATA FOUND FOR THIS MACHINE`);
    }
  } else {
    console.log(`  ❌ Row ${row + 1} doesn't exist in file`);
  }
}

// Sample some actual data
console.log('\n\nSample Data from Excel:')
console.log('-'*40)

// Show headers
console.log('\nRow 4 (Headers):')
if (data[3]) {
  console.log('Columns 1-10:', data[3].slice(0, 10));
}

// Show data for each machine row
for (const [machineName, row] of Object.entries(machineRows)) {
  if (row < data.length && data[row]) {
    console.log(`\n${machineName} (Row ${row + 1}):`);
    console.log('First 10 values:', data[row].slice(0, 10).map(v => v === null ? 'null' : v));
    
    // Check a few week totals
    const weekTotals = [];
    for (let col = 8; col < data[row].length; col += 9) {
      if (data[row][col] !== null && data[row][col] !== undefined) {
        weekTotals.push(`Col ${col + 1}: ${data[row][col]}`);
      }
      if (weekTotals.length >= 3) break;
    }
    if (weekTotals.length > 0) {
      console.log('Sample week totals:', weekTotals.join(', '));
    }
  }
}

// Check if there's data in unexpected places
console.log('\n\nSearching for unexpected data locations:')
console.log('-'*40)

for (let row = 0; row < Math.min(100, data.length); row++) {
  if (!Object.values(machineRows).includes(row)) {
    // Check if this row has significant numeric data
    let numericCount = 0;
    let total = 0;
    
    if (data[row]) {
      for (let col = 1; col < data[row].length; col++) {
        const value = data[row][col];
        if (typeof value === 'number' && value > 100) {
          numericCount++;
          total += value;
        }
      }
      
      if (numericCount > 10) {
        console.log(`Row ${row + 1}: ${numericCount} numeric values, total: ${total.toLocaleString()}`);
        console.log('  First value:', data[row][0]);
        console.log('  Sample values:', data[row].slice(1, 10).filter(v => v > 100));
      }
    }
  }
}