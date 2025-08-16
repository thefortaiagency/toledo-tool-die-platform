const XLSX = require('xlsx');
const fs = require('fs');

console.log('📊 Generating Hit Tracker Import Template\n');

// Create sample data with all required and optional fields
const hitTrackerTemplate = [
  {
    machine: '600 Ton',
    date: '2025-08-16',
    shift: 1,
    hits: 45000,
    efficiency: 92.5,
    downtime_minutes: 15,
    operator: 'John Smith',
    part_number: 'PART-001',
    comments: 'Sample comment - delete this row before importing'
  },
  {
    machine: '1500-1 Ton',
    date: '2025-08-16',
    shift: 2,
    hits: 38000,
    efficiency: 88.0,
    downtime_minutes: 20,
    operator: 'Jane Doe',
    part_number: 'PART-002',
    comments: 'Example data - replace with actual'
  }
];

// Create OEE metrics template
const oeeTemplate = [
  {
    machine: '600 Ton',
    date: '2025-08-16',
    availability: 92.5,
    performance: 88.3,
    quality: 97.2,
    notes: 'OEE will be calculated automatically'
  },
  {
    machine: '1500-1 Ton',
    date: '2025-08-16',
    availability: 85.0,
    performance: 82.0,
    quality: 96.5,
    notes: 'Example - replace with actual data'
  }
];

// Create workbook
const workbook = XLSX.utils.book_new();

// Add Hit Tracker sheet
const hitTrackerSheet = XLSX.utils.json_to_sheet(hitTrackerTemplate);

// Set column widths for better readability
const hitTrackerCols = [
  { wch: 12 }, // machine
  { wch: 12 }, // date
  { wch: 8 },  // shift
  { wch: 10 }, // hits
  { wch: 10 }, // efficiency
  { wch: 15 }, // downtime_minutes
  { wch: 15 }, // operator
  { wch: 15 }, // part_number
  { wch: 40 }  // comments
];
hitTrackerSheet['!cols'] = hitTrackerCols;

// Add header formatting instructions
XLSX.utils.book_append_sheet(workbook, hitTrackerSheet, 'Hit Tracker Data');

// Add OEE Metrics sheet
const oeeSheet = XLSX.utils.json_to_sheet(oeeTemplate);
const oeeCols = [
  { wch: 12 }, // machine
  { wch: 12 }, // date
  { wch: 12 }, // availability
  { wch: 12 }, // performance
  { wch: 12 }, // quality
  { wch: 40 }  // notes
];
oeeSheet['!cols'] = oeeCols;
XLSX.utils.book_append_sheet(workbook, oeeSheet, 'OEE Metrics');

// Create Instructions sheet
const instructions = [
  { Field: 'Hit Tracker Data Sheet', Description: 'Import production hit tracking data' },
  { Field: '================', Description: '=================================' },
  { Field: 'machine', Description: 'Machine name (required) - e.g., "600 Ton", "1500-1 Ton"' },
  { Field: 'date', Description: 'Date in YYYY-MM-DD format (required)' },
  { Field: 'shift', Description: 'Shift number: 1, 2, or 3 (required)' },
  { Field: 'hits', Description: 'Number of hits/parts produced (required)' },
  { Field: 'efficiency', Description: 'Efficiency percentage 0-200 (optional)' },
  { Field: 'downtime_minutes', Description: 'Downtime in minutes (optional)' },
  { Field: 'operator', Description: 'Operator name (optional)' },
  { Field: 'part_number', Description: 'Part number being produced (optional)' },
  { Field: 'comments', Description: 'Any additional comments (optional)' },
  { Field: '', Description: '' },
  { Field: 'OEE Metrics Sheet', Description: 'Import OEE calculations' },
  { Field: '================', Description: '=================================' },
  { Field: 'machine', Description: 'Machine name (required)' },
  { Field: 'date', Description: 'Date in YYYY-MM-DD format (required)' },
  { Field: 'availability', Description: 'Availability % (0-100) (required)' },
  { Field: 'performance', Description: 'Performance % (0-100) (required)' },
  { Field: 'quality', Description: 'Quality % (0-100) (required)' },
  { Field: '', Description: '' },
  { Field: 'Import Process:', Description: '' },
  { Field: '1.', Description: 'Fill in the data in either sheet' },
  { Field: '2.', Description: 'Delete the example rows' },
  { Field: '3.', Description: 'Save the file' },
  { Field: '4.', Description: 'Use the import API or UI to upload' },
  { Field: '', Description: '' },
  { Field: 'API Endpoint:', Description: 'POST /api/reports/hit-tracker-import' },
  { Field: 'Max Records:', Description: '1000 per import' },
  { Field: 'Date Format:', Description: 'YYYY-MM-DD (e.g., 2025-08-16)' }
];

const instructionSheet = XLSX.utils.json_to_sheet(instructions);
instructionSheet['!cols'] = [{ wch: 20 }, { wch: 60 }];
XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

// Create validation rules sheet
const validationRules = [
  { Rule: 'Unique Constraint', Description: 'Each machine can only have one entry per date per shift' },
  { Rule: 'Shift Values', Description: 'Must be 1, 2, or 3' },
  { Rule: 'Efficiency Range', Description: '0-200% (values over 100% indicate exceeding target)' },
  { Rule: 'Date Format', Description: 'YYYY-MM-DD format required' },
  { Rule: 'Machine Names', Description: 'Must match existing machine names in system' },
  { Rule: 'OEE Components', Description: 'Availability, Performance, Quality must be 0-100%' },
  { Rule: 'OEE Calculation', Description: 'OEE = (Availability × Performance × Quality) / 10000' }
];

const validationSheet = XLSX.utils.json_to_sheet(validationRules);
validationSheet['!cols'] = [{ wch: 25 }, { wch: 60 }];
XLSX.utils.book_append_sheet(workbook, validationSheet, 'Validation Rules');

// Write the file
const fileName = 'hit-tracker-import-template.xlsx';
XLSX.writeFile(workbook, fileName);

console.log(`✅ Template created: ${fileName}`);
console.log('\nTemplate includes:');
console.log('  1. Hit Tracker Data sheet - for production data');
console.log('  2. OEE Metrics sheet - for OEE calculations');
console.log('  3. Instructions sheet - detailed field descriptions');
console.log('  4. Validation Rules sheet - data requirements');
console.log('\n📝 Instructions:');
console.log('  1. Open the template in Excel');
console.log('  2. Fill in your data (delete example rows)');
console.log('  3. Save the file');
console.log('  4. Import using the API or upload interface');

// Also create a JSON template for API testing
const jsonTemplate = {
  hitTracker: {
    type: 'hit-tracker',
    source: 'Excel Import',
    data: hitTrackerTemplate
  },
  oeeMetrics: {
    type: 'oee-metrics',
    source: 'OEE Calculator',
    data: oeeTemplate.map(row => ({
      machine: row.machine,
      date: row.date,
      availability: row.availability,
      performance: row.performance,
      quality: row.quality
    }))
  }
};

fs.writeFileSync('import-template.json', JSON.stringify(jsonTemplate, null, 2));
console.log('\n✅ JSON template also created: import-template.json');