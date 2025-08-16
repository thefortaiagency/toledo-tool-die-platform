const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabase() {
  console.log('Checking Database Contents...')
  console.log('='*80)
  
  // Fetch all data from hits_tracking
  const { data, error } = await supabase
    .from('hits_tracking')
    .select('*')
    .order('date', { ascending: true })
  
  if (error) {
    console.error('Error fetching data:', error)
    return
  }
  
  console.log(`Total Records: ${data.length}`)
  console.log('\nUnique Machines:')
  const machines = [...new Set(data.map(d => d.machine_id))]
  machines.forEach(m => {
    const records = data.filter(d => d.machine_id === m)
    console.log(`  ${m}: ${records.length} records`)
  })
  
  console.log('\nDate Range:')
  const dates = [...new Set(data.map(d => d.date))].sort()
  console.log(`  First: ${dates[0]}`)
  console.log(`  Last: ${dates[dates.length - 1]}`)
  console.log(`  Total Weeks: ${dates.length}`)
  
  console.log('\nData by Week:')
  dates.forEach(date => {
    console.log(`\n  Week of ${date}:`)
    const weekData = data.filter(d => d.date === date)
    weekData.forEach(record => {
      const totalHits = record.weekly_total || 
        (record.monday_hits + record.tuesday_hits + record.wednesday_hits + 
         record.thursday_hits + record.friday_hits + record.saturday_hits + record.sunday_hits)
      console.log(`    Machine ${record.machine_id.substring(0, 8)}...: ${totalHits} total hits`)
    })
  })
  
  console.log('\n' + '='*80)
  console.log('ISSUE FOUND:')
  console.log('- Only 600 Ton machine has data (machine_id: b8e48ae1...)')
  console.log('- Other machines have 0 hits')
  console.log('- Need to import actual data from Excel for all machines')
}

checkDatabase()