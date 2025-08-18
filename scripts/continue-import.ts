import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function continueImport() {
  const inventoryDir = '/Users/thefortob/Development/ToledoToolAndDie/Inventory Adjustment'
  
  console.log('🔍 Continuing Inventory Import from June 2025...\n')
  console.log('═══════════════════════════════════════════════\n')
  
  // Get current status
  const { data: lastDate } = await supabase
    .from('inventory_adjustments')
    .select('adjustment_date')
    .order('adjustment_date', { ascending: false })
    .limit(1)
  
  const lastImportedDate = lastDate?.[0]?.adjustment_date || '2025-06-11'
  console.log(`📅 Last imported date: ${lastImportedDate}\n`)
  
  // Get all Excel files
  const files = fs.readdirSync(inventoryDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
  
  // Filter files to only process those after the last imported date
  const remainingFiles = files.filter(file => {
    const [month, day, year] = file.replace('.xlsx', '').split('-').map(n => parseInt(n))
    const fileDate = new Date(2000 + year, month - 1, day)
    const lastDate = new Date(lastImportedDate)
    return fileDate > lastDate
  })
  
  console.log(`📁 Found ${remainingFiles.length} files to process (from ${files.length} total)\n`)
  
  if (remainingFiles.length === 0) {
    console.log('✅ All files already imported!')
    return
  }
  
  const BATCH_SIZE = 500
  let totalInserted = 0
  let processedFiles = 0
  let batch: any[] = []
  
  for (const file of remainingFiles) {
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
          
          batch.push({
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
          
          // Insert batch when it reaches the size limit
          if (batch.length >= BATCH_SIZE) {
            const { error } = await supabase
              .from('inventory_adjustments')
              .insert(batch)
            
            if (error) {
              console.error('\nError inserting batch:', error.message)
            } else {
              totalInserted += batch.length
            }
            
            batch = []
            process.stdout.write(`\rProcessed: ${processedFiles + 1}/${remainingFiles.length} files | Inserted: ${totalInserted} records`)
          }
        }
      }
      
      processedFiles++
      process.stdout.write(`\rProcessed: ${processedFiles}/${remainingFiles.length} files | Inserted: ${totalInserted} records`)
      
    } catch (error) {
      console.error(`\nError processing ${file}:`, error)
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    const { error } = await supabase
      .from('inventory_adjustments')
      .insert(batch)
    
    if (!error) {
      totalInserted += batch.length
    }
  }
  
  console.log('\n\n✅ Import Continuation Complete!')
  console.log(`📊 Added ${totalInserted.toLocaleString()} more records`)
  
  // Final status
  const { count: finalCount } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📈 Final Status:`)
  console.log(`   Total records in database: ${finalCount?.toLocaleString() || 0}`)
  
  const targetRecords = 1441708
  if (finalCount) {
    const percentage = ((finalCount / targetRecords) * 100).toFixed(1)
    console.log(`   Progress: ${percentage}% complete`)
    
    if (finalCount >= targetRecords * 0.95) {
      console.log('\n🎉 Import essentially complete! (>95% of expected records)')
    }
  }
}

continueImport().catch(console.error)