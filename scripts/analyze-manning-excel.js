const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Function to analyze Excel file
function analyzeExcelFile(filePath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Analyzing: ${path.basename(filePath)}`);
  console.log('='.repeat(80));
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`Sheet names: ${sheetNames.join(', ')}`);
    
    const manningData = [];
    
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) return;
      
      console.log(`\n--- Sheet: ${sheetName} ---`);
      console.log(`Rows: ${jsonData.length}`);
      
      // Get headers (first row)
      const headers = jsonData[0] || [];
      console.log(`Headers: ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`);
      
      // Look for manning/attendance related columns
      const manningKeywords = ['manning', 'attend', 'operator', 'employee', 'name', 'shift', 'hours', 'present', 'absent', 'overtime', 'ot'];
      const relevantHeaders = headers.filter(h => {
        if (!h) return false;
        const lower = h.toString().toLowerCase();
        return manningKeywords.some(keyword => lower.includes(keyword));
      });
      
      if (relevantHeaders.length > 0) {
        console.log(`\n🎯 Found manning-related columns: ${relevantHeaders.join(', ')}`);
        
        // Get sample data
        const sampleRows = jsonData.slice(1, 4).map(row => {
          const obj = {};
          headers.forEach((header, idx) => {
            if (relevantHeaders.includes(header)) {
              obj[header] = row[idx];
            }
          });
          return obj;
        });
        
        console.log('Sample data:');
        console.log(JSON.stringify(sampleRows, null, 2));
        
        // Store for summary
        manningData.push({
          sheet: sheetName,
          headers: relevantHeaders,
          rowCount: jsonData.length - 1
        });
      }
      
      // Also check for date patterns that might indicate shift dates
      const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
      const datesFound = [];
      
      jsonData.slice(0, 10).forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (cell && datePattern.test(cell.toString())) {
            if (!datesFound.some(d => d.value === cell.toString())) {
              datesFound.push({
                row: rowIdx,
                col: colIdx,
                value: cell.toString(),
                header: headers[colIdx] || `Column ${colIdx}`
              });
            }
          }
        });
      });
      
      if (datesFound.length > 0) {
        console.log(`\n📅 Date values found:`);
        datesFound.forEach(d => {
          console.log(`  - Row ${d.row}, ${d.header}: ${d.value}`);
        });
      }
      
      // Look for shift patterns (1st, 2nd, 3rd)
      const shiftPattern = /(1st|2nd|3rd|first|second|third)\s*shift/i;
      const shiftsFound = [];
      
      jsonData.slice(0, 20).forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (cell && shiftPattern.test(cell.toString())) {
            shiftsFound.push({
              row: rowIdx,
              col: colIdx,
              value: cell.toString(),
              header: headers[colIdx] || `Column ${colIdx}`
            });
          }
        });
      });
      
      if (shiftsFound.length > 0) {
        console.log(`\n👥 Shift references found:`);
        shiftsFound.forEach(s => {
          console.log(`  - Row ${s.row}, ${s.header}: ${s.value}`);
        });
      }
    });
    
    return manningData;
    
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return [];
  }
}

// Main execution
console.log('🔍 Searching for manning/attendance data in Toledo Tool & Die Excel files...\n');

const excelDir = '/Users/thefortob/Development/ToledoToolAndDie';
const files = fs.readdirSync(excelDir)
  .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
  .filter(file => file.includes('Shift') || /\d{1,2}\.\d{1,2}\.\d{2}/.test(file));

const allManningData = [];

// Analyze a few representative files
const filesToAnalyze = [
  'Shift Update v22 8-2-25.xlsx',
  'Shift Update v22.xlsx',
  '8.14.25.2.xlsx',
  '7.31.25.3.xlsx'
];

filesToAnalyze.forEach(file => {
  const filePath = path.join(excelDir, file);
  if (fs.existsSync(filePath)) {
    const data = analyzeExcelFile(filePath);
    if (data.length > 0) {
      allManningData.push({ file, data });
    }
  }
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('SUMMARY OF MANNING DATA FOUND');
console.log('='.repeat(80));

if (allManningData.length > 0) {
  allManningData.forEach(({ file, data }) => {
    console.log(`\n📁 ${file}:`);
    data.forEach(d => {
      console.log(`  - Sheet "${d.sheet}": ${d.rowCount} rows`);
      console.log(`    Columns: ${d.headers.join(', ')}`);
    });
  });
} else {
  console.log('No specific manning columns found with obvious headers.');
  console.log('The data might be in a different format or use different column names.');
}

console.log('\n💡 Recommendation: Check the actual Excel files manually to identify the exact structure.');