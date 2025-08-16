import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const workcenter = searchParams.get('workcenter')
    const partNumber = searchParams.get('partNumber')
    const source = searchParams.get('source') // New: Filter by Pioneer/Main
    const month = searchParams.get('month') // New: Single month filter
    
    // Build query
    let query = supabase
      .from('scrap_data')
      .select('*')
    
    if (startDate && endDate) {
      query = query.gte('month', startDate).lte('month', endDate)
    }
    
    if (month && month !== 'all') {
      query = query.eq('month', month)
    }
    
    if (workcenter && workcenter !== 'all') {
      query = query.eq('workcenter', workcenter)
    }
    
    if (partNumber) {
      query = query.ilike('part_number', `%${partNumber}%`)
    }
    
    if (source) {
      query = query.ilike('source_sheet', `%${source}%`)
    }
    
    // Get summary data using aggregation
    let summaryQuery = supabase
      .from('scrap_data')
      .select('*')
    
    // Apply same filters for summary
    if (startDate && endDate) {
      summaryQuery = summaryQuery.gte('month', startDate).lte('month', endDate)
    }
    if (month && month !== 'all') {
      summaryQuery = summaryQuery.eq('month', month)
    }
    if (workcenter && workcenter !== 'all') {
      summaryQuery = summaryQuery.eq('workcenter', workcenter)
    }
    if (partNumber) {
      summaryQuery = summaryQuery.ilike('part_number', `%${partNumber}%`)
    }
    if (source) {
      summaryQuery = summaryQuery.ilike('source_sheet', `%${source}%`)
    }

    const { data: scrapData, error } = await summaryQuery.limit(5000)
    
    if (error) throw error
    
    // Analyze the data
    const totalScrap = scrapData?.reduce((sum, record) => sum + (record.quantity || 0), 0) || 0
    const totalCost = scrapData?.reduce((sum, record) => sum + (record.extended_cost || 0), 0) || 0
    
    // Group by reason code
    const reasonAnalysis: Record<string, any> = {}
    scrapData?.forEach(record => {
      const reason = record.reason_code || 'Unknown'
      if (!reasonAnalysis[reason]) {
        reasonAnalysis[reason] = {
          reason,
          quantity: 0,
          cost: 0,
          occurrences: 0,
          parts: new Set()
        }
      }
      reasonAnalysis[reason].quantity += record.quantity || 0
      reasonAnalysis[reason].cost += record.extended_cost || 0
      reasonAnalysis[reason].occurrences++
      reasonAnalysis[reason].parts.add(record.part_number)
    })
    
    // Convert to array and sort by quantity
    const topReasons = Object.values(reasonAnalysis)
      .map(r => ({
        reason: r.reason,
        quantity: r.quantity,
        cost: r.cost,
        occurrences: r.occurrences,
        uniqueParts: r.parts.size,
        percentage: ((r.quantity / totalScrap) * 100).toFixed(1)
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
    
    // Group by workcenter
    const workcenterAnalysis: Record<string, any> = {}
    scrapData?.forEach(record => {
      const wc = record.workcenter || 'Unknown'
      if (!workcenterAnalysis[wc]) {
        workcenterAnalysis[wc] = {
          workcenter: wc,
          quantity: 0,
          cost: 0,
          records: 0
        }
      }
      workcenterAnalysis[wc].quantity += record.quantity || 0
      workcenterAnalysis[wc].cost += record.extended_cost || 0
      workcenterAnalysis[wc].records++
    })
    
    const workcenterSummary = Object.values(workcenterAnalysis)
      .sort((a, b) => b.quantity - a.quantity)
    
    // Group by operation (important for Pioneer data since no reason codes)
    const operationAnalysis: Record<string, any> = {}
    scrapData?.forEach(record => {
      const operation = record.operation || 'Unknown'
      if (!operationAnalysis[operation]) {
        operationAnalysis[operation] = {
          operation,
          quantity: 0,
          cost: 0,
          records: 0,
          parts: new Set()
        }
      }
      operationAnalysis[operation].quantity += record.quantity || 0
      operationAnalysis[operation].cost += record.extended_cost || 0
      operationAnalysis[operation].records++
      operationAnalysis[operation].parts.add(record.part_number)
    })
    
    const operationSummary = Object.values(operationAnalysis)
      .map(op => ({
        operation: op.operation,
        quantity: op.quantity,
        cost: op.cost,
        records: op.records,
        uniqueParts: op.parts.size,
        percentage: ((op.quantity / totalScrap) * 100).toFixed(1)
      }))
      .sort((a, b) => b.quantity - a.quantity)

    // Group by part number
    const partAnalysis: Record<string, any> = {}
    scrapData?.forEach(record => {
      const part = record.part_number || 'Unknown'
      if (!partAnalysis[part]) {
        partAnalysis[part] = {
          partNumber: part,
          revision: record.revision,
          quantity: 0,
          cost: 0,
          operations: new Set(),
          reasons: new Set()
        }
      }
      partAnalysis[part].quantity += record.quantity || 0
      partAnalysis[part].cost += record.extended_cost || 0
      partAnalysis[part].operations.add(record.operation)
      partAnalysis[part].reasons.add(record.reason_code)
    })
    
    const topParts = Object.values(partAnalysis)
      .map(p => ({
        partNumber: p.partNumber,
        revision: p.revision,
        quantity: p.quantity,
        cost: p.cost,
        operationCount: p.operations.size,
        reasonCount: p.reasons.size
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20)
    
    // Get monthly trends using database aggregation
    let monthlyQuery = supabase
      .from('scrap_data')
      .select('month, quantity, extended_cost')
    
    // Apply same filters
    if (startDate && endDate) {
      monthlyQuery = monthlyQuery.gte('month', startDate).lte('month', endDate)
    }
    if (month && month !== 'all') {
      monthlyQuery = monthlyQuery.eq('month', month)
    }
    if (workcenter && workcenter !== 'all') {
      monthlyQuery = monthlyQuery.eq('workcenter', workcenter)
    }
    if (partNumber) {
      monthlyQuery = monthlyQuery.ilike('part_number', `%${partNumber}%`)
    }
    if (source) {
      monthlyQuery = monthlyQuery.ilike('source_sheet', `%${source}%`)
    }
    
    const { data: monthlyData } = await monthlyQuery.limit(10000)
    
    // Monthly trend
    const monthlyTrend: Record<string, any> = {}
    monthlyData?.forEach(record => {
      const month = record.month || 'Unknown'
      if (!monthlyTrend[month]) {
        monthlyTrend[month] = {
          month,
          quantity: 0,
          cost: 0,
          records: 0
        }
      }
      monthlyTrend[month].quantity += record.quantity || 0
      monthlyTrend[month].cost += record.extended_cost || 0
      monthlyTrend[month].records++
    })
    
    const trend = Object.values(monthlyTrend)
      .sort((a, b) => a.month.localeCompare(b.month))
    
    // Calculate insights
    const insights = []
    
    // Top scrap reason insight
    if (topReasons[0]) {
      insights.push({
        type: 'critical',
        title: `Top Scrap Reason: ${topReasons[0].reason}`,
        description: `Accounts for ${topReasons[0].percentage}% of all scrap (${topReasons[0].quantity.toLocaleString()} units)`,
        action: 'Focus improvement efforts on this reason code'
      })
    }
    
    // Workcenter with highest scrap
    if (workcenterSummary[0]) {
      insights.push({
        type: 'warning',
        title: `Highest Scrap Workcenter: ${workcenterSummary[0].workcenter}`,
        description: `${workcenterSummary[0].quantity.toLocaleString()} units scrapped`,
        action: 'Review processes and training at this workcenter'
      })
    }
    
    // Part with highest scrap
    if (topParts[0]) {
      insights.push({
        type: 'info',
        title: `Most Scrapped Part: ${topParts[0].partNumber}`,
        description: `${topParts[0].quantity.toLocaleString()} units across ${topParts[0].operationCount} operations`,
        action: 'Consider design or process improvements for this part'
      })
    }
    
    // Trend insight
    if (trend.length >= 2) {
      const latest = trend[trend.length - 1]
      const previous = trend[trend.length - 2]
      const change = ((latest.quantity - previous.quantity) / previous.quantity) * 100
      
      if (Math.abs(change) > 10) {
        insights.push({
          type: change > 0 ? 'alert' : 'success',
          title: `Scrap ${change > 0 ? 'Increased' : 'Decreased'} ${Math.abs(change).toFixed(0)}%`,
          description: `From ${previous.month} to ${latest.month}`,
          action: change > 0 ? 'Investigate root cause of increase' : 'Document improvement actions taken'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      data: scrapData,
      summary: {
        totalScrap,
        totalCost,
        totalRecords: scrapData?.length || 0,
        dateRange: {
          start: scrapData?.[scrapData.length - 1]?.month || '',
          end: scrapData?.[0]?.month || ''
        }
      },
      topReasons,
      workcenterSummary,
      operationAnalysis: operationSummary,
      topParts,
      monthlyTrends: trend,
      insights
    })
    
  } catch (error) {
    console.error('Error analyzing scrap data:', error)
    return NextResponse.json(
      { error: 'Failed to analyze scrap data' },
      { status: 500 }
    )
  }
}