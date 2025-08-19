import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Machine targets per hour and names
const MACHINE_TARGETS: Record<string, number> = {
  'b8e48ae1-513f-4211-aa15-a421150c15a4': 950,  // 600 Ton
  '73a96295-79f3-4dc7-ab38-08ee48679a6f': 600,  // 1500-1
  '5d509a37-0e1c-4c18-be71-34638b3ec716': 600,  // 1500-2
  '45dadf58-b046-4fe1-93fd-bf76568e8ef1': 600,  // 1400
  '3c9453df-432f-47cb-9fd8-19b9a19fd012': 875,  // 1000T
  '0e29b01a-7383-4c66-81e7-f92e9d52f227': 600   // 3000 (updated from Hyd)
}

const MACHINE_NAMES: Record<string, string> = {
  'b8e48ae1-513f-4211-aa15-a421150c15a4': '600 Ton',
  '73a96295-79f3-4dc7-ab38-08ee48679a6f': '1500-1',
  '5d509a37-0e1c-4c18-be71-34638b3ec716': '1500-2',
  '45dadf58-b046-4fe1-93fd-bf76568e8ef1': '1400',
  '3c9453df-432f-47cb-9fd8-19b9a19fd012': '1000T',
  '0e29b01a-7383-4c66-81e7-f92e9d52f227': '3000'
}

interface MachineYTD {
  machineId: string
  machineName: string
  target: number
  ytdHits: number
  ytdShift1: number
  ytdShift2: number
  ytdShift3: number
  ytdTarget: number
  performance: number
  lastUpdated: string
}

export async function GET() {
  try {
    // Get start of current year
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const today = new Date()
    const daysSinceYearStart = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))

    // Fetch all production data for current year with shift and machine details
    const { data: productionData, error } = await supabase
      .from('production_data')
      .select(`
        *,
        shifts(shift_name),
        machines(machine_number, machine_name)
      `)
      .gte('date', startOfYear.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error

    // Initialize machine YTD data
    const machineYTDData: Record<string, MachineYTD> = {}
    Object.keys(MACHINE_TARGETS).forEach(machineId => {
      machineYTDData[machineId] = {
        machineId,
        machineName: MACHINE_NAMES[machineId],
        target: MACHINE_TARGETS[machineId],
        ytdHits: 0,
        ytdShift1: 0,
        ytdShift2: 0,
        ytdShift3: 0,
        ytdTarget: MACHINE_TARGETS[machineId] * 24 * daysSinceYearStart, // target per hour * 24 hours * days
        performance: 0,
        lastUpdated: today.toISOString()
      }
    })

    // Process real production data
    productionData?.forEach(record => {
      const machineId = record.machine_id
      if (!machineYTDData[machineId]) return

      // Use actual good parts (hits) from production data
      const hits = record.good_parts || 0
      const shiftName = record.shifts?.shift_name || 'Unknown'

      machineYTDData[machineId].ytdHits += hits

      // Distribute to correct shift based on actual shift data
      if (shiftName.includes('1') || shiftName.toLowerCase().includes('first') || shiftName.toLowerCase().includes('day')) {
        machineYTDData[machineId].ytdShift1 += hits
      } else if (shiftName.includes('2') || shiftName.toLowerCase().includes('second') || shiftName.toLowerCase().includes('afternoon')) {
        machineYTDData[machineId].ytdShift2 += hits
      } else if (shiftName.includes('3') || shiftName.toLowerCase().includes('third') || shiftName.toLowerCase().includes('night')) {
        machineYTDData[machineId].ytdShift3 += hits
      } else {
        // If shift is unknown, default to first shift
        machineYTDData[machineId].ytdShift1 += hits
      }
    })

    // Calculate performance percentages
    Object.values(machineYTDData).forEach(machine => {
      machine.performance = machine.ytdTarget > 0 
        ? (machine.ytdHits / machine.ytdTarget) * 100 
        : 0
    })

    // Calculate overall totals
    const machines = Object.values(machineYTDData)
    const overallYTD = machines.reduce((sum, m) => sum + m.ytdHits, 0)
    const overallTarget = machines.reduce((sum, m) => sum + m.ytdTarget, 0)
    const shiftTotals = {
      shift1: machines.reduce((sum, m) => sum + m.ytdShift1, 0),
      shift2: machines.reduce((sum, m) => sum + m.ytdShift2, 0),
      shift3: machines.reduce((sum, m) => sum + m.ytdShift3, 0)
    }

    return NextResponse.json({
      overallYTD: Math.round(overallYTD),
      overallTarget: Math.round(overallTarget),
      overallPerformance: overallTarget > 0 ? (overallYTD / overallTarget) * 100 : 0,
      machines: machines.map(m => ({
        ...m,
        ytdHits: Math.round(m.ytdHits),
        ytdShift1: Math.round(m.ytdShift1),
        ytdShift2: Math.round(m.ytdShift2),
        ytdShift3: Math.round(m.ytdShift3),
        ytdTarget: Math.round(m.ytdTarget)
      })),
      shiftTotals: {
        shift1: Math.round(shiftTotals.shift1),
        shift2: Math.round(shiftTotals.shift2),
        shift3: Math.round(shiftTotals.shift3)
      },
      daysSinceYearStart,
      projectedAnnual: daysSinceYearStart > 0 ? Math.round((overallYTD / daysSinceYearStart) * 365) : 0
    })

  } catch (error) {
    console.error('Error fetching YTD totals from production_data:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch YTD data from production database. Please ensure production data has been entered.',
      overallYTD: 0,
      overallTarget: 0,
      overallPerformance: 0,
      machines: [],
      shiftTotals: { shift1: 0, shift2: 0, shift3: 0 },
      daysSinceYearStart: Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
      projectedAnnual: 0
    }, { status: 500 })
  }
}