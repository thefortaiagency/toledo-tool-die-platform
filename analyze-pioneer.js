const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = '/Users/thefortob/Development/ToledoToolAndDie/Pioneer.xlsx';
const workbook = XLSX.readFile(filePath);

console.log('Available sheets:', workbook.SheetNames);
console.log('\n');

// Analyze each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Sheet: ${sheetName} ===`);
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Rows: ${data.length}`);
  
  if (data.length > 0) {
    console.log(`Columns: ${data[0].length}`);
    console.log('\nFirst row (headers):');
    console.log(data[0]);
    
    console.log('\nFirst 5 data rows:');
    for (let i = 1; i < Math.min(6, data.length); i++) {
      console.log(`Row ${i}:`, data[i]);
    }
    
    // Try to identify data patterns
    if (data[0] && data[0].length > 0) {
      console.log('\nColumn analysis:');
      for (let col = 0; col < Math.min(10, data[0].length); col++) {
        const header = data[0][col] || `Column ${col}`;
        const values = [];
        for (let row = 1; row < Math.min(10, data.length); row++) {
          if (data[row][col] !== undefined && data[row][col] !== null && data[row][col] !== '') {
            values.push(data[row][col]);
          }
        }
        console.log(`  ${header}: ${values.slice(0, 3).join(', ')}${values.length > 3 ? '...' : ''}`);
      }
    }
  }
  
  console.log('-'.repeat(80));
});

// Save a more detailed JSON analysis
const detailedAnalysis = {};
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  detailedAnalysis[sheetName] = {
    rowCount: data.length,
    columnCount: data[0] ? data[0].length : 0,
    headers: data[0] || [],
    sampleData: data.slice(1, 6)
  };
});

fs.writeFileSync('pioneer-analysis.json', JSON.stringify(detailedAnalysis, null, 2));
console.log('\nDetailed analysis saved to pioneer-analysis.json');