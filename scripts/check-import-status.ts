import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStatus() {
  console.log('🔍 Checking Inventory Import Status...\n')
  console.log('═══════════════════════════════════════════════\n')
  
  // Get total count
  const { count, error } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`✅ Records in database: ${count?.toLocaleString() || 0}`)
  
  // Get date range
  const { data: firstDate } = await supabase
    .from('inventory_adjustments')
    .select('adjustment_date')
    .order('adjustment_date', { ascending: true })
    .limit(1)
  
  const { data: lastDate } = await supabase
    .from('inventory_adjustments')
    .select('adjustment_date')
    .order('adjustment_date', { ascending: false })
    .limit(1)
  
  if (firstDate?.[0] && lastDate?.[0]) {
    console.log(`📅 Date range: ${firstDate[0].adjustment_date} to ${lastDate[0].adjustment_date}`)
  }
  
  // Get type breakdown
  const { count: increases } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('adjustment_type', 'increase')
  
  const { count: decreases } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
    .eq('adjustment_type', 'decrease')
  
  console.log(`⬆️  Increases: ${increases?.toLocaleString() || 0}`)
  console.log(`⬇️  Decreases: ${decreases?.toLocaleString() || 0}`)
  
  // Get top parts
  const { data: topParts } = await supabase
    .from('inventory_adjustments')
    .select('part_number')
    .limit(10000)
  
  if (topParts) {
    const partCounts = topParts.reduce((acc: any, row) => {
      acc[row.part_number] = (acc[row.part_number] || 0) + 1
      return acc
    }, {})
    
    const topPartsList = Object.entries(partCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
    
    console.log('\n📦 Top 5 Parts by Frequency:')
    topPartsList.forEach(([part, count]: any, i) => {
      console.log(`   ${i + 1}. ${part}: ${count} adjustments`)
    })
  }
  
  // Check if we need to continue
  const targetRecords = 1441708 // From our analysis
  const currentRecords = count || 0
  
  if (currentRecords < targetRecords) {
    console.log(`\n⚠️  Import incomplete: ${currentRecords.toLocaleString()} of ${targetRecords.toLocaleString()} records`)
    console.log(`   Missing: ${(targetRecords - currentRecords).toLocaleString()} records`)
    console.log(`   Progress: ${((currentRecords / targetRecords) * 100).toFixed(1)}%`)
  } else {
    console.log('\n🎉 Import Complete! All records loaded.')
  }
  
  console.log('\n📊 Dashboard URL: http://localhost:3010/inventory-adjustments')
}

checkStatus().catch(console.error)