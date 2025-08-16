import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Machine configurations - must match the database
const MACHINES = [
  { id: 'b8e48ae1-513f-4211-aa15-a421150c15a4', name: '600 Ton', target: 950 },
  { id: '73a96295-79f3-4dc7-ab38-08ee48679a6f', name: '1500-1', target: 600 },
  { id: '5d509a37-0e1c-4c18-be71-34638b3ec716', name: '1500-2', target: 600 },
  { id: '45dadf58-b046-4fe1-93fd-bf76568e8ef1', name: '1400', target: 600 },
  { id: '3c9453df-432f-47cb-9fd8-19b9a19fd012', name: '1000T', target: 875 },
  { id: '0e29b01a-7383-4c66-81e7-f92e9d52f227', name: 'Hyd', target: 600 }
]

export async function GET() {
  try {
    // Fetch all hit tracking data
    const { data: hitData, error } = await supabase
      .from('hits_tracking')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error

    // Group data by week
    const weekMap = new Map()
    
    hitData?.forEach(record => {
      const date = new Date(record.date)
      // Get Monday of the week
      const monday = new Date(date)
      monday.setDate(date.getDate() - date.getDay() + 1)
      const weekKey = monday.toISOString().split('T')[0]
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStart: weekKey,
          weekEnd: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          machines: []
        })
      }
      
      const week = weekMap.get(weekKey)
      const machine = MACHINES.find(m => m.id === record.machine_id)
      
      if (machine) {
        // Build day data from the record
        const days: any[] = []
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        const dayFields = ['monday_hits', 'tuesday_hits', 'wednesday_hits', 'thursday_hits', 'friday_hits', 'saturday_hits', 'sunday_hits'] as const
        
        let weeklyHits = 0
        let weeklyHours = 0
        
        dayFields.forEach((field, index) => {
          const hits = record[field] || 0
          const isWeekend = index >= 5
          const hours = hits > 0 ? (isWeekend ? 16 : 24) : 0 // Assume 24hr weekday, 16hr weekend if production
          
          weeklyHits += hits
          weeklyHours += hours
          
          const dayDate = new Date(monday)
          dayDate.setDate(monday.getDate() + index)
          
          days.push({
            date: dayDate.toISOString().split('T')[0],
            dayName: dayNames[index],
            hits: hits,
            hours: hours,
            efficiency: hours > 0 ? (hits / hours) / machine.target : 0
          })
        })
        
        week.machines.push({
          machineId: machine.id,
          machineName: machine.name,
          target: machine.target,
          days: days,
          weeklyHits: record.weekly_total || weeklyHits,
          weeklyHours: weeklyHours,
          weeklyPerformance: weeklyHours > 0 ? (weeklyHits / weeklyHours) / machine.target : 0,
          weeklyAverage: record.weekly_average || (weeklyHits / 7)
        })
      }
    })
    
    // Convert map to array and sort by date descending
    const weeks = Array.from(weekMap.values()).sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    )
    
    return NextResponse.json({ weeks })
  } catch (error) {
    console.error('Error fetching hit tracker data:', error)
    
    // Return empty data structure if error
    return NextResponse.json({ 
      weeks: [],
      error: 'Failed to fetch data'
    })
  }
}