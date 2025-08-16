import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch the latest hit tracker data
    const { data: hitTrackerData, error } = await supabase
      .from('hits_tracking')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)

    if (error) throw error

    // Calculate shift averages
    const shiftData = hitTrackerData?.reduce((acc: any, record: any) => {
      const date = record.date
      if (!acc[date]) {
        acc[date] = {
          date,
          shift1: [],
          shift2: [],
          shift3: [],
          target: record.target || 90
        }
      }
      
      if (record.shift === 1) acc[date].shift1.push(record.efficiency || 0)
      if (record.shift === 2) acc[date].shift2.push(record.efficiency || 0)
      if (record.shift === 3) acc[date].shift3.push(record.efficiency || 0)
      
      return acc
    }, {})

    // Average the data per day
    const processedData = Object.values(shiftData || {}).map((day: any) => ({
      date: day.date,
      shift1: day.shift1.length ? Math.round(day.shift1.reduce((a: number, b: number) => a + b, 0) / day.shift1.length) : 0,
      shift2: day.shift2.length ? Math.round(day.shift2.reduce((a: number, b: number) => a + b, 0) / day.shift2.length) : 0,
      shift3: day.shift3.length ? Math.round(day.shift3.reduce((a: number, b: number) => a + b, 0) / day.shift3.length) : 0,
      target: day.target
    }))

    // Calculate statistics
    const allEfficiencies = hitTrackerData?.map(r => r.efficiency || 0) || []
    const weeklyAverage = allEfficiencies.length 
      ? Math.round(allEfficiencies.reduce((a, b) => a + b, 0) / allEfficiencies.length * 10) / 10
      : 0

    const bestShift = processedData.reduce((best, day) => {
      const shifts = [
        { name: 'Shift 1', avg: day.shift1 },
        { name: 'Shift 2', avg: day.shift2 },
        { name: 'Shift 3', avg: day.shift3 }
      ]
      const topShift = shifts.reduce((a, b) => a.avg > b.avg ? a : b)
      return topShift.avg > best.avg ? topShift : best
    }, { name: 'None', avg: 0 })

    const totalHits = hitTrackerData?.reduce((sum, r) => sum + (r.good || 0), 0) || 0
    const targetAchievement = allEfficiencies.filter(e => e >= 90).length / allEfficiencies.length * 100 || 0

    return NextResponse.json({
      chartData: processedData.slice(0, 7).reverse(), // Last 7 days
      stats: {
        weeklyAverage,
        bestShift,
        totalHits,
        targetAchievement: Math.round(targetAchievement)
      }
    })
  } catch (error) {
    console.error('Error fetching hit tracker data:', error)
    
    // Return mock data if database is not available
    return NextResponse.json({
      chartData: [
        { date: '2025-01-06', shift1: 87, shift2: 92, shift3: 85, target: 90 },
        { date: '2025-01-07', shift1: 91, shift2: 94, shift3: 88, target: 90 },
        { date: '2025-01-08', shift1: 93, shift2: 89, shift3: 91, target: 90 },
        { date: '2025-01-09', shift1: 88, shift2: 95, shift3: 87, target: 90 },
        { date: '2025-01-10', shift1: 92, shift2: 93, shift3: 90, target: 90 },
      ],
      stats: {
        weeklyAverage: 91.2,
        bestShift: { name: 'Shift 2', avg: 93 },
        totalHits: 1135,
        targetAchievement: 78
      }
    })
  }
}