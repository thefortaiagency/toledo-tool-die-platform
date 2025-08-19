const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/Users/thefortob/Development/ToledoToolAndDie/8-1 to 10-30 Capacity.xlsx';

// Read the workbook
const workbook = XLSX.readFile(filePath);

// Get all sheet names
const sheetNames = workbook.SheetNames;

console.log(`Total sheets: ${sheetNames.length}`);
console.log('All sheets:', sheetNames);

// Analyze Capacity Summary sheet first
const summarySheet = workbook.Sheets['Capacity Summary '];
const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });

console.log('\n=== CAPACITY SUMMARY SHEET ===');
console.log('Total rows:', summaryData.length);

// Print first 20 rows to understand structure
for (let i = 0; i < Math.min(20, summaryData.length); i++) {
  const row = summaryData[i];
  if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
    console.log(`Row ${i + 1}:`, row.filter(cell => cell !== null && cell !== undefined).slice(0, 15));
  }
}

// Analyze individual press sheets
console.log('\n=== INDIVIDUAL PRESS SHEETS ===');

const pressData = {};

// Process each press sheet
const pressSheets = sheetNames.filter(name => 
  name !== 'Example' && 
  name !== 'Capacity Summary ' && 
  name !== 'DATA to transfer'
);

pressSheets.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`\n--- ${sheetName} ---`);
  
  // Find capacity row and other key data
  let capacityInfo = {};
  
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i];
    if (row && row.length > 0) {
      // Look for capacity information
      if (row.some(cell => String(cell).includes('Capacity'))) {
        console.log(`Capacity row ${i + 1}:`, row.filter(cell => cell).slice(0, 10));
        capacityInfo.capacityRow = i;
      }
      // Look for dates
      if (row.some(cell => cell && String(cell).match(/\d{1,2}\/\d{1,2}\/\d{4}/))) {
        console.log(`Date row ${i + 1}:`, row.filter(cell => cell).slice(0, 10));
      }
      // Look for shift information
      if (row.some(cell => String(cell).includes('Shift') || String(cell).includes('shift'))) {
        console.log(`Shift row ${i + 1}:`, row.filter(cell => cell).slice(0, 10));
      }
    }
  }
  
  pressData[sheetName] = {
    totalRows: data.length,
    data: data,
    capacityInfo: capacityInfo
  };
});

// Save detailed analysis
const analysis = {
  allSheets: sheetNames,
  summaryData: summaryData.slice(0, 50), // First 50 rows of summary
  pressSheets: pressSheets,
  pressData: Object.keys(pressData).reduce((acc, key) => {
    acc[key] = {
      ...pressData[key],
      data: pressData[key].data.slice(0, 30) // First 30 rows of each press
    };
    return acc;
  }, {})
};

fs.writeFileSync('capacity-detailed.json', JSON.stringify(analysis, null, 2));
console.log('\n✅ Detailed analysis saved to capacity-detailed.json');