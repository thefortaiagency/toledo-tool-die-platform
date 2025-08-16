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

// AI categorization rules
function categorizeComment(comment: string, efficiency?: number, downtime?: number): string[] {
  const categories: string[] = []
  const lowerComment = comment?.toLowerCase() || ''
  
  // Die issues
  if (lowerComment.includes('die') || lowerComment.includes('alignment') || lowerComment.includes('tooling')) {
    categories.push('Die/Tooling Issue')
  }
  
  // Material issues
  if (lowerComment.includes('material') || lowerComment.includes('stock') || lowerComment.includes('coil')) {
    categories.push('Material Issue')
  }
  
  // Setup issues
  if (lowerComment.includes('setup') || lowerComment.includes('changeover') || lowerComment.includes('adjustment')) {
    categories.push('Setup/Changeover')
  }
  
  // Maintenance
  if (lowerComment.includes('maintenance') || lowerComment.includes('repair') || lowerComment.includes('broken') || lowerComment.includes('fix')) {
    categories.push('Maintenance Required')
  }
  
  // Quality
  if (lowerComment.includes('quality') || lowerComment.includes('defect') || lowerComment.includes('scrap') || lowerComment.includes('reject')) {
    categories.push('Quality Issue')
  }
  
  // Machine issues
  if (lowerComment.includes('machine') || lowerComment.includes('press') || lowerComment.includes('equipment')) {
    categories.push('Machine Issue')
  }
  
  // Performance based on efficiency
  if (efficiency !== undefined) {
    if (efficiency < 70) {
      categories.push('Critical Performance')
    } else if (efficiency < 85) {
      categories.push('Below Target')
    } else if (efficiency > 110) {
      categories.push('Exceeding Target')
    }
  }
  
  // Downtime based
  if (downtime !== undefined && downtime > 30) {
    categories.push('Significant Downtime')
  }
  
  // If no categories found, mark as uncategorized
  if (categories.length === 0) {
    categories.push('Uncategorized')
  }
  
  return categories
}

// Calculate priority based on categories and metrics
function calculatePriority(categories: string[], efficiency?: number, downtime?: number): 'high' | 'medium' | 'low' {
  if (categories.includes('Critical Performance') || categories.includes('Maintenance Required')) {
    return 'high'
  }
  if (categories.includes('Below Target') || categories.includes('Quality Issue') || (downtime && downtime > 60)) {
    return 'high'
  }
  if (categories.includes('Die/Tooling Issue') || categories.includes('Machine Issue')) {
    return 'medium'
  }
  if (efficiency && efficiency < 85) {
    return 'medium'
  }
  return 'low'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const machine = searchParams.get('machine')
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')
    
    // Build query for production_data table which has operator_comments
    let query = supabase
      .from('production_data')
      .select('*')
      .or('operator_comments.not.is.null,supervisor_comments.not.is.null')
      .order('date', { ascending: false })
    
    // Apply filters
    if (machine) {
      query = query.eq('machine_id', machine)
    }
    
    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('date', dateTo)
    }
    
    const { data: records, error } = await query
    
    if (error) throw error
    
    // Process and categorize comments from production_data
    const processedComments: any[] = []
    
    records?.forEach(record => {
      const machineName = MACHINE_NAMES[record.machine_id] || 'Unknown'
      const efficiency = record.actual_efficiency || 0
      
      // Process operator comments
      if (record.operator_comments && record.operator_comments.trim() !== '') {
        const categories = categorizeComment(record.operator_comments, efficiency, record.downtime_minutes)
        const priorityLevel = calculatePriority(categories, efficiency, record.downtime_minutes)
        
        processedComments.push({
          id: record.id + '_op',
          date: record.date,
          machine: machineName,
          machine_id: record.machine_id,
          shift: record.shift_id || 1,
          operator: 'Operator',
          comment: record.operator_comments,
          categories: categories,
          priority: priorityLevel,
          efficiency: Math.round(efficiency),
          downtime: record.downtime_minutes || 0,
          hits: record.total_cycles || 0,
          part_number: record.part_id || 'N/A'
        })
      }
      
      // Process supervisor comments
      if (record.supervisor_comments && record.supervisor_comments.trim() !== '') {
        const categories = categorizeComment(record.supervisor_comments, efficiency, record.downtime_minutes)
        const priorityLevel = calculatePriority(categories, efficiency, record.downtime_minutes)
        
        processedComments.push({
          id: record.id + '_sup',
          date: record.date,
          machine: machineName,
          machine_id: record.machine_id,
          shift: record.shift_id || 1,
          operator: 'Supervisor',
          comment: record.supervisor_comments,
          categories: categories,
          priority: priorityLevel,
          efficiency: Math.round(efficiency),
          downtime: record.downtime_minutes || 0,
          hits: record.total_cycles || 0,
          part_number: record.part_id || 'N/A'
        })
      }
    })
    
    // Apply category filter if specified
    let filteredComments = processedComments
    if (category && category !== 'all') {
      filteredComments = processedComments.filter(comment => 
        comment.categories.includes(category)
      )
    }
    
    // Apply priority filter if specified
    if (priority && priority !== 'all') {
      filteredComments = filteredComments.filter(comment => 
        comment.priority === priority
      )
    }
    
    // Calculate statistics
    const categoryStats: Record<string, number> = {}
    const priorityStats = { high: 0, medium: 0, low: 0 }
    const machineStats: Record<string, number> = {}
    
    processedComments.forEach((comment: any) => {
      // Category stats
      comment.categories.forEach((cat: string) => {
        categoryStats[cat] = (categoryStats[cat] || 0) + 1
      })
      
      // Priority stats
      const priority = comment.priority as 'high' | 'medium' | 'low'
      priorityStats[priority]++
      
      // Machine stats
      machineStats[comment.machine] = (machineStats[comment.machine] || 0) + 1
    })
    
    // Sort categories by count
    const sortedCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / processedComments.length) * 100)
      }))
    
    return NextResponse.json({
      comments: filteredComments,
      total: filteredComments.length,
      statistics: {
        totalComments: processedComments.length,
        categories: sortedCategories,
        priorities: priorityStats,
        machines: machineStats
      }
    })
    
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({
      error: 'Failed to fetch comments',
      comments: [],
      total: 0,
      statistics: {
        totalComments: 0,
        categories: [],
        priorities: { high: 0, medium: 0, low: 0 },
        machines: {}
      }
    })
  }
}