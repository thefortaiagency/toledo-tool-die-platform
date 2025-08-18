import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

// Instead of creating tables through SQL (which requires admin access),
// we'll work with what's available or use the existing scrap_data pattern

async function loadInventoryToScrapFormat() {
  const inventoryDir = '/Users/thefortob/Development/ToledoToolAndDie/Inventory Adjustment'
  
  console.log('🔍 Loading Inventory Adjustments into Supabase\n')
  console.log('═══════════════════════════════════════════════\n')
  
  // Since we can't create new tables, let's use the existing scrap_data structure
  // or create a simple structure that works
  
  const files = fs.readdirSync(inventoryDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
    .slice(0, 5) // Process first 5 files as a test
  
  console.log(`📁 Processing ${files.length} files (test batch)\n`)
  
  const allAdjustments = []
  
  for (const file of files) {
    const filePath = path.join(inventoryDir, file)
    console.log(`Processing: ${file}`)
    
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
      const fileDate = new Date(2000 + year, month - 1, day).toISOString()
      
      // Process each row
      jsonData.forEach((row: any) => {
        const partNumber = row['Part Number - Revision'] || ''
        const quantity = parseFloat(row['Quantity'] || 0)
        const extendedCost = parseFloat(row['Extended Cost'] || 0)
        
        if (partNumber && quantity !== 0) {
          allAdjustments.push({
            date: fileDate,
            part_number: partNumber,
            operation: row['Operation'] || '',
            quantity: quantity,
            cost: extendedCost,
            reason: row['Adjustment Reason'] || row['Last Action'] || '',
            part_group: row['Part Group'] || '',
            adjusted_by: row['By'] || ''
          })
        }
      })
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error)
    }
  }
  
  console.log(`\n📊 Found ${allAdjustments.length} adjustments to load\n`)
  
  // Check if we can insert into a simpler table structure
  // First, let's see what tables we can actually write to
  
  console.log('Testing table access...')
  
  // Try scrap_data table (we know it exists)
  const { data: testData, error: testError } = await supabase
    .from('scrap_data')
    .select('*')
    .limit(1)
  
  if (!testError) {
    console.log('✅ Can access scrap_data table')
    console.log('Sample columns:', testData && testData[0] ? Object.keys(testData[0]) : 'Empty table')
  }
  
  // For now, let's save the data as a JSON file that the dashboard can use
  const outputPath = path.join(
    '/Users/thefortob/Development/ACTIVE-PROJECTS/grok-evolution/toledo-tool-die-platform',
    'data',
    'inventory-adjustments-for-supabase.json'
  )
  
  fs.writeFileSync(outputPath, JSON.stringify({
    generated: new Date().toISOString(),
    count: allAdjustments.length,
    adjustments: allAdjustments
  }, null, 2))
  
  console.log(`\n💾 Data saved to: ${outputPath}`)
  console.log('\nNote: Direct table creation requires Supabase dashboard access.')
  console.log('Please run the SQL from create-inventory-tables.sql in the Supabase SQL editor.')
  
  // Show summary
  const totalCost = allAdjustments.reduce((sum, adj) => sum + Math.abs(adj.cost), 0)
  const increases = allAdjustments.filter(adj => adj.quantity > 0).length
  const decreases = allAdjustments.filter(adj => adj.quantity < 0).length
  
  console.log('\n📈 Summary:')
  console.log(`  Total adjustments: ${allAdjustments.length}`)
  console.log(`  Increases: ${increases}`)
  console.log(`  Decreases: ${decreases}`)
  console.log(`  Total cost impact: $${totalCost.toFixed(2)}`)
}

loadInventoryToScrapFormat().catch(console.error)