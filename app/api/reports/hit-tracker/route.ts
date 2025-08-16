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