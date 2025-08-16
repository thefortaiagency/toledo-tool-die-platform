const XLSX = require('xlsx');

// Read the Excel file
const filePath = '/Users/thefortob/Development/ToledoToolAndDie/Pioneer.xlsx';
const workbook = XLSX.readFile(filePath);

// Focus on the Overall sheet which has the main metrics
const sheet = workbook.Sheets['Overall'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('=== Pioneer.xlsx Data Analysis ===\n');
console.log('Overall Sheet Analysis:');
console.log('-----------------------');

// Group metrics by category
const metrics = {
  quality: [],
  production: [],
  efficiency: [],
  safety: [],
  onTime: [],
  maintenance: []
};

// Parse the data and categorize metrics
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (!row[1]) continue; // Skip empty rows
  
  const category = row[0];
  const metric = row[1];
  const results2024 = row[2];
  const annualGoal = row[3];
  const monthlyData = {
    january: row[4],
    february: row[5],
    march: row[6],
    q1Goal: row[7],
    q1Actual: row[8],
    april: row[9],
    may: row[10],
    june: row[11],
    q2Goal: row[12],
    q2Actual: row[13]
  };
  
  const metricData = {
    category,
    metric,
    results2024,
    annualGoal,
    monthlyData
  };
  
  // Categorize based on metric name (ensure metric is string)
  const metricStr = String(metric);
  if (category === 'Quality' || metricStr.includes('Scrap') || metricStr.includes('PPM') || metricStr.includes('Sort')) {
    metrics.quality.push(metricData);
  } else if (category === 'Production' || metricStr.includes('Parts') || metricStr.includes('Revenue')) {
    metrics.production.push(metricData);
  } else if (category === 'Efficiency' || metricStr.includes('Efficiency') || metricStr.includes('Productivity')) {
    metrics.efficiency.push(metricData);
  } else if (category === 'Safety' || metricStr.includes('Safety') || metricStr.includes('Recordable')) {
    metrics.safety.push(metricData);
  } else if (category === 'On-Time' || metricStr.includes('Delivery') || metricStr.includes('On Time')) {
    metrics.onTime.push(metricData);
  } else if (category === 'Maintenance' || metricStr.includes('Downtime') || metricStr.includes('Maintenance')) {
    metrics.maintenance.push(metricData);
  }
}

// Display categorized metrics
console.log('\n=== Metrics by Category ===\n');

for (const [category, items] of Object.entries(metrics)) {
  if (items.length > 0) {
    console.log(`${category.toUpperCase()} METRICS (${items.length}):`);
    items.forEach(item => {
      console.log(`  - ${item.metric}`);
      if (item.results2024 !== 'NA' && item.results2024 !== null) {
        console.log(`    2024 Results: ${item.results2024}`);
        console.log(`    Annual Goal: ${item.annualGoal}`);
        if (item.monthlyData.q1Actual) {
          console.log(`    Q1 Actual: ${item.monthlyData.q1Actual} (Goal: ${item.monthlyData.q1Goal})`);
        }
        if (item.monthlyData.q2Actual) {
          console.log(`    Q2 Actual: ${item.monthlyData.q2Actual} (Goal: ${item.monthlyData.q2Goal})`);
        }
      }
    });
    console.log();
  }
}

// Extract all unique metric names for report generation
console.log('=== Available Metrics for Reporting ===\n');
const allMetrics = [];
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  if (row[1] && typeof row[1] === 'string') {
    allMetrics.push(row[1]);
  }
}

const uniqueMetrics = [...new Set(allMetrics)];
uniqueMetrics.forEach((metric, index) => {
  console.log(`${index + 1}. ${metric}`);
});

console.log('\n=== Report Recommendations ===\n');
console.log('Based on the Pioneer.xlsx data, we can create the following reports:\n');

console.log('1. QUALITY PERFORMANCE DASHBOARD');
console.log('   - Scrap Costs Tracking (2024 baseline: $566,951)');
console.log('   - External Sort Costs (2024 baseline: $188,435)');
console.log('   - Internal Sort Costs (New for 2025)');
console.log('   - PPM (Parts Per Million defects)');
console.log('   - Quality trend analysis by quarter\n');

console.log('2. PRODUCTION METRICS DASHBOARD');
console.log('   - Total Parts Produced');
console.log('   - Revenue Tracking');
console.log('   - Production vs Goal Comparison');
console.log('   - Monthly/Quarterly Production Trends\n');

console.log('3. EFFICIENCY & PRODUCTIVITY REPORT');
console.log('   - Machine Efficiency Rates');
console.log('   - Productivity Metrics');
console.log('   - Downtime Analysis');
console.log('   - Efficiency Improvements YoY\n');

console.log('4. SAFETY METRICS REPORT');
console.log('   - Recordable Incidents');
console.log('   - Safety Goals vs Actuals');
console.log('   - Monthly Safety Trends');
console.log('   - Year-over-Year Safety Improvements\n');

console.log('5. ON-TIME DELIVERY PERFORMANCE');
console.log('   - Delivery Performance %');
console.log('   - On-Time Shipments');
console.log('   - Customer Satisfaction Metrics\n');

console.log('6. MAINTENANCE & DOWNTIME ANALYSIS');
console.log('   - Machine-specific downtime (1500-1, 600T, etc.)');
console.log('   - Repair categories (Bolster, Press, Transfer System)');
console.log('   - Downtime hours by month');
console.log('   - Preventive vs Reactive Maintenance\n');

console.log('7. QUARTERLY BUSINESS REVIEW');
console.log('   - Q1, Q2, Q3, Q4 Performance vs Goals');
console.log('   - YTD Progress Tracking');
console.log('   - Goal Achievement Status');
console.log('   - Executive Summary Dashboard\n');

console.log('=== Data Availability ===\n');
console.log('- 2024 Full Year Data: COMPLETE (baseline metrics)');
console.log('- 2025 Q1 Data: COMPLETE (Jan, Feb, March)');
console.log('- 2025 Q2 Data: PARTIAL (April, May, June in progress)');
console.log('- 2025 Q3 & Q4: NOT YET AVAILABLE');