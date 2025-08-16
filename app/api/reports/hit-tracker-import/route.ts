import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Data validation schema
interface HitTrackerEntry {
  machine: string
  date: string
  shift: number
  hits: number
  efficiency: number
  downtime_minutes?: number
  operator?: string
  part_number?: string
  comments?: string
}

interface OEEMetrics {
  machine: string
  date: string
  availability: number
  performance: number
  quality: number
  oee: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request structure
    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected: { type, data }' },
        { status: 400 }
      )
    }

    const { type, data, source = 'API' } = body

    // Handle different import types
    switch (type) {
      case 'hit-tracker':
        return await importHitTrackerData(data, source)
      
      case 'oee-metrics':
        return await importOEEMetrics(data, source)
      
      case 'batch-update':
        return await batchUpdateRecords(data, source)
      
      default:
        return NextResponse.json(
          { error: `Unknown import type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: 'Failed to process import', details: error },
      { status: 500 }
    )
  }
}

async function importHitTrackerData(data: HitTrackerEntry[], source: string) {
  // Validate data structure
  const validatedData = []
  const errors = []
  
  for (let i = 0; i < data.length; i++) {
    const entry = data[i]
    
    // Required fields validation
    if (!entry.machine || !entry.date || entry.shift === undefined || entry.hits === undefined) {
      errors.push({
        row: i + 1,
        error: 'Missing required fields (machine, date, shift, hits)'
      })
      continue
    }
    
    // Validate data types and ranges
    if (entry.shift < 1 || entry.shift > 3) {
      errors.push({
        row: i + 1,
        error: 'Shift must be between 1 and 3'
      })
      continue
    }
    
    if (entry.efficiency && (entry.efficiency < 0 || entry.efficiency > 200)) {
      errors.push({
        row: i + 1,
        error: 'Efficiency must be between 0 and 200'
      })
      continue
    }
    
    // Add calculated fields
    validatedData.push({
      ...entry,
      imported_at: new Date().toISOString(),
      source,
      // Calculate OEE if not provided
      oee: entry.efficiency ? (entry.efficiency * 0.85 * 0.97).toFixed(1) : null
    })
  }
  
  // If there are validation errors, return them
  if (errors.length > 0 && validatedData.length === 0) {
    return NextResponse.json(
      { 
        error: 'Validation failed for all records',
        validationErrors: errors 
      },
      { status: 400 }
    )
  }
  
  // Insert valid records into database
  const { data: insertedData, error: insertError } = await supabase
    .from('hit_tracker')
    .insert(validatedData)
    .select()
  
  if (insertError) {
    return NextResponse.json(
      { 
        error: 'Database insertion failed',
        details: insertError,
        validationErrors: errors 
      },
      { status: 500 }
    )
  }
  
  // Calculate summary statistics
  const summary = {
    totalRecords: data.length,
    successfulImports: validatedData.length,
    failedImports: errors.length,
    totalHits: validatedData.reduce((sum, r) => sum + r.hits, 0),
    averageEfficiency: validatedData.length > 0
      ? (validatedData.reduce((sum, r) => sum + (r.efficiency || 0), 0) / validatedData.length).toFixed(1)
      : 0,
    machines: [...new Set(validatedData.map(r => r.machine))],
    dateRange: {
      from: validatedData.length > 0 ? Math.min(...validatedData.map(r => new Date(r.date).getTime())) : null,
      to: validatedData.length > 0 ? Math.max(...validatedData.map(r => new Date(r.date).getTime())) : null
    }
  }
  
  return NextResponse.json({
    success: true,
    summary,
    imported: insertedData?.length || 0,
    validationErrors: errors.length > 0 ? errors : undefined
  })
}

async function importOEEMetrics(data: OEEMetrics[], source: string) {
  // Validate OEE metrics
  const validatedData = []
  const errors = []
  
  for (let i = 0; i < data.length; i++) {
    const metric = data[i]
    
    // Validate required fields
    if (!metric.machine || !metric.date) {
      errors.push({
        row: i + 1,
        error: 'Missing required fields (machine, date)'
      })
      continue
    }
    
    // Validate OEE components (should be percentages)
    const components = ['availability', 'performance', 'quality']
    let hasError = false
    
    for (const component of components) {
      const value = metric[component as keyof OEEMetrics]
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push({
          row: i + 1,
          error: `${component} must be between 0 and 100`
        })
        hasError = true
        break
      }
    }
    
    if (hasError) continue
    
    // Calculate OEE if not provided
    const calculatedOEE = (
      (metric.availability / 100) * 
      (metric.performance / 100) * 
      (metric.quality / 100) * 
      100
    ).toFixed(1)
    
    validatedData.push({
      ...metric,
      oee: metric.oee || parseFloat(calculatedOEE),
      imported_at: new Date().toISOString(),
      source,
      world_class_gap: 85 - (metric.oee || parseFloat(calculatedOEE))
    })
  }
  
  // Insert into OEE metrics table
  const { data: insertedData, error: insertError } = await supabase
    .from('oee_metrics')
    .insert(validatedData)
    .select()
  
  if (insertError) {
    return NextResponse.json(
      { 
        error: 'Failed to insert OEE metrics',
        details: insertError,
        validationErrors: errors 
      },
      { status: 500 }
    )
  }
  
  // Calculate OEE summary
  const avgOEE = validatedData.length > 0
    ? (validatedData.reduce((sum, r) => sum + r.oee, 0) / validatedData.length).toFixed(1)
    : 0
  
  const worldClassMachines = validatedData.filter(r => r.oee >= 85).map(r => r.machine)
  const needsImprovement = validatedData.filter(r => r.oee < 65).map(r => r.machine)
  
  return NextResponse.json({
    success: true,
    summary: {
      recordsImported: validatedData.length,
      averageOEE: avgOEE,
      worldClassMachines,
      needsImprovement,
      dateRange: {
        from: validatedData[0]?.date,
        to: validatedData[validatedData.length - 1]?.date
      }
    },
    validationErrors: errors.length > 0 ? errors : undefined
  })
}

async function batchUpdateRecords(data: any[], source: string) {
  // Handle batch updates for existing records
  const updates = []
  const errors = []
  
  for (const record of data) {
    if (!record.id) {
      errors.push({ 
        record, 
        error: 'Missing record ID for update' 
      })
      continue
    }
    
    // Update hit tracker record
    const { data: updated, error } = await supabase
      .from('hit_tracker')
      .update({
        ...record,
        updated_at: new Date().toISOString(),
        update_source: source
      })
      .eq('id', record.id)
      .select()
    
    if (error) {
      errors.push({ 
        id: record.id, 
        error: error.message 
      })
    } else {
      updates.push(updated?.[0])
    }
  }
  
  return NextResponse.json({
    success: errors.length === 0,
    updated: updates.length,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined
  })
}

// GET endpoint to retrieve import history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const machine = searchParams.get('machine')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build query
    let query = supabase
      .from('hit_tracker')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply filters
    if (machine) {
      query = query.eq('machine', machine)
    }
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch data', details: error },
        { status: 500 }
      )
    }
    
    // Calculate statistics
    const stats = data ? {
      totalRecords: count,
      totalHits: data.reduce((sum, r) => sum + (r.hits || 0), 0),
      avgEfficiency: data.length > 0
        ? (data.reduce((sum, r) => sum + (r.efficiency || 0), 0) / data.length).toFixed(1)
        : 0,
      machines: [...new Set(data.map(r => r.machine))]
    } : null
    
    return NextResponse.json({
      data,
      stats,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve data' },
      { status: 500 }
    )
  }
}