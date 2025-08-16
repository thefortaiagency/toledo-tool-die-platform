const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Function to analyze Excel file in detail
function deepAnalyzeExcel(filePath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Deep Analysis: ${path.basename(filePath)}`);
  console.log('='.repeat(80));
  
  try {
    const workbook = XLSX.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      console.log(`\n--- Sheet: ${sheetName} ---`);
      console.log(`Total rows: ${jsonData.length}`);
      console.log(`Total columns: ${jsonData[0] ? jsonData[0].length : 0}`);
      
      // Show first 20 rows to understand structure
      console.log('\nFirst 20 rows (showing first 8 columns):');
      jsonData.slice(0, 20).forEach((row, idx) => {
        const displayRow = row.slice(0, 8).map(cell => {
          const str = String(cell || '').substring(0, 15);
          return str.padEnd(15);
        }).join(' | ');
        console.log(`Row ${String(idx).padStart(2)}: ${displayRow}`);
      });
      
      // Look for patterns in the data
      console.log('\n🔍 Looking for patterns...');
      
      // Check for employee names (common first names)
      const namePatterns = ['john', 'jane', 'mike', 'david', 'sarah', 'mary', 'robert', 'james', 'joe'];
      const potentialNameCells = [];
      
      jsonData.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (cell && typeof cell === 'string') {
            const lower = cell.toLowerCase();
            if (namePatterns.some(name => lower.includes(name)) || 
                /^[A-Z][a-z]+ [A-Z][a-z]+/.test(cell)) { // First Last name pattern
              if (potentialNameCells.length < 5) {
                potentialNameCells.push({
                  row: rowIdx,
                  col: colIdx,
                  value: cell
                });
              }
            }
          }
        });
      });
      
      if (potentialNameCells.length > 0) {
        console.log('Potential employee names found:');
        potentialNameCells.forEach(p => {
          console.log(`  Row ${p.row}, Col ${p.col}: "${p.value}"`);
        });
      }
      
      // Look for shift indicators
      const shiftIndicators = [];
      jsonData.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (cell && typeof cell === 'string') {
            if (/shift|1st|2nd|3rd|first|second|third/i.test(cell)) {
              if (shiftIndicators.length < 5) {
                shiftIndicators.push({
                  row: rowIdx,
                  col: colIdx,
                  value: cell
                });
              }
            }
          }
        });
      });
      
      if (shiftIndicators.length > 0) {
        console.log('\nShift indicators found:');
        shiftIndicators.forEach(s => {
          console.log(`  Row ${s.row}, Col ${s.col}: "${s.value}"`);
        });
      }
      
      // Look for attendance/hours patterns (numbers that could be hours worked)
      const hoursPattern = [];
      jsonData.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (typeof cell === 'number' && cell > 0 && cell <= 24) {
            // Could be hours worked
            if (hoursPattern.length < 5) {
              hoursPattern.push({
                row: rowIdx,
                col: colIdx,
                value: cell
              });
            }
          }
        });
      });
      
      if (hoursPattern.length > 0) {
        console.log('\nPotential hours worked (1-24):');
        hoursPattern.forEach(h => {
          console.log(`  Row ${h.row}, Col ${h.col}: ${h.value}`);
        });
      }
      
      // Check specific locations that might have manning data
      // Often manning data is in summary sections
      const summaryKeywords = ['total', 'summary', 'manning', 'attendance', 'hours', 'overtime'];
      const summaryRows = [];
      
      jsonData.forEach((row, rowIdx) => {
        const rowText = row.join(' ').toLowerCase();
        if (summaryKeywords.some(keyword => rowText.includes(keyword))) {
          summaryRows.push(rowIdx);
        }
      });
      
      if (summaryRows.length > 0) {
        console.log('\nRows with summary keywords:');
        summaryRows.slice(0, 5).forEach(rowIdx => {
          console.log(`  Row ${rowIdx}: ${jsonData[rowIdx].slice(0, 5).join(' | ')}`);
        });
      }
    });
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Analyze specific files
const filesToAnalyze = [
  '/Users/thefortob/Development/ToledoToolAndDie/Shift Update v22 8-2-25.xlsx'
];

filesToAnalyze.forEach(file => {
  if (fs.existsSync(file)) {
    deepAnalyzeExcel(file);
  }
});