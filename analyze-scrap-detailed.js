const XLSX = require('xlsx');

// Let's look at January in detail
const file = '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/January Summary.xlsx';
const workbook = XLSX.readFile(file);

console.log('Sheets in January file:', workbook.SheetNames);
console.log('\n');

// Analyze each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Sheet: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`Rows: ${data.length}, Columns: ${data[0]?.length || 0}`);
  
  // Show first 10 rows to understand structure
  console.log('\nFirst 10 rows:');
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.length > 0) {
      console.log(`Row ${i}:`, row.slice(0, 8)); // First 8 columns
    }
  }
  
  // Look for summary/total rows
  console.log('\nRows containing "Total" or summary data:');
  data.forEach((row, idx) => {
    if (row && row[0] && typeof row[0] === 'string') {
      if (row[0].toLowerCase().includes('total') || 
          row[0].toLowerCase().includes('grand') ||
          row[0].toLowerCase().includes('sum')) {
        console.log(`Row ${idx}:`, row);
      }
    }
  });
  
  // Look for numeric data in last rows
  console.log('\nLast 5 rows (possible totals):');
  for (let i = Math.max(0, data.length - 5); i < data.length; i++) {
    const row = data[i];
    if (row && row.length > 0) {
      console.log(`Row ${i}:`, row);
    }
  }
});