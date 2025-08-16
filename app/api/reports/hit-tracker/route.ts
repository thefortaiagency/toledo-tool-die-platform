import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Machine targets per hour
const MACHINE_TARGETS: Record<string, number> = {
  'b8e48ae1-513f-4211-aa15-a421150c15a4': 950,  // 600 Ton
  '73a96295-79f3-4dc7-ab38-08ee48679a6f': 600,  // 1500-1
  '5d509a37-0e1c-4c18-be71-34638b3ec716': 600,  // 1500-2
  '45dadf58-b046-4fe1-93fd-bf76568e8ef1': 600,  // 1400
  '3c9453df-432f-47cb-9fd8-19b9a19fd012': 875,  // 1000T
  '0e29b01a-7383-4c66-81e7-f92e9d52f227': 600   // Hyd
}

const MACHINE_NAMES: Record<string, string> = {
  'b8e48ae1-513f-4211-aa15-a421150c15a4': '600 Ton',
  '73a96295-79f3-4dc7-ab38-08ee48679a6f': '1500-1',
  '5d509a37-0e1c-4c18-be71-34638b3ec716': '1500-2',
  '45dadf58-b046-4fe1-93fd-bf76568e8ef1': '1400',
  '3c9453df-432f-47cb-9fd8-19b9a19fd012': '1000T',
  '0e29b01a-7383-4c66-81e7-f92e9d52f227': 'Hyd'
}

export async function GET() {
  try {
    // Fetch ALL hit tracker data we have to show full trends
    const { data: hitTrackerData, error } = await supabase
      .from('hits_tracking')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error

    // Group data by date and calculate shift efficiencies
    const dailyData: Record<string, any> = {}
    
    hitTrackerData?.forEach(record => {
      const date = record.date
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          totalHits: 0,
          machines: [],
          // Simulate shift data by dividing the day's hits
          shift1Hits: 0,
          shift2Hits: 0,
          shift3Hits: 0
        }
      }
      
      const target = MACHINE_TARGETS[record.machine_id] || 600
      const weeklyHits = record.weekly_total || 0
      const dailyHits = weeklyHits / 7 // Average daily hits
      
      // Simulate shift distribution (33% each shift roughly)
      dailyData[date].shift1Hits += dailyHits * 0.33
      dailyData[date].shift2Hits += dailyHits * 0.33
      dailyData[date].shift3Hits += dailyHits * 0.34
      dailyData[date].totalHits += dailyHits
      dailyData[date].machines.push({
        id: record.machine_id,
        name: MACHINE_NAMES[record.machine_id],
        hits: dailyHits,
        target: target * 24 // Daily target (24 hours)
      })
    })
    
    // Calculate efficiencies for chart
    const chartData = Object.values(dailyData).map((day: any) => {
      // Calculate average target across all machines for the day
      const avgTarget = day.machines.length > 0
        ? day.machines.reduce((sum: number, m: any) => sum + m.target, 0) / day.machines.length / 3 // Per shift target
        : 2400 // Default 8-hour shift target
      
      return {
        date: day.date,
        shift1: Math.min(Math.round((day.shift1Hits / avgTarget) * 100), 120),
        shift2: Math.min(Math.round((day.shift2Hits / avgTarget) * 100), 120),
        shift3: Math.min(Math.round((day.shift3Hits / avgTarget) * 100), 120),
        target: 90
      }
    })
    
    // Sort by date ascending for chart
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate statistics
    const allShiftEfficiencies = chartData.flatMap(d => [d.shift1, d.shift2, d.shift3])
    const weeklyAverage = allShiftEfficiencies.length 
      ? Math.round(allShiftEfficiencies.reduce((a, b) => a + b, 0) / allShiftEfficiencies.length * 10) / 10
      : 0
    
    // Find best shift
    const shift1Avg = chartData.reduce((sum, d) => sum + d.shift1, 0) / (chartData.length || 1)
    const shift2Avg = chartData.reduce((sum, d) => sum + d.shift2, 0) / (chartData.length || 1)
    const shift3Avg = chartData.reduce((sum, d) => sum + d.shift3, 0) / (chartData.length || 1)
    
    const shifts = [
      { name: 'Shift 1', avg: Math.round(shift1Avg) },
      { name: 'Shift 2', avg: Math.round(shift2Avg) },
      { name: 'Shift 3', avg: Math.round(shift3Avg) }
    ]
    const bestShift = shifts.reduce((a, b) => a.avg > b.avg ? a : b)
    
    const totalHits = Object.values(dailyData).reduce((sum: number, day: any) => sum + day.totalHits, 0)
    const targetAchievement = allShiftEfficiencies.filter(e => e >= 90).length / (allShiftEfficiencies.length || 1) * 100
    
    return NextResponse.json({
      chartData: chartData.slice(-12), // Show last 12 weeks for better trend visibility
      stats: {
        weeklyAverage,
        bestShift,
        totalHits: Math.round(totalHits),
        targetAchievement: Math.round(targetAchievement)
      }
    })
  } catch (error) {
    console.error('Error fetching hit tracker data:', error)
    
    // Return empty data - NO MOCK DATA
    return NextResponse.json({
      chartData: [],
      stats: {
        weeklyAverage: 0,
        bestShift: { name: 'No data', avg: 0 },
        totalHits: 0,
        targetAchievement: 0
      },
      error: 'Failed to fetch data from database'
    })
  }
}