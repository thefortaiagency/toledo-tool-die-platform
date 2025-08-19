const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/Users/thefortob/Development/ToledoToolAndDie/8-1 to 10-30 Capacity.xlsx';

// Read the workbook
const workbook = XLSX.readFile(filePath);

// Get all sheet names
const sheetNames = workbook.SheetNames;

console.log(`Total sheets: ${sheetNames.length}`);
console.log('\nSheet names:');
sheetNames.forEach((name, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${name}`);
});

// Analyze each sheet
console.log('\n=== Analyzing Sheet Structure ===');

const sheetAnalysis = {};

sheetNames.forEach((sheetName, index) => {
  if (index < 5) { // Sample first 5 sheets
    console.log(`\n--- Sheet: ${sheetName} ---`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`Rows: ${jsonData.length}`);
    
    if (jsonData.length > 0) {
      console.log(`Columns: ${jsonData[0].length}`);
      console.log(`Headers: ${JSON.stringify(jsonData[0].slice(0, 10))}`);
      
      // Get sample data
      if (jsonData.length > 1) {
        console.log(`Sample row 2: ${JSON.stringify(jsonData[1].slice(0, 10))}`);
      }
    }
    
    // Store for later use
    sheetAnalysis[sheetName] = {
      rows: jsonData.length,
      columns: jsonData[0]?.length || 0,
      headers: jsonData[0] || [],
      data: jsonData
    };
  }
});

// Save analysis for processing
fs.writeFileSync('capacity-analysis.json', JSON.stringify(sheetAnalysis, null, 2));
console.log('\nAnalysis saved to capacity-analysis.json');