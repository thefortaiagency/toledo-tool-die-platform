const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const scrapDir = '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo';
const files = fs.readdirSync(scrapDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

console.log('🔍 ANALYZING ALL EXCEL SHEETS IN SCRAP INFO FOLDER\n');

files.forEach(file => {
  console.log('📁 FILE:', file);
  console.log('='.repeat(60));
  
  try {
    const workbook = xlsx.readFile(path.join(scrapDir, file));
    const sheetNames = workbook.SheetNames;
    
    console.log('Number of sheets:', sheetNames.length);
    console.log('Sheet names:', sheetNames);
    
    sheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      console.log('\n  📊 Sheet:', sheetName);
      console.log('  Rows:', data.length);
      
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('  Columns:', columns);
        
        // Analyze data
        const operations = new Set();
        const reasons = new Set();
        const workcenters = new Set();
        const partNumbers = new Set();
        let nonZeroCost = 0;
        let totalQty = 0;
        let totalExtendedCost = 0;
        
        data.forEach(row => {
          // Check all possible column name variations
          const op = row.Operation || row.operation || row.Op;
          const reason = row.Reason || row['Reason Code'] || row.reason;
          const wc = row.WC || row.WorkCenter || row.Workcenter || row.workcenter;
          const part = row.PartNumber || row['Part Number'] || row['Part#'];
          const qty = row.Qty || row.Quantity || row.quantity || 0;
          const unitCost = row['Unit Cost'] || row.UnitCost || row['unit cost'] || 0;
          const extCost = row['Extended Cost'] || row.ExtendedCost || row['extended cost'] || 0;
          
          if (op) operations.add(op);
          if (reason) reasons.add(reason);
          if (wc) workcenters.add(wc);
          if (part) partNumbers.add(part);
          if (unitCost > 0) nonZeroCost++;
          
          totalQty += Number(qty) || 0;
          totalExtendedCost += Number(extCost) || 0;
        });
        
        console.log('\n  📈 STATISTICS:');
        console.log('  Total Quantity:', totalQty.toLocaleString());
        console.log('  Total Extended Cost: $' + totalExtendedCost.toFixed(2));
        console.log('  Unique Operations:', operations.size);
        console.log('  Unique Reasons:', reasons.size);
        console.log('  Unique Workcenters:', workcenters.size);
        console.log('  Unique Part Numbers:', partNumbers.size);
        
        if (nonZeroCost > 0) {
          console.log('  ⚠️  Rows with Unit Cost > 0:', nonZeroCost);
        }
        
        if (operations.size > 0 && operations.size <= 10) {
          console.log('\n  Operations:', Array.from(operations));
        }
        if (reasons.size > 0 && reasons.size <= 10) {
          console.log('  Top Reasons:', Array.from(reasons).slice(0, 10));
        }
        if (workcenters.size > 0 && workcenters.size <= 10) {
          console.log('  Workcenters:', Array.from(workcenters));
        }
        
        // Find top scrapped parts
        const partTotals = {};
        data.forEach(row => {
          const part = row.PartNumber || row['Part Number'] || row['Part#'];
          const qty = row.Qty || row.Quantity || row.quantity || 0;
          if (part) {
            partTotals[part] = (partTotals[part] || 0) + Number(qty);
          }
        });
        
        const topParts = Object.entries(partTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        if (topParts.length > 0) {
          console.log('\n  Top 5 Scrapped Parts:');
          topParts.forEach(([part, qty]) => {
            console.log(`    ${part}: ${qty.toLocaleString()} units`);
          });
        }
      }
    });
  } catch (e) {
    console.log('  Error reading file:', e.message);
  }
  
  console.log('\n');
});