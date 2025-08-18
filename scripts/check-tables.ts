import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdwtgafaoevevrzrizhs.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkTables() {
  console.log('Checking available tables...\n')
  
  // Query the schema information
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
  
  if (error) {
    // Try alternative approach
    console.log('Trying direct query approach...')
    const { data: tables, error: tableError } = await supabase.rpc('get_tables', {})
    
    if (tableError) {
      console.log('Checking operators table for login info...')
      const { data: operators, error: opError } = await supabase
        .from('operators')
        .select('*')
        .limit(5)
      
      if (!opError && operators) {
        console.log('Found operators table with fields:', Object.keys(operators[0] || {}))
        console.log('\nSample operators:', operators)
      }
    }
  } else if (data) {
    console.log('Available tables:', data.map(t => t.table_name))
  }
}

checkTables().catch(console.error)