import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

interface InventoryRecord {
  adjustment_date: string
  part_number: string
  part_name?: string
  operation?: string
  original_quantity?: number
  adjusted_quantity?: number
  adjustment_amount: number
  adjustment_type: 'increase' | 'decrease'
  extended_cost?: number
  unit_cost?: number
  adjustment_reason?: string
  location?: string
  part_group?: string
  adjusted_by?: string
  status?: string
}

async function processFile(filePath: string): Promise<InventoryRecord[]> {
  const records: InventoryRecord[] = []
  
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
    
    if (!worksheet) {
      worksheet = workbook.Sheets[workbook.SheetNames[0]]
    }
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    
    // Extract date from filename
    const fileName = path.basename(filePath, '.xlsx')
    const [month, day, year] = fileName.split('-').map(n => parseInt(n))
    const fileDate = new Date(2000 + year, month - 1, day).toISOString().split('T')[0]
    
    for (const row of jsonData) {
      const partNumber = row['Part Number - Revision'] || row['Part Number'] || ''
      const quantity = parseFloat(row['Quantity'] || 0)
      
      if (partNumber && quantity !== 0 && !isNaN(quantity)) {
        const extendedCost = parseFloat(row['Extended Cost'] || 0)
        const unitCost = quantity !== 0 ? Math.abs(extendedCost / quantity) : parseFloat(row['Unit Cost'] || 0)
        
        records.push({
          adjustment_date: fileDate,
          part_number: String(partNumber).trim().substring(0, 100),
          part_name: String(row['Part Type'] || '').trim().substring(0, 255),
          operation: String(row['Operation'] || '').trim().substring(0, 255),
          original_quantity: parseFloat(row['Original Quantity'] || 0),
          adjusted_quantity: parseFloat(row['Original Quantity'] || 0) + quantity,
          adjustment_amount: Math.abs(quantity),
          adjustment_type: quantity > 0 ? 'increase' : 'decrease',
          extended_cost: Math.abs(extendedCost),
          unit_cost: unitCost,
          adjustment_reason: String(row['Adjustment Reason'] || row['Last Action'] || 'Not specified').trim(),
          location: String(row['Location'] || '').trim().substring(0, 100),
          part_group: String(row['Part Group'] || '').trim().substring(0, 100),
          adjusted_by: String(row['By'] || row['User_ID'] || '').trim().substring(0, 100),
          status: String(row['Status'] || '').trim().substring(0, 50)
        })
      }
    }
  } catch (error) {
    console.warn(`Warning processing ${path.basename(filePath)}: ${error}`)
  }
  
  return records
}

async function importInventoryData() {
  const inventoryDir = '/Users/thefortob/Development/ToledoToolAndDie/Inventory Adjustment'
  
  console.log('🔍 Importing Toledo Tool & Die Inventory Adjustments to Supabase\n')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  // Check if table exists and get count
  const { count: existingCount, error: countError } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('Error checking table:', countError)
    return
  }
  
  console.log(`📊 Table has ${existingCount || 0} existing records\n`)
  
  if (existingCount && existingCount > 0) {
    console.log('⚠️  Table already contains data. Clearing existing records...')
    const { error: deleteError } = await supabase
      .from('inventory_adjustments')
      .delete()
      .gte('id', 0)
    
    if (deleteError) {
      console.error('Error clearing data:', deleteError)
      return
    }
    console.log('✅ Cleared existing data\n')
  }
  
  // Get all Excel files
  const files = fs.readdirSync(inventoryDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
  
  console.log(`📁 Found ${files.length} inventory adjustment files to process\n`)
  
  const BATCH_SIZE = 500
  const FILE_BATCH = 10 // Process 10 files at a time
  let totalInserted = 0
  let processedFiles = 0
  
  // Process files in groups
  for (let i = 0; i < files.length; i += FILE_BATCH) {
    const fileGroup = files.slice(i, i + FILE_BATCH)
    let allRecords: InventoryRecord[] = []
    
    // Process each file in the group
    for (const file of fileGroup) {
      const filePath = path.join(inventoryDir, file)
      const records = await processFile(filePath)
      allRecords = allRecords.concat(records)
      processedFiles++
      
      process.stdout.write(`\rProcessing files: ${processedFiles}/${files.length}...`)
    }
    
    // Insert records in batches
    for (let j = 0; j < allRecords.length; j += BATCH_SIZE) {
      const batch = allRecords.slice(j, j + BATCH_SIZE)
      
      const { error } = await supabase
        .from('inventory_adjustments')
        .insert(batch)
      
      if (error) {
        console.error('\nError inserting batch:', error.message)
        // Continue with next batch even if one fails
      } else {
        totalInserted += batch.length
      }
      
      process.stdout.write(`\rProcessed: ${processedFiles}/${files.length} files | Inserted: ${totalInserted} records`)
    }
  }
  
  console.log('\n\n✅ Import Complete!')
  console.log(`📊 Successfully imported ${totalInserted.toLocaleString()} inventory adjustment records`)
  
  // Get summary statistics
  console.log('\n📈 Verifying data in Supabase...')
  
  const { count: finalCount } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
  
  console.log(`   Total records in database: ${finalCount?.toLocaleString() || 0}`)
  
  // Get date range
  const { data: dateRange } = await supabase
    .from('inventory_adjustments')
    .select('adjustment_date')
    .order('adjustment_date', { ascending: true })
    .limit(1)
  
  const { data: dateRangeEnd } = await supabase
    .from('inventory_adjustments')
    .select('adjustment_date')
    .order('adjustment_date', { ascending: false })
    .limit(1)
  
  if (dateRange && dateRange[0] && dateRangeEnd && dateRangeEnd[0]) {
    console.log(`   Date range: ${dateRange[0].adjustment_date} to ${dateRangeEnd[0].adjustment_date}`)
  }
  
  // Get adjustment type counts
  const { data: increases } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('adjustment_type', 'increase')
  
  const { data: decreases } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('adjustment_type', 'decrease')
  
  console.log(`   Increases: ${increases || 0}`)
  console.log(`   Decreases: ${decreases || 0}`)
  
  console.log('\n🎉 Data is now available in Supabase for the dashboard!')
  console.log('📊 The inventory adjustments page will now show live data from the database')
}

// Run the import
importInventoryData().catch(console.error)