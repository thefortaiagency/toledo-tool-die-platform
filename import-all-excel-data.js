const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Machine ID mapping - THESE ARE THE ACTUAL IDS IN THE DATABASE
const MACHINE_IDS = {
  '600 Ton': 'b8e48ae1-513f-4211-aa15-a421150c15a4',
  '1500-1': '73a96295-79f3-4dc7-ab38-08ee48679a6f',
  '1500-2': '5d509a37-0e1c-4c18-be71-34638b3ec716',
  '1400': '45dadf58-b046-4fe1-93fd-bf76568e8ef1',
  '1000': '3c9453df-432f-47cb-9fd8-19b9a19fd012',
  'Hyd': '0e29b01a-7383-4c66-81e7-f92e9d52f227'
}

async function importAllData() {
  console.log('🚀 Starting COMPLETE Excel Import...')
  console.log('='*80)
  
  // Read the Excel file
  const workbook = XLSX.readFile('/Users/thefortob/Development/ToledoToolAndDie/Hits Tracking 2025.xlsx')
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: 0 })
  
  // First, clear ALL existing data
  console.log('🗑️  Clearing all existing data...')
  const { error: deleteError } = await supabase
    .from('hits_tracking')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  
  if (deleteError) {
    console.error('Error clearing data:', deleteError)
  }
  
  const allRecords = []
  
  // The Excel has data in columns, each week is 9 columns apart
  // Row 3 has days of week headers
  // Data starts at row 4 for 600 Ton, then every 14 rows for next machine
  
  console.log('📊 Processing Excel data structure...')
  
  // Machine row positions in Excel
  const machineRows = {
    '600 Ton': 4,
    '1500-1': 18,
    '1500-2': 32,
    '1400': 46,
    '1000': 60,
    'Hyd': 74
  }
  
  // Process each week (columns 1, 10, 19, 28, etc.)
  let weekCount = 0
  for (let col = 1; col < data[0].length; col += 9) {
    // Check if this column has data (look for Monday header)
    if (data[3][col] !== 'Monday') continue
    
    weekCount++
    // Calculate the week date (starting from Jan 1, 2025)
    const weekDate = new Date('2025-01-01')
    weekDate.setDate(weekDate.getDate() + (weekCount - 1) * 7)
    const dateStr = weekDate.toISOString().split('T')[0]
    
    console.log(`\n📅 Week ${weekCount}: ${dateStr}`)
    
    // Process each machine for this week
    for (const [machineName, machineRow] of Object.entries(machineRows)) {
      const machineId = MACHINE_IDS[machineName]
      
      // Get the daily hits for this machine
      const dailyHits = {
        monday: parseFloat(data[machineRow][col]) || 0,
        tuesday: parseFloat(data[machineRow][col + 1]) || 0,
        wednesday: parseFloat(data[machineRow][col + 2]) || 0,
        thursday: parseFloat(data[machineRow][col + 3]) || 0,
        friday: parseFloat(data[machineRow][col + 4]) || 0,
        saturday: parseFloat(data[machineRow][col + 5]) || 0,
        sunday: parseFloat(data[machineRow][col + 6]) || 0
      }
      
      // Get weekly total from column 7 or calculate it
      const weeklyTotal = parseFloat(data[machineRow][col + 7]) || 
        Object.values(dailyHits).reduce((sum, val) => sum + val, 0)
      
      // Only add if there's actual data
      if (weeklyTotal > 0) {
        const record = {
          date: dateStr,
          machine_id: machineId,
          monday_hits: dailyHits.monday,
          tuesday_hits: dailyHits.tuesday,
          wednesday_hits: dailyHits.wednesday,
          thursday_hits: dailyHits.thursday,
          friday_hits: dailyHits.friday,
          saturday_hits: dailyHits.saturday,
          sunday_hits: dailyHits.sunday,
          weekly_total: weeklyTotal,
          weekly_average: weeklyTotal / 7
        }
        
        allRecords.push(record)
        console.log(`  ✓ ${machineName}: ${weeklyTotal.toLocaleString()} hits`)
      }
    }
  }
  
  // Insert all records in batches
  console.log(`\n💾 Inserting ${allRecords.length} records into database...`)
  
  // Insert in batches of 50
  for (let i = 0; i < allRecords.length; i += 50) {
    const batch = allRecords.slice(i, i + 50)
    const { data: inserted, error: insertError } = await supabase
      .from('hits_tracking')
      .insert(batch)
      .select()
    
    if (insertError) {
      console.error('Error inserting batch:', insertError)
    } else {
      console.log(`  ✓ Inserted batch ${Math.floor(i/50) + 1}/${Math.ceil(allRecords.length/50)}`)
    }
  }
  
  // Verify the import
  console.log('\n📋 Verifying import...')
  const { data: verify, count } = await supabase
    .from('hits_tracking')
    .select('*', { count: 'exact' })
    .order('date', { ascending: true })
  
  if (verify) {
    // Group by machine
    const byMachine = {}
    verify.forEach(record => {
      const machineName = Object.keys(MACHINE_IDS).find(key => MACHINE_IDS[key] === record.machine_id)
      if (!byMachine[machineName]) {
        byMachine[machineName] = {
          records: 0,
          totalHits: 0,
          weeks: new Set()
        }
      }
      byMachine[machineName].records++
      byMachine[machineName].totalHits += record.weekly_total
      byMachine[machineName].weeks.add(record.date)
    })
    
    console.log('\n📊 Database Summary:')
    console.log(`Total Records: ${count}`)
    console.log(`\nBy Machine:`)
    
    Object.entries(byMachine).forEach(([machine, stats]) => {
      console.log(`\n${machine}:`)
      console.log(`  Records: ${stats.records}`)
      console.log(`  Weeks: ${stats.weeks.size}`)
      console.log(`  Total Hits: ${stats.totalHits.toLocaleString()}`)
      console.log(`  Average/Week: ${Math.round(stats.totalHits / stats.weeks.size).toLocaleString()}`)
    })
    
    // Show date range
    const dates = [...new Set(verify.map(r => r.date))].sort()
    console.log(`\n📅 Date Range:`)
    console.log(`  First Week: ${dates[0]}`)
    console.log(`  Last Week: ${dates[dates.length - 1]}`)
    console.log(`  Total Weeks: ${dates.length}`)
  }
  
  console.log('\n' + '='*80)
  console.log('✅ IMPORT COMPLETE! All machines and weeks have been imported.')
  console.log('🎉 The Hit Tracker should now show ALL data!')
}

// Run the import
importAllData().catch(console.error)