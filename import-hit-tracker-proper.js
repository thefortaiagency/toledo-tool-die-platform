const XLSX = require('xlsx');
const fs = require('fs');

console.log('=== IMPORTING HITS TRACKING 2025 DATA ===\n');

const file = '/Users/thefortob/Development/ToledoToolAndDie/Hits Tracking 2025.xlsx';
const workbook = XLSX.readFile(file);

// Process Sheet1 - Contains hit counts by machine and day
const sheet1 = workbook.Sheets['Sheet1'];
const hitData = XLSX.utils.sheet_to_json(sheet1, { header: 1 });

// Process Sheet2 - Contains efficiency data by machine, shift, and week
const sheet2 = workbook.Sheets['Sheet2'];
const efficiencyData = XLSX.utils.sheet_to_json(sheet2, { header: 1 });

console.log('Processing Sheet1 - Hit Counts\n');
console.log('-'.repeat(60));

// Extract hit count data
const machines = [];
const dailyHits = {};

// Find the row with days of week
let dayRowIndex = -1;
for (let i = 0; i < hitData.length; i++) {
  const row = hitData[i];
  if (row && row[1] === 'Monday') {
    dayRowIndex = i;
    break;
  }
}

if (dayRowIndex >= 0) {
  const days = hitData[dayRowIndex].slice(1, 8);
  console.log('Days found:', days.filter(d => d));
  
  // Process each machine's data
  for (let i = dayRowIndex + 1; i < hitData.length; i++) {
    const row = hitData[i];
    if (!row || !row[0]) continue;
    
    const machineName = row[0];
    if (typeof machineName === 'string' && machineName.includes('Ton')) {
      const machineData = {
        machine: machineName,
        dailyHits: {}
      };
      
      days.forEach((day, idx) => {
        if (day && row[idx + 1]) {
          machineData.dailyHits[day] = row[idx + 1];
        }
      });
      
      machineData.weeklyTotal = Object.values(machineData.dailyHits).reduce((a, b) => a + b, 0);
      machines.push(machineData);
      
      console.log(`${machineName}: ${machineData.weeklyTotal.toLocaleString()} hits/week`);
    }
  }
}

console.log('\n\nProcessing Sheet2 - Efficiency Data\n');
console.log('-'.repeat(60));

// Extract efficiency data
const efficiencyByMachine = {};
let currentMachine = '';

for (let i = 1; i < efficiencyData.length; i++) {
  const row = efficiencyData[i];
  if (!row) continue;
  
  // Check if this is a machine header row
  if (row[0] && typeof row[0] === 'string' && row[0].includes('T')) {
    currentMachine = row[0];
    efficiencyByMachine[currentMachine] = {
      shifts: {},
      weeklyAverage: []
    };
    console.log(`\nMachine: ${currentMachine}`);
  } 
  // Process shift data
  else if (row[1] && typeof row[1] === 'string' && row[1].includes('Shift')) {
    const shiftName = row[1];
    const efficiencies = [];
    
    // Collect weekly efficiency data (52 weeks)
    for (let week = 1; week <= 52; week++) {
      const value = row[week + 1];
      if (typeof value === 'number') {
        efficiencies.push(value);
      }
    }
    
    if (currentMachine && efficiencyByMachine[currentMachine]) {
      efficiencyByMachine[currentMachine].shifts[shiftName] = efficiencies;
      
      const avgEfficiency = efficiencies.length > 0 
        ? (efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length * 100).toFixed(1)
        : 0;
      
      console.log(`  ${shiftName}: ${avgEfficiency}% avg efficiency (${efficiencies.length} weeks of data)`);
    }
  }
}

// Calculate OEE components
console.log('\n\n=== OEE CALCULATION DATA ===\n');
console.log('-'.repeat(60));

const oeeData = [];

Object.keys(efficiencyByMachine).forEach(machine => {
  const machineHits = machines.find(m => m.machine.includes(machine.replace('T', ' Ton')));
  const shifts = efficiencyByMachine[machine].shifts;
  
  // Calculate average efficiency across all shifts
  let totalEfficiency = 0;
  let efficiencyCount = 0;
  
  Object.values(shifts).forEach(shiftData => {
    shiftData.forEach(eff => {
      totalEfficiency += eff;
      efficiencyCount++;
    });
  });
  
  const avgEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0;
  
  // OEE Calculation
  // Assumptions for demo (these should come from actual data):
  const plannedProductionTime = 2080; // hours per year (40 hrs/week * 52 weeks)
  const actualRunTime = plannedProductionTime * 0.85; // 85% availability assumption
  const idealCycleTime = 0.5; // minutes per part (should be actual)
  const totalParts = machineHits ? machineHits.weeklyTotal * 52 : 0; // Yearly estimate
  const goodParts = totalParts * 0.97; // 97% quality assumption (3% scrap)
  
  const availability = (actualRunTime / plannedProductionTime) * 100;
  const performance = avgEfficiency * 100;
  const quality = 97; // From PPM data
  const oee = (availability * performance * quality) / 10000;
  
  oeeData.push({
    machine: machine,
    availability: availability.toFixed(1),
    performance: performance.toFixed(1),
    quality: quality.toFixed(1),
    oee: oee.toFixed(1),
    weeklyHits: machineHits ? machineHits.weeklyTotal : 0,
    yearlyHits: totalParts
  });
  
  console.log(`${machine}:`);
  console.log(`  Availability: ${availability.toFixed(1)}%`);
  console.log(`  Performance: ${performance.toFixed(1)}%`);
  console.log(`  Quality: ${quality.toFixed(1)}%`);
  console.log(`  OEE: ${oee.toFixed(1)}%`);
});

// Prepare data for import
const importData = {
  timestamp: new Date().toISOString(),
  source: 'Hits Tracking 2025.xlsx',
  machines: machines,
  efficiency: efficiencyByMachine,
  oee: oeeData,
  summary: {
    totalWeeklyHits: machines.reduce((sum, m) => sum + m.weeklyTotal, 0),
    averageOEE: oeeData.reduce((sum, m) => sum + parseFloat(m.oee), 0) / oeeData.length,
    machineCount: machines.length
  }
};

fs.writeFileSync('hit-tracker-processed.json', JSON.stringify(importData, null, 2));
console.log('\n✓ Hit tracker data processed and saved to hit-tracker-processed.json');

// Create TypeScript data model
const tsModel = `// Hit Tracker Data Model
export interface HitTrackerData {
  machine: string;
  dailyHits: {
    [day: string]: number;
  };
  weeklyTotal: number;
}

export interface EfficiencyData {
  machine: string;
  shifts: {
    [shiftName: string]: number[]; // Weekly efficiency values
  };
}

export interface OEEData {
  machine: string;
  availability: string;
  performance: string;
  quality: string;
  oee: string;
  weeklyHits: number;
  yearlyHits: number;
}

export interface HitTrackerImport {
  timestamp: string;
  machines: HitTrackerData[];
  efficiency: { [machine: string]: EfficiencyData };
  oee: OEEData[];
  summary: {
    totalWeeklyHits: number;
    averageOEE: number;
    machineCount: number;
  };
}`;

fs.writeFileSync('app/types/hit-tracker.ts', tsModel);
console.log('✓ TypeScript interfaces created');

console.log('\n=== IMPORT COMPLETE ===');