import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Machine names for reference
const MACHINE_NAMES: Record<string, string> = {
  'b8e48ae1-513f-4211-aa15-a421150c15a4': '600 Ton',
  '73a96295-79f3-4dc7-ab38-08ee48679a6f': '1500-1',
  '5d509a37-0e1c-4c18-be71-34638b3ec716': '1500-2',
  '45dadf58-b046-4fe1-93fd-bf76568e8ef1': '1400',
  '3c9453df-432f-47cb-9fd8-19b9a19fd012': '1000T',
  '0e29b01a-7383-4c66-81e7-f92e9d52f227': 'Hyd'
}

// Machine targets per hour
const MACHINE_TARGETS: Record<string, number> = {
  'b8e48ae1-513f-4211-aa15-a421150c15a4': 950,
  '73a96295-79f3-4dc7-ab38-08ee48679a6f': 600,
  '5d509a37-0e1c-4c18-be71-34638b3ec716': 600,
  '45dadf58-b046-4fe1-93fd-bf76568e8ef1': 600,
  '3c9453df-432f-47cb-9fd8-19b9a19fd012': 875,
  '0e29b01a-7383-4c66-81e7-f92e9d52f227': 600
}

export async function GET() {
  try {
    // Fetch hits tracking data from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: hitsData, error } = await supabase
      .from('hits_tracking')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) throw error

    // Analyze patterns in the data
    const machineAnalysis: Record<string, any> = {}
    let totalHits = 0
    let weekCount = 0
    
    hitsData?.forEach(record => {
      const machineId = record.machine_id
      const machineName = MACHINE_NAMES[machineId] || 'Unknown'
      const target = MACHINE_TARGETS[machineId] || 600
      
      if (!machineAnalysis[machineId]) {
        machineAnalysis[machineId] = {
          name: machineName,
          records: 0,
          totalHits: 0,
          avgEfficiency: 0,
          daysBelow80: 0,
          target: target
        }
      }
      
      machineAnalysis[machineId].records++
      machineAnalysis[machineId].totalHits += record.weekly_total || 0
      totalHits += record.weekly_total || 0
      weekCount = Math.max(weekCount, machineAnalysis[machineId].records)
      
      // Calculate efficiency
      const dailyAvg = (record.weekly_total || 0) / 7
      const hourlyRate = dailyAvg / 24
      const efficiency = (hourlyRate / target) * 100
      
      if (efficiency < 80) {
        machineAnalysis[machineId].daysBelow80++
      }
      
      machineAnalysis[machineId].avgEfficiency = 
        (machineAnalysis[machineId].avgEfficiency * (machineAnalysis[machineId].records - 1) + efficiency) / 
        machineAnalysis[machineId].records
    })
    
    // Find insights from the data
    const keyFindings = []
    
    // Find underperforming machines
    Object.entries(machineAnalysis).forEach(([machineId, analysis]) => {
      if (analysis.avgEfficiency < 80 && analysis.records > 0) {
        keyFindings.push({
          icon: 'AlertCircle',
          color: 'text-red-600',
          title: `${analysis.name} Performance Issue`,
          description: `Operating at ${Math.round(analysis.avgEfficiency)}% efficiency, below 80% threshold.`,
          action: `Schedule maintenance check and operator training for ${analysis.name}.`
        })
      } else if (analysis.avgEfficiency > 110 && analysis.records > 0) {
        keyFindings.push({
          icon: 'TrendingUp',
          color: 'text-green-600',
          title: `${analysis.name} Exceeding Targets`,
          description: `Consistently performing at ${Math.round(analysis.avgEfficiency)}% efficiency.`,
          action: `Analyze ${analysis.name} best practices to replicate across other machines.`
        })
      }
    })
    
    // Add general insights
    if (keyFindings.length === 0) {
      keyFindings.push({
        icon: 'TrendingUp',
        color: 'text-green-600',
        title: 'Overall Production Stable',
        description: 'All machines operating within expected parameters.',
        action: 'Continue monitoring for optimization opportunities.'
      })
    }
    
    // Calculate overall efficiency
    const overallEfficiency = Object.values(machineAnalysis)
      .reduce((sum: number, m: any) => sum + m.avgEfficiency, 0) / Object.keys(machineAnalysis).length
    
    // Add efficiency trend
    if (overallEfficiency > 100) {
      keyFindings.push({
        icon: 'Package',
        color: 'text-blue-600',
        title: 'Production Above Target',
        description: `Fleet average efficiency at ${Math.round(overallEfficiency)}%, exceeding targets.`,
        action: 'Consider raising production targets or adding capacity.'
      })
    }
    
    // Add maintenance insight
    const machinesNeedingAttention = Object.values(machineAnalysis)
      .filter((m: any) => m.daysBelow80 > 2).length
    
    if (machinesNeedingAttention > 0) {
      keyFindings.push({
        icon: 'Users',
        color: 'text-purple-600',
        title: 'Maintenance Schedule Review',
        description: `${machinesNeedingAttention} machines showing repeated low efficiency.`,
        action: 'Review preventive maintenance schedule and operator training programs.'
      })
    }
    
    // Create comment patterns based on actual data trends - only meaningful categories
    const belowTargetCount = Object.values(machineAnalysis).filter((m: any) => m.avgEfficiency < 90).length
    const criticalLowCount = Object.values(machineAnalysis).filter((m: any) => m.avgEfficiency < 70).length
    const totalMachines = Object.keys(machineAnalysis).length
    
    const commentPatterns = [
      {
        category: 'Below Target',
        count: belowTargetCount,
        percentage: Math.round((belowTargetCount / totalMachines) * 100),
        trend: belowTargetCount > 3 ? 'up' : 'stable'
      },
      {
        category: 'Maintenance Needed',
        count: machinesNeedingAttention,
        percentage: Math.round((machinesNeedingAttention / totalMachines) * 100),
        trend: machinesNeedingAttention > 2 ? 'up' : 'stable'
      },
      {
        category: 'Critical Performance',
        count: criticalLowCount,
        percentage: Math.round((criticalLowCount / totalMachines) * 100),
        trend: criticalLowCount > 0 ? 'up' : 'stable'
      },
      {
        category: 'Setup Issues',
        count: Math.floor(belowTargetCount * 0.4), // Estimate setup issues as 40% of below target
        percentage: Math.round((Math.floor(belowTargetCount * 0.4) / totalMachines) * 100),
        trend: 'stable'
      }
    ].filter(p => p.count > 0).sort((a, b) => b.count - a.count) // Only show categories with actual issues
    
    // Generate recent "comments" from data patterns
    const recentComments = hitsData?.slice(0, 5).map(record => {
      const machineName = MACHINE_NAMES[record.machine_id]
      const target = MACHINE_TARGETS[record.machine_id] || 600
      const dailyAvg = (record.weekly_total || 0) / 7
      const hourlyRate = dailyAvg / 24
      const efficiency = (hourlyRate / target) * 100
      
      let comment = ''
      if (efficiency < 80) {
        comment = `Machine running below target. Check die alignment and operator setup procedures.`
      } else if (efficiency > 110) {
        comment = `Excellent performance this week. Maintain current operating parameters.`
      } else {
        comment = `Normal operation. Continue monitoring for optimization opportunities.`
      }
      
      return {
        operator: 'System Analysis',
        line: machineName,
        partNumber: `Week ${record.date.substring(5, 10)}`,
        comment: comment,
        date: record.date,
        efficiency: Math.round(efficiency)
      }
    }) || []
    
    // Calculate predictions
    const avgWeeklyHits = totalHits / (weekCount || 1)
    const potentialImprovement = Object.values(machineAnalysis)
      .filter((m: any) => m.avgEfficiency < 90)
      .reduce((sum: number, m: any) => sum + (90 - m.avgEfficiency), 0)
    
    return NextResponse.json({
      insights: {
        summary: `Analysis of ${hitsData?.length || 0} production records across ${Object.keys(machineAnalysis).length} machines reveals opportunities for ${Math.round(potentialImprovement)}% efficiency improvement.`,
        keyFindings: keyFindings.slice(0, 4), // Limit to 4 findings
        predictions: {
          efficiency: `Expected ${Math.round(potentialImprovement / Object.keys(machineAnalysis).length)}% average efficiency increase with targeted improvements`,
          cost: `Potential $${Math.round(avgWeeklyHits * 0.01 * potentialImprovement / 100).toLocaleString()}/month savings from optimization`,
          timeline: 'Improvements achievable within 2-3 week implementation'
        }
      },
      commentPatterns,
      totalComments: hitsData?.length || 0,
      recentComments
    })
  } catch (error) {
    console.error('Error generating AI insights:', error)
    
    // Return error response - NO MOCK DATA
    return NextResponse.json({
      error: 'Failed to generate insights from database',
      insights: {
        summary: "Unable to load production data.",
        keyFindings: [],
        predictions: {}
      },
      commentPatterns: [],
      totalComments: 0,
      recentComments: []
    })
  }
}