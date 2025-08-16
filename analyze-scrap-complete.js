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

console.log('=== 2025 SCRAP DATA ANALYSIS (FROM SCRAPINFO FILES) ===\n');

const monthlyData = {};
const machineBreakdown = {};
const topScrapParts = [];

scrapFiles.forEach(({ month, file }) => {
  console.log(`\nAnalyzing ${month} 2025...`);
  console.log('-'.repeat(50));
  
  const workbook = XLSX.readFile(file);
  
  // Look for Sheet1 which has the summary
  if (workbook.Sheets['Sheet1']) {
    const sheet = workbook.Sheets['Sheet1'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let monthTotal = 0;
    const machines = {};
    
    data.forEach(row => {
      if (row[0] && typeof row[0] === 'string' && row[1] && typeof row[1] === 'number') {
        if (row[0].includes('Grand Total')) {
          monthTotal = row[1];
        } else if (row[0].startsWith('WC-')) {
          machines[row[0]] = row[1];
        }
      }
    });
    
    monthlyData[month] = {
      total: monthTotal,
      machines: machines
    };
    
    console.log(`Total Scrap Cost: $${monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    
    if (Object.keys(machines).length > 0) {
      console.log('By Machine:');
      Object.entries(machines).forEach(([machine, cost]) => {
        console.log(`  ${machine.padEnd(15)}: $${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        
        // Accumulate machine totals
        if (!machineBreakdown[machine]) {
          machineBreakdown[machine] = 0;
        }
        machineBreakdown[machine] += cost;
      });
    }
  }
  
  // Look for detailed scrap data
  const detailSheet = workbook.Sheets['Scrap_By_Part_and_Operation_202'] || 
                     workbook.Sheets['Scrap By Part and Operation'];
  
  if (detailSheet) {
    const detailData = XLSX.utils.sheet_to_json(detailSheet, { header: 1 });
    
    // Aggregate by part number
    const partTotals = {};
    
    for (let i = 1; i < detailData.length; i++) {
      const row = detailData[i];
      const partNo = row[0];
      const qty = row[2] || 0;
      const cost = row[6] || 0;
      const reason = row[3] || '';
      
      if (partNo && cost > 0) {
        if (!partTotals[partNo]) {
          partTotals[partNo] = { qty: 0, cost: 0, reasons: [] };
        }
        partTotals[partNo].qty += qty;
        partTotals[partNo].cost += cost;
        if (reason && !partTotals[partNo].reasons.includes(reason)) {
          partTotals[partNo].reasons.push(reason);
        }
      }
    }
    
    // Get top 3 parts for this month
    const sortedParts = Object.entries(partTotals)
      .map(([part, data]) => ({ part, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 3);
    
    if (sortedParts.length > 0) {
      console.log('Top Scrap Parts:');
      sortedParts.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.part}: $${item.cost.toFixed(2)} (Qty: ${item.qty})`);
        topScrapParts.push({ ...item, month });
      });
    }
  }
});

// Calculate quarterly and YTD totals
const q1Total = (monthlyData['January']?.total || 0) + 
                (monthlyData['February']?.total || 0) + 
                (monthlyData['March']?.total || 0);

const q2Total = (monthlyData['April']?.total || 0) + 
                (monthlyData['May']?.total || 0) + 
                (monthlyData['June']?.total || 0);

const ytdTotal = q1Total + q2Total;

console.log('\n\n=== 2025 YTD SUMMARY (SCRAPINFO DATA) ===');
console.log('='.repeat(60));

const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June'];
monthOrder.forEach(month => {
  const total = monthlyData[month]?.total || 0;
  console.log(`${month.padEnd(10)}: $${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)}`);
});

console.log('-'.repeat(60));
console.log(`Q1 Total:    $${q1Total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`Q2 Total:    $${q2Total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`YTD Total:   $${ytdTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

console.log('\n=== MACHINE BREAKDOWN (YTD) ===');
const sortedMachines = Object.entries(machineBreakdown)
  .sort((a, b) => b[1] - a[1]);

sortedMachines.forEach(([machine, total]) => {
  const percentage = (total / ytdTotal * 100).toFixed(1);
  console.log(`${machine.padEnd(15)}: $${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)} (${percentage}%)`);
});

console.log('\n=== COMPARISON: PIONEER EXCEL vs SCRAPINFO ===');
console.log('-'.repeat(60));

// Pioneer data from the executive report
const pioneerData = {
  'January': 29610,
  'February': 25946,
  'March': 25273,
  'April': 26588,
  'May': 27641,
  'June': 28958,
  'Q1': 80829,
  'Q2': 83187,
  'YTD': 164016
};

console.log('Month       Pioneer Excel    ScrapInfo       Difference');
console.log('-'.repeat(60));

monthOrder.forEach(month => {
  const pioneer = pioneerData[month];
  const scrapInfo = monthlyData[month]?.total || 0;
  const diff = scrapInfo - pioneer;
  const sign = diff > 0 ? '+' : '';
  
  console.log(`${month.padEnd(10)} $${pioneer.toLocaleString().padStart(10)} → $${scrapInfo.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).padStart(10)}    ${sign}$${diff.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
});

console.log('-'.repeat(60));
console.log(`Q1         $${pioneerData.Q1.toLocaleString().padStart(10)} → $${q1Total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).padStart(10)}    ${q1Total > pioneerData.Q1 ? '+' : ''}$${(q1Total - pioneerData.Q1).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
console.log(`Q2         $${pioneerData.Q2.toLocaleString().padStart(10)} → $${q2Total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).padStart(10)}    ${q2Total > pioneerData.Q2 ? '+' : ''}$${(q2Total - pioneerData.Q2).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
console.log(`YTD        $${pioneerData.YTD.toLocaleString().padStart(10)} → $${ytdTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).padStart(10)}    ${ytdTotal > pioneerData.YTD ? '+' : ''}$${(ytdTotal - pioneerData.YTD).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);

console.log('\n=== KEY INSIGHTS ===');
if (ytdTotal < pioneerData.YTD) {
  console.log(`✓ ScrapInfo shows LOWER scrap costs than Pioneer Excel by $${(pioneerData.YTD - ytdTotal).toLocaleString()}`);
  console.log('  This could indicate:');
  console.log('  - Different accounting methods or timing');
  console.log('  - Some scrap costs may be recorded elsewhere');
  console.log('  - Pioneer Excel may include projected/estimated costs');
} else {
  console.log(`⚠ ScrapInfo shows HIGHER scrap costs than Pioneer Excel by $${(ytdTotal - pioneerData.YTD).toLocaleString()}`);
}

// Save corrected data for reports
const correctedScrapData = {
  monthly: monthlyData,
  quarterly: {
    Q1: { 
      total: q1Total, 
      months: ['January', 'February', 'March'],
      pioneerTotal: pioneerData.Q1,
      difference: q1Total - pioneerData.Q1
    },
    Q2: { 
      total: q2Total, 
      months: ['April', 'May', 'June'],
      pioneerTotal: pioneerData.Q2,
      difference: q2Total - pioneerData.Q2
    }
  },
  ytd: {
    total: ytdTotal,
    pioneerTotal: pioneerData.YTD,
    difference: ytdTotal - pioneerData.YTD
  },
  machineBreakdown: machineBreakdown,
  topParts: topScrapParts.slice(0, 10)
};

fs.writeFileSync('scrap-2025-corrected.json', JSON.stringify(correctedScrapData, null, 2));
console.log('\n✓ Corrected analysis saved to scrap-2025-corrected.json');