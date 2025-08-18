import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectTable() {
  console.log('🔍 Inspecting inventory_adjustments table structure...\n')
  
  // Try a simple select to see the columns
  const { data, error } = await supabase
    .from('inventory_adjustments')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  if (data && data.length > 0) {
    console.log('Table columns:')
    console.log(Object.keys(data[0]))
    console.log('\nSample record:')
    console.log(data[0])
  } else {
    console.log('Table exists but is empty')
    
    // Try inserting a test record to see the structure
    const testRecord = {
      adjustment_date: '2025-01-01',
      part_number: 'TEST-001',
      part_name: 'Test Part',
      operation: 'Test Op',
      original_quantity: 100,
      adjusted_quantity: 110,
      adjustment_amount: 10,
      adjustment_type: 'increase',
      extended_cost: 100.50,
      unit_cost: 10.05
    }
    
    const { error: insertError } = await supabase
      .from('inventory_adjustments')
      .insert([testRecord])
    
    if (insertError) {
      console.log('\nTable structure issue:')
      console.log(insertError)
      console.log('\nThis might indicate missing or differently named columns')
    } else {
      console.log('Successfully inserted test record')
      
      // Delete the test record
      await supabase
        .from('inventory_adjustments')
        .delete()
        .eq('part_number', 'TEST-001')
    }
  }
}

inspectTable().catch(console.error)