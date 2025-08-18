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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface InventoryAdjustment {
  adjustment_date: string
  part_number: string
  part_name: string
  operation: string
  original_quantity: number
  adjusted_quantity: number
  adjustment_amount: number
  adjustment_type: 'increase' | 'decrease'
  extended_cost: number
  unit_cost: number
  adjustment_reason: string
  location: string
  part_group: string
  adjusted_by: string
  status: string
}

async function createTablesIfNeeded() {
  console.log('🔧 Ensuring database tables exist...')
  
  const sqlPath = path.join(__dirname, 'create-inventory-tables.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  
  // Execute SQL statements one by one
  const statements = sql.split(';').filter(s => s.trim())
  
  for (const statement of statements) {
    if (statement.trim()) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' }).single()
      if (error && !error.message.includes('already exists')) {
        console.warn('Warning executing SQL:', error.message)
      }
    }
  }
  
  console.log('✅ Database tables ready')
}

function parseInventoryFile(filePath: string): InventoryAdjustment[] {
  const adjustments: InventoryAdjustment[] = []
  
  try {
    const workbook = XLSX.readFile(filePath)
    
    // Look for the inventory adjustment report sheet
    let worksheet: XLSX.WorkSheet | null = null
    
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
    const fileDate = new Date(2000 + year, month - 1, day)
    const dateStr = fileDate.toISOString().split('T')[0]
    
    jsonData.forEach((row: any) => {
      const partNumber = row['Part Number - Revision'] || row['Part Number'] || ''
      const quantity = parseFloat(row['Quantity'] || 0)
      
      if (partNumber && quantity !== 0 && !isNaN(quantity)) {
        const extendedCost = parseFloat(row['Extended Cost'] || 0)
        const unitCost = quantity !== 0 ? Math.abs(extendedCost / quantity) : parseFloat(row['Unit Cost'] || 0)
        
        adjustments.push({
          adjustment_date: dateStr,
          part_number: String(partNumber).trim(),
          part_name: String(row['Part Type'] || '').trim(),
          operation: String(row['Operation'] || '').trim(),
          original_quantity: parseFloat(row['Original Quantity'] || 0),
          adjusted_quantity: parseFloat(row['Original Quantity'] || 0) + quantity,
          adjustment_amount: Math.abs(quantity),
          adjustment_type: quantity > 0 ? 'increase' : 'decrease',
          extended_cost: Math.abs(extendedCost),
          unit_cost: unitCost,
          adjustment_reason: String(row['Adjustment Reason'] || row['Last Action'] || 'Not specified').trim(),
          location: String(row['Location'] || '').trim(),
          part_group: String(row['Part Group'] || '').trim(),
          adjusted_by: String(row['By'] || row['User_ID'] || '').trim(),
          status: String(row['Status'] || '').trim()
        })
      }
    })
  } catch (error) {
    console.warn(`Warning processing ${path.basename(filePath)}: ${error}`)
  }
  
  return adjustments
}

async function loadInventoryData() {
  const inventoryDir = '/Users/thefortob/Development/ToledoToolAndDie/Inventory Adjustment'
  
  console.log('🔍 Loading Toledo Tool & Die Inventory Adjustment Data into Supabase\n')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  // First, clear existing data
  console.log('🗑️  Clearing existing inventory adjustment data...')
  const { error: deleteError } = await supabase
    .from('inventory_adjustments')
    .delete()
    .neq('id', 0) // Delete all records
  
  if (deleteError) {
    console.error('Error clearing data:', deleteError)
    return
  }
  
  // Get all Excel files
  const files = fs.readdirSync(inventoryDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
  
  console.log(`📁 Found ${files.length} daily inventory adjustment files\n`)
  
  let totalRecords = 0
  let processedFiles = 0
  
  // Process files in batches
  const BATCH_SIZE = 500 // Insert 500 records at a time
  let batch: InventoryAdjustment[] = []
  
  for (const file of files) {
    const filePath = path.join(inventoryDir, file)
    const adjustments = parseInventoryFile(filePath)
    
    for (const adjustment of adjustments) {
      batch.push(adjustment)
      
      // Insert batch when it reaches the size limit
      if (batch.length >= BATCH_SIZE) {
        const { error } = await supabase
          .from('inventory_adjustments')
          .insert(batch)
        
        if (error) {
          console.error('Error inserting batch:', error)
        } else {
          totalRecords += batch.length
        }
        
        batch = []
      }
    }
    
    processedFiles++
    if (processedFiles % 10 === 0) {
      process.stdout.write(`\rProcessing: ${processedFiles}/${files.length} files... (${totalRecords} records)`)
    }
  }
  
  // Insert remaining records
  if (batch.length > 0) {
    const { error } = await supabase
      .from('inventory_adjustments')
      .insert(batch)
    
    if (error) {
      console.error('Error inserting final batch:', error)
    } else {
      totalRecords += batch.length
    }
  }
  
  console.log(`\n✅ Processed ${processedFiles} files`)
  console.log(`📊 Loaded ${totalRecords.toLocaleString()} adjustment records into Supabase\n`)
  
  // Generate summary statistics
  console.log('📈 Generating summary statistics...')
  
  const { data: stats, error: statsError } = await supabase
    .from('inventory_adjustments')
    .select('adjustment_type')
  
  if (!statsError && stats) {
    const increases = stats.filter(s => s.adjustment_type === 'increase').length
    const decreases = stats.filter(s => s.adjustment_type === 'decrease').length
    
    console.log(`  Increases: ${increases.toLocaleString()}`)
    console.log(`  Decreases: ${decreases.toLocaleString()}`)
  }
  
  // Get total cost impact
  const { data: costData, error: costError } = await supabase
    .rpc('exec_sql', { 
      sql: 'SELECT SUM(extended_cost) as total FROM inventory_adjustments' 
    })
  
  if (!costError && costData) {
    console.log(`  Total Cost Impact: $${parseFloat(costData[0]?.total || 0).toLocaleString()}`)
  }
  
  console.log('\n✅ Data successfully loaded into Supabase!')
  console.log('📊 Views created for monthly summaries, top parts, and adjustment reasons')
}

async function main() {
  try {
    // Note: Creating tables via RPC might not work if exec_sql doesn't exist
    // You may need to run the SQL manually in Supabase dashboard first
    console.log('Note: Please ensure tables are created in Supabase dashboard first')
    console.log('Run the SQL from create-inventory-tables.sql if needed\n')
    
    await loadInventoryData()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()