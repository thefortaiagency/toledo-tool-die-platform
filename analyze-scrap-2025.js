const XLSX = require('xlsx');
const fs = require('fs');

// Analyze all 2025 scrap files
const scrapFiles = [
  { month: 'January', file: '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/January Summary.xlsx' },
  { month: 'February', file: '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/February Summary.xlsx' },
  { month: 'March', file: '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/March Summary.xlsx' },
  { month: 'April', file: '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/April Summary.xlsx' },
  { month: 'May', file: '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/May Summary.xlsx' },
  { month: 'June', file: '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/June Summary.xlsx' }
];

console.log('=== 2025 SCRAP DATA ANALYSIS ===\n');

const monthlyData = {};

scrapFiles.forEach(({ month, file }) => {
  console.log(`\nAnalyzing ${month} 2025...`);
  console.log('-'.repeat(40));
  
  const workbook = XLSX.readFile(file);
  const sheetName = workbook.SheetNames[0]; // Usually 'Pioneer'
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find the row with total scrap cost (usually near bottom)
  let totalScrapCost = 0;
  let scrapDetails = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Look for total row
    if (row[0] && typeof row[0] === 'string') {
      if (row[0].toLowerCase().includes('total') || row[0].toLowerCase().includes('grand')) {
        // Find the cost column (usually one of the last columns)
        for (let j = row.length - 1; j >= 0; j--) {
          if (typeof row[j] === 'number' && row[j] > 1000) {
            totalScrapCost = row[j];
            break;
          }
        }
      }
    }
    
    // Collect part-specific scrap data
    if (row[1] && typeof row[1] === 'string' && row[1].match(/^\d{5,}/)) {
      // This looks like a part number
      const partNumber = row[1];
      const scrapQty = row[3] || 0;
      const scrapCost = row[row.length - 1] || row[row.length - 2] || 0;
      
      if (scrapCost > 0) {
        scrapDetails.push({
          partNumber,
          quantity: scrapQty,
          cost: scrapCost
        });
      }
    }
  }
  
  // Sort by cost to find top offenders
  scrapDetails.sort((a, b) => b.cost - a.cost);
  
  monthlyData[month] = {
    totalCost: totalScrapCost,
    topParts: scrapDetails.slice(0, 5),
    totalParts: scrapDetails.length
  };
  
  console.log(`Total Scrap Cost: $${totalScrapCost.toLocaleString()}`);
  console.log(`Number of Parts with Scrap: ${scrapDetails.length}`);
  
  if (scrapDetails.length > 0) {
    console.log('\nTop 5 Scrap Cost Parts:');
    scrapDetails.slice(0, 5).forEach((part, idx) => {
      console.log(`  ${idx + 1}. Part ${part.partNumber}: $${part.cost.toLocaleString()} (Qty: ${part.quantity})`);
    });
  }
});

// Summary
console.log('\n\n=== 2025 YTD SUMMARY ===');
console.log('=' * 50);

let ytdTotal = 0;
let q1Total = 0;
let q2Total = 0;

Object.entries(monthlyData).forEach(([month, data]) => {
  console.log(`${month.padEnd(10)}: $${data.totalCost.toLocaleString().padStart(10)}`);
  ytdTotal += data.totalCost;
  
  if (['January', 'February', 'March'].includes(month)) {
    q1Total += data.totalCost;
  } else {
    q2Total += data.totalCost;
  }
});

console.log('-'.repeat(25));
console.log(`Q1 Total:    $${q1Total.toLocaleString()}`);
console.log(`Q2 Total:    $${q2Total.toLocaleString()}`);
console.log(`YTD Total:   $${ytdTotal.toLocaleString()}`);

// Compare with Pioneer data
console.log('\n=== COMPARISON WITH PIONEER EXCEL ===');
console.log('Pioneer Excel Q1 Scrap: $80,829');
console.log('Pioneer Excel Q2 Scrap: $83,187');
console.log('Pioneer Excel YTD:      $164,016');
console.log('\nScrapInfo Q1 Total:     $' + q1Total.toLocaleString());
console.log('ScrapInfo Q2 Total:     $' + q2Total.toLocaleString());
console.log('ScrapInfo YTD Total:    $' + ytdTotal.toLocaleString());

const difference = ytdTotal - 164016;
console.log(`\nDifference: $${Math.abs(difference).toLocaleString()} ${difference > 0 ? 'higher' : 'lower'} in ScrapInfo`);

// Save to JSON for use in reports
const scrapAnalysis = {
  monthly: monthlyData,
  quarterly: {
    Q1: { total: q1Total, months: ['January', 'February', 'March'] },
    Q2: { total: q2Total, months: ['April', 'May', 'June'] }
  },
  ytd: {
    total: ytdTotal,
    averageMonthly: ytdTotal / 6
  },
  comparison: {
    pioneerYTD: 164016,
    scrapInfoYTD: ytdTotal,
    difference: difference
  }
};

fs.writeFileSync('scrap-2025-analysis.json', JSON.stringify(scrapAnalysis, null, 2));
console.log('\n\nDetailed analysis saved to scrap-2025-analysis.json');