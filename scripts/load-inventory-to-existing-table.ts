import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create inventory_data table similar to scrap_data
const createTableSQL = `
-- Create inventory_data table (similar structure to scrap_data)
CREATE TABLE IF NOT EXISTS inventory_data (
  id SERIAL PRIMARY KEY,
  part_number_revision VARCHAR(255),
  part_number VARCHAR(100),
  revision VARCHAR(50),
  operation VARCHAR(255),
  quantity DECIMAL(15, 3),
  reason_code VARCHAR(500),
  workcenter VARCHAR(100),
  unit_cost DECIMAL(15, 4),
  extended_cost DECIMAL(15, 2),
  month VARCHAR(20),
  source_sheet VARCHAR(100),
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Additional fields specific to inventory
  original_quantity DECIMAL(15, 3),
  adjustment_type VARCHAR(20),
  adjusted_by VARCHAR(100),
  part_group VARCHAR(100),
  status VARCHAR(50)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_data_part ON inventory_data(part_number);
CREATE INDEX IF NOT EXISTS idx_inventory_data_month ON inventory_data(month);
CREATE INDEX IF NOT EXISTS idx_inventory_data_operation ON inventory_data(operation);
`

async function loadInventoryData() {
  const inventoryDir = '/Users/thefortob/Development/ToledoToolAndDie/Inventory Adjustment'
  
  console.log('🔍 Loading Inventory Data into Supabase (using compatible structure)\n')
  console.log('═══════════════════════════════════════════════\n')
  
  // First, show the SQL needed
  console.log('📝 IMPORTANT: Run this SQL in Supabase dashboard first:\n')
  console.log(createTableSQL)
  console.log('\n════════════════════════════════════════════════\n')
  
  // Get all Excel files
  const files = fs.readdirSync(inventoryDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
  
  console.log(`📁 Found ${files.length} inventory adjustment files\n`)
  
  // Check if inventory_data table exists
  const { error: checkError } = await supabase
    .from('inventory_data')
    .select('*')
    .limit(1)
  
  if (checkError && checkError.message.includes('not found')) {
    console.log('⚠️  Table inventory_data does not exist.')
    console.log('Please create it using the SQL above in Supabase dashboard.\n')
    
    // Save the data locally for now
    console.log('💾 Saving data locally for dashboard use...\n')
    
    const allRecords = []
    let processedFiles = 0
    
    for (const file of files.slice(0, 10)) { // Process first 10 files as sample
      const filePath = path.join(inventoryDir, file)
      
      try {
        const workbook = XLSX.readFile(filePath)
        
        // Find the inventory adjustment sheet
        let worksheet = null
        for (const name of workbook.SheetNames) {
          if (name.includes('Inventory_Adjustment_Report')) {
            worksheet = workbook.Sheets[name]
            break
          }
        }
        
        if (!worksheet) continue
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // Extract date from filename for month
        const fileName = path.basename(filePath, '.xlsx')
        const [month, day, year] = fileName.split('-').map(n => parseInt(n))
        const monthStr = `2025-${String(month).padStart(2, '0')}`
        
        jsonData.forEach((row: any) => {
          const partNumberRev = row['Part Number - Revision'] || ''
          const quantity = parseFloat(row['Quantity'] || 0)
          
          if (partNumberRev && quantity !== 0) {
            const [partNumber, revision] = partNumberRev.split('@')
            
            allRecords.push({
              part_number_revision: partNumberRev,
              part_number: partNumber || partNumberRev,
              revision: revision || '',
              operation: row['Operation'] || '',
              quantity: quantity,
              reason_code: row['Adjustment Reason'] || row['Last Action'] || '',
              workcenter: row['Location'] || '',
              unit_cost: parseFloat(row['Unit Cost'] || 0),
              extended_cost: parseFloat(row['Extended Cost'] || 0),
              month: monthStr,
              source_sheet: fileName,
              original_quantity: parseFloat(row['Original Quantity'] || 0),
              adjustment_type: quantity > 0 ? 'increase' : 'decrease',
              adjusted_by: row['By'] || '',
              part_group: row['Part Group'] || '',
              status: row['Status'] || ''
            })
          }
        })
        
        processedFiles++
        process.stdout.write(`\rProcessed: ${processedFiles}/${files.length} files...`)
        
      } catch (error) {
        console.error(`\nError processing ${file}:`, error)
      }
    }
    
    console.log(`\n\n✅ Processed ${processedFiles} files`)
    console.log(`📊 Total records: ${allRecords.length}\n`)
    
    // Save to JSON for dashboard
    const outputPath = path.join(
      '/Users/thefortob/Development/ACTIVE-PROJECTS/grok-evolution/toledo-tool-die-platform',
      'data',
      'inventory-data-supabase-format.json'
    )
    
    const summary = {
      generated: new Date().toISOString(),
      fileCount: processedFiles,
      recordCount: allRecords.length,
      totalCost: allRecords.reduce((sum, r) => sum + Math.abs(r.extended_cost), 0),
      increases: allRecords.filter(r => r.adjustment_type === 'increase').length,
      decreases: allRecords.filter(r => r.adjustment_type === 'decrease').length,
      records: allRecords
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2))
    
    console.log(`💾 Data saved to: ${outputPath}`)
    console.log('\n📈 Summary:')
    console.log(`  Total adjustments: ${summary.recordCount}`)
    console.log(`  Increases: ${summary.increases}`)
    console.log(`  Decreases: ${summary.decreases}`)
    console.log(`  Total cost impact: $${summary.totalCost.toFixed(2)}`)
    
    return
  }
  
  // If table exists, clear and load data
  console.log('✅ Table inventory_data exists, loading data...\n')
  
  // Clear existing data
  await supabase.from('inventory_data').delete().neq('id', 0)
  
  // Process and insert data in batches
  const BATCH_SIZE = 500
  let batch = []
  let totalInserted = 0
  
  for (const file of files) {
    const filePath = path.join(inventoryDir, file)
    
    try {
      const workbook = XLSX.readFile(filePath)
      let worksheet = null
      
      for (const name of workbook.SheetNames) {
        if (name.includes('Inventory_Adjustment_Report')) {
          worksheet = workbook.Sheets[name]
          break
        }
      }
      
      if (!worksheet) continue
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      const fileName = path.basename(filePath, '.xlsx')
      const [month, day, year] = fileName.split('-').map(n => parseInt(n))
      const monthStr = `2025-${String(month).padStart(2, '0')}`
      
      for (const row of jsonData) {
        const partNumberRev = row['Part Number - Revision'] || ''
        const quantity = parseFloat(row['Quantity'] || 0)
        
        if (partNumberRev && quantity !== 0) {
          const [partNumber, revision] = partNumberRev.split('@')
          
          batch.push({
            part_number_revision: partNumberRev,
            part_number: partNumber || partNumberRev,
            revision: revision || '',
            operation: row['Operation'] || '',
            quantity: quantity,
            reason_code: row['Adjustment Reason'] || row['Last Action'] || '',
            workcenter: row['Location'] || '',
            unit_cost: parseFloat(row['Unit Cost'] || 0),
            extended_cost: parseFloat(row['Extended Cost'] || 0),
            month: monthStr,
            source_sheet: fileName,
            original_quantity: parseFloat(row['Original Quantity'] || 0),
            adjustment_type: quantity > 0 ? 'increase' : 'decrease',
            adjusted_by: row['By'] || '',
            part_group: row['Part Group'] || '',
            status: row['Status'] || ''
          })
          
          if (batch.length >= BATCH_SIZE) {
            const { error } = await supabase
              .from('inventory_data')
              .insert(batch)
            
            if (error) {
              console.error('Insert error:', error)
            } else {
              totalInserted += batch.length
            }
            
            batch = []
            process.stdout.write(`\rInserted: ${totalInserted} records...`)
          }
        }
      }
      
    } catch (error) {
      console.error(`\nError processing ${file}:`, error)
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    const { error } = await supabase
      .from('inventory_data')
      .insert(batch)
    
    if (!error) {
      totalInserted += batch.length
    }
  }
  
  console.log(`\n\n✅ Successfully loaded ${totalInserted} records into Supabase!`)
}

loadInventoryData().catch(console.error)