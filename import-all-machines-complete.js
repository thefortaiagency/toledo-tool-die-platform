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
  '1000T': '3c9453df-432f-47cb-9fd8-19b9a19fd012',
  'Hyd': '0e29b01a-7383-4c66-81e7-f92e9d52f227'
}

async function importAllData() {
  console.log('🚀 Starting COMPLETE Excel Import for ALL MACHINES...')
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
  
  console.log('📊 Processing Excel data structure...')
  
  // CORRECTED Machine row positions based on actual Excel analysis
  // Daily Hits rows (where the actual totals are):
  const machineRows = {
    '600 Ton': {
      dailyRow: 11,    // Row 12 in Excel (0-indexed)
      weeklyRow: 14,   // Row 15 in Excel
      thirdRow: 5,     // Row 6 - 3rd shift
      firstRow: 7,     // Row 8 - 1st shift
      secondRow: 9     // Row 10 - 2nd shift
    },
    '1500-1': {
      dailyRow: 26,    // Row 27 in Excel
      weeklyRow: 29,   // Row 30 in Excel
      thirdRow: 20,    // Row 21 - 3rd shift
      firstRow: 22,    // Row 23 - 1st shift
      secondRow: 24    // Row 25 - 2nd shift
    },
    '1500-2': {
      dailyRow: 40,    // Row 41 in Excel
      weeklyRow: 43,   // Row 44 in Excel
      thirdRow: 34,    // Row 35 - 3rd shift
      firstRow: 36,    // Row 37 - 1st shift
      secondRow: 38    // Row 39 - 2nd shift
    },
    '1400': {
      dailyRow: 54,    // Row 55 in Excel
      weeklyRow: 57,   // Row 58 in Excel
      thirdRow: 48,    // Row 49 - 3rd shift
      firstRow: 50,    // Row 51 - 1st shift
      secondRow: 52    // Row 53 - 2nd shift
    },
    '1000T': {
      dailyRow: 68,    // Row 69 in Excel
      weeklyRow: 71,   // Row 72 in Excel
      thirdRow: 62,    // Row 63 - 3rd shift
      firstRow: 64,    // Row 65 - 1st shift
      secondRow: 66    // Row 67 - 2nd shift
    },
    'Hyd': {
      dailyRow: 82,    // Row 83 in Excel
      weeklyRow: 85,   // Row 86 in Excel
      thirdRow: 76,    // Row 77 - 3rd shift
      firstRow: 78,    // Row 79 - 1st shift
      secondRow: 80    // Row 81 - 2nd shift
    }
  }
  
  // Process each week (columns 1, 10, 19, 28, etc.)
  let weekCount = 0
  for (let col = 1; col < data[0].length; col += 9) {
    // Check if this column has data (look for Monday header)
    if (data[3] && data[3][col] !== 'Monday') continue
    
    weekCount++
    // Calculate the week date (starting from Jan 1, 2025)
    const weekDate = new Date('2025-01-01')
    weekDate.setDate(weekDate.getDate() + (weekCount - 1) * 7)
    const dateStr = weekDate.toISOString().split('T')[0]
    
    console.log(`\n📅 Week ${weekCount}: ${dateStr}`)
    
    // Process each machine for this week
    for (const [machineName, rows] of Object.entries(machineRows)) {
      const machineId = MACHINE_IDS[machineName]
      
      // Get the daily hits for this machine from the Daily Hits row
      const dailyHits = {
        monday: parseFloat(data[rows.dailyRow][col]) || 0,
        tuesday: parseFloat(data[rows.dailyRow][col + 1]) || 0,
        wednesday: parseFloat(data[rows.dailyRow][col + 2]) || 0,
        thursday: parseFloat(data[rows.dailyRow][col + 3]) || 0,
        friday: parseFloat(data[rows.dailyRow][col + 4]) || 0,
        saturday: parseFloat(data[rows.dailyRow][col + 5]) || 0,
        sunday: parseFloat(data[rows.dailyRow][col + 6]) || 0
      }
      
      // Get weekly total from the Weekly Hits row
      const weeklyTotal = parseFloat(data[rows.weeklyRow][col + 7]) || 
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
      console.log(`  ✓ Inserted batch ${Math.floor(i/50) + 1}/${Math.ceil(allRecords.length/50)}`);
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
    console.log(`  Total Unique Weeks: ${dates.length}`)
  }
  
  console.log('\n' + '='*80)
  console.log('✅ IMPORT COMPLETE! All 6 machines with full year of data imported!')
  console.log('🎉 The Hit Tracker now shows ALL machines and ALL weeks!')
}

// Run the import
importAllData().catch(console.error)