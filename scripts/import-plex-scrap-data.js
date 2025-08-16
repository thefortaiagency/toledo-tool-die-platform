const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load environment variables FIRST
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client after env vars are loaded
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importPlexScrapData() {
  const scrapDir = '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo';
  const files = fs.readdirSync(scrapDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  
  console.log('🚀 PLEX SCRAP DATA IMPORT SCRIPT');
  console.log('================================\n');
  
  const allRecords = [];
  const monthMap = {
    'January': '2024-01',
    'February': '2024-02', 
    'March': '2024-03',
    'April': '2024-04',
    'May': '2024-05',
    'June': '2024-06'
  };
  
  for (const file of files) {
    // Extract month from filename
    const monthName = file.split(' ')[0];
    const month = monthMap[monthName] || '2024-01';
    
    console.log(`📁 Processing ${file} (Month: ${month})`);
    
    try {
      const workbook = xlsx.readFile(path.join(scrapDir, file));
      
      for (const sheetName of workbook.SheetNames) {
        // Skip empty sheets and summary sheets
        if (sheetName === 'Sheet1' || sheetName === 'Sheet3') continue;
        
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        if (data.length === 0) continue;
        
        console.log(`  📊 Processing sheet: ${sheetName} (${data.length} rows)`);
        
        // Determine if this is main scrap data or Pioneer data
        const isPioneer = sheetName.toLowerCase().includes('pioneer');
        const source = isPioneer ? 'Pioneer' : 'Main';
        
        for (const row of data) {
          // Handle various column name formats from Plex
          const partRevision = row['Part No Revision'] || row['Part'] || row['Part Number'] || '';
          const operation = row['Operation'] || '';
          const quantity = parseFloat(row['Quantity'] || row['Pieces'] || row['Qty'] || 0);
          const workcenter = row['Workcenter'] || row['WorkCenter'] || row['WC'] || '';
          const unitCost = parseFloat(row['Unit Cost'] || row[' Unit Cost '] || row['UnitCost'] || 0);
          const extendedCost = parseFloat(row['Extended Cost'] || row[' Extended Cost '] || row['ExtendedCost'] || row[' Cost '] || 0);
          
          // Skip if no part number or zero quantity
          if (!partRevision || quantity === 0) continue;
          
          // Parse part number and revision
          let partNumber = String(partRevision);
          let revision = '';
          
          // Common Plex formats: "1073874-00-G@G" or "B1-1214A/1268A BLANK@F"
          if (partNumber.includes('@')) {
            const parts = partNumber.split('@');
            partNumber = parts[0];
            revision = parts[1] || '';
          }
          
          allRecords.push({
            part_number_revision: partRevision,
            part_number: partNumber,
            revision: revision,
            operation: operation,
            quantity: quantity,
            reason_code: null, // Plex doesn't provide this in these reports
            workcenter: workcenter,
            unit_cost: unitCost,
            extended_cost: extendedCost,
            month: month,
            source_sheet: `${source}-${sheetName}`,
            imported_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total records to import: ${allRecords.length}`);
  
  // Group by month for summary
  const monthSummary = {};
  allRecords.forEach(record => {
    if (!monthSummary[record.month]) {
      monthSummary[record.month] = {
        count: 0,
        quantity: 0,
        cost: 0
      };
    }
    monthSummary[record.month].count++;
    monthSummary[record.month].quantity += record.quantity;
    monthSummary[record.month].cost += record.extended_cost;
  });
  
  console.log('\n📈 Summary by Month:');
  Object.entries(monthSummary).sort().forEach(([month, stats]) => {
    console.log(`  ${month}: ${stats.count} records, ${Math.round(stats.quantity).toLocaleString()} units, $${stats.cost.toFixed(2)}`);
  });
  
  // Ask for confirmation before importing
  console.log('\n⚠️  Ready to import to Supabase database');
  console.log('Run with --execute flag to perform the import');
  
  if (process.argv.includes('--execute')) {
    console.log('🔄 Importing to database...');
    
    // Insert in batches of 500
    const batchSize = 500;
    let imported = 0;
    
    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('scrap_data')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error);
      } else {
        imported += batch.length;
        console.log(`  ✅ Imported ${imported}/${allRecords.length} records`);
      }
    }
    
    console.log(`\n✅ Import complete! ${imported} records imported.`);
  } else {
    // Save to JSON file for review
    const outputFile = 'plex-scrap-data-preview.json';
    fs.writeFileSync(outputFile, JSON.stringify(allRecords.slice(0, 100), null, 2));
    console.log(`\n📄 Preview of first 100 records saved to ${outputFile}`);
    console.log('Review the data and run with --execute flag to import');
  }
}

// Run the import
importPlexScrapData().catch(console.error);