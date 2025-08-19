const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/Users/thefortob/Development/ToledoToolAndDie/8-1 to 10-30 Capacity.xlsx';

// Read the workbook
const workbook = XLSX.readFile(filePath);

// Function to extract press capacity data
function extractPressData(sheetName, worksheet) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  let pressInfo = {
    name: sheetName,
    shifts: null,
    hoursPerShift: null,
    downtimePerShift: null,
    daysPerWeek: null,
    netAvailableTime: null,
    oee: null,
    parts: [],
    totalCapacity: null,
    allocation: null
  };
  
  // Extract key metrics
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Shifts per day
    if (row[0] && String(row[0]).includes('Shifts / Day')) {
      pressInfo.shifts = row[1];
    }
    
    // Hours per shift
    if (row[0] && String(row[0]).includes('Total Hours / Shift')) {
      pressInfo.hoursPerShift = row[1];
    }
    
    // Downtime
    if (row[0] && String(row[0]).includes('Contractual Planned Downtime')) {
      pressInfo.downtimePerShift = row[1];
    }
    
    // Days per week
    if (row[0] && String(row[0]).includes('Days / Week')) {
      pressInfo.daysPerWeek = row[1];
    }
    
    // Net Available Time
    if (row[0] && String(row[0]).includes('Net Available Time')) {
      pressInfo.netAvailableTime = row[1];
    }
    
    // OEE
    if (row[0] && String(row[0]).includes('Demonstrated Press OEE')) {
      pressInfo.oee = row[1];
    }
    
    // Part data (usually starts after row 25)
    if (i > 25 && row[0] && !String(row[0]).includes('Total')) {
      const partData = {
        partNumber: row[0],
        aveRun: row[1],
        requiredWeeks: row[2],
        totalParts: row[3],
        spm: row[4],
        efficiency: row[5],
        totalStrokes: row[6],
        totalHours: row[7],
        percentAllocation: row[8]
      };
      
      // Only add if there's actual part data
      if (partData.partNumber && partData.totalParts) {
        pressInfo.parts.push(partData);
      }
    }
    
    // Total capacity
    if (row[0] && String(row[0]).includes('Total # of Parts')) {
      pressInfo.totalCapacity = row[1];
    }
    
    // Total allocation
    if (row[0] && String(row[0]).includes('Total % Allocation')) {
      pressInfo.allocation = row[1];
    }
  }
  
  return pressInfo;
}

// Extract data from all press sheets
const allPressData = {};
const pressSheets = workbook.SheetNames.filter(name => 
  name !== 'Example' && 
  name !== 'Capacity Summary ' && 
  name !== 'DATA to transfer'
);

pressSheets.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  allPressData[sheetName] = extractPressData(sheetName, worksheet);
});

// Extract capacity summary data
const summarySheet = workbook.Sheets['Capacity Summary '];
const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });

// Parse summary data to get overview
const summaryInfo = {
  title: 'Capacity Summary',
  basedOn: '50 WEEKS',
  presses: []
};

let currentPress = null;
for (let i = 0; i < summaryData.length; i++) {
  const row = summaryData[i];
  if (!row || row.length === 0) continue;
  
  // Look for press entries
  if (row[0] === 'Press Tonage' && row[1]) {
    if (currentPress) {
      summaryInfo.presses.push(currentPress);
    }
    currentPress = {
      name: row[1],
      apw: { nat: null, oee: null, totalParts: null, allocation: null },
      mpw: { nat: null, oee: null, totalParts: null, allocation: null }
    };
  }
  
  if (currentPress) {
    if (row[0] && String(row[0]).includes('Net Available Time')) {
      currentPress.apw.nat = row[1];
      currentPress.mpw.nat = row[2];
    }
    if (row[0] && String(row[0]).includes('Demonstrated Press OEE')) {
      currentPress.apw.oee = row[1];
      currentPress.mpw.oee = row[1]; // Same for both
    }
    if (row[0] && String(row[0]).includes('Total # of Parts')) {
      currentPress.apw.totalParts = row[1];
      currentPress.mpw.totalParts = row[2];
    }
    if (row[0] && String(row[0]).includes('Total % Allocation')) {
      currentPress.apw.allocation = row[1];
      currentPress.mpw.allocation = row[2];
    }
  }
}

if (currentPress) {
  summaryInfo.presses.push(currentPress);
}

// Combine all data
const completeCapacityData = {
  summary: summaryInfo,
  presses: allPressData,
  metadata: {
    totalPresses: pressSheets.length,
    dateRange: '8/1 to 10/30',
    extractedAt: new Date().toISOString()
  }
};

// Save the data
fs.writeFileSync('capacity-complete.json', JSON.stringify(completeCapacityData, null, 2));
console.log('✅ Complete capacity data extracted to capacity-complete.json');

// Print summary
console.log('\n=== CAPACITY OVERVIEW ===');
console.log(`Total Presses: ${pressSheets.length}`);
console.log('Press Types:', pressSheets.join(', '));
console.log('\nCapacity Summary:');
summaryInfo.presses.forEach(press => {
  console.log(`- ${press.name}:`);
  console.log(`  APW: ${press.apw.totalParts} parts, ${(press.apw.allocation * 100).toFixed(1)}% allocation`);
  console.log(`  MPW: ${press.mpw.totalParts} parts, ${(press.mpw.allocation * 100).toFixed(1)}% allocation`);
});