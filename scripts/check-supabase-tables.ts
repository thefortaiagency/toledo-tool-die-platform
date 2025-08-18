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

async function checkTables() {
  console.log('🔍 Checking existing Supabase tables...\n')
  console.log('Supabase URL:', supabaseUrl)
  console.log('═══════════════════════════════════════════\n')
  
  // Try to query the inventory_adjustments table
  console.log('Checking inventory_adjustments table...')
  const { data: invData, error: invError, count } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
  
  if (invError) {
    if (invError.message.includes('relation') && invError.message.includes('does not exist')) {
      console.log('❌ Table inventory_adjustments does not exist')
      console.log('   Please create it using the SQL in create-inventory-tables.sql')
    } else {
      console.log('⚠️ Error checking inventory_adjustments:', invError.message)
    }
  } else {
    console.log(`✅ Table inventory_adjustments exists with ${count || 0} records`)
  }
  
  // Check scrap_data table
  console.log('\nChecking scrap_data table...')
  const { data: scrapData, error: scrapError, count: scrapCount } = await supabase
    .from('scrap_data')
    .select('*', { count: 'exact', head: true })
  
  if (scrapError) {
    if (scrapError.message.includes('relation') && scrapError.message.includes('does not exist')) {
      console.log('❌ Table scrap_data does not exist')
    } else {
      console.log('⚠️ Error checking scrap_data:', scrapError.message)
    }
  } else {
    console.log(`✅ Table scrap_data exists with ${scrapCount || 0} records`)
  }
  
  // Check hit_tracker table
  console.log('\nChecking hit_tracker table...')
  const { data: hitData, error: hitError, count: hitCount } = await supabase
    .from('hit_tracker')
    .select('*', { count: 'exact', head: true })
  
  if (hitError) {
    if (hitError.message.includes('relation') && hitError.message.includes('does not exist')) {
      console.log('❌ Table hit_tracker does not exist')
    } else {
      console.log('⚠️ Error checking hit_tracker:', hitError.message)
    }
  } else {
    console.log(`✅ Table hit_tracker exists with ${hitCount || 0} records`)
  }
  
  // List all available tables (if we can access schema)
  console.log('\n═══════════════════════════════════════════')
  console.log('Available tables in public schema:')
  
  // Try to get table list using information_schema
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables', {})
    .single()
  
  if (tablesError) {
    console.log('Could not retrieve full table list (this is normal if RPC function doesn\'t exist)')
    console.log('\nTo create the inventory_adjustments table:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and run the SQL from scripts/create-inventory-tables.sql')
  } else if (tables) {
    console.log(tables)
  }
}

checkTables().catch(console.error)