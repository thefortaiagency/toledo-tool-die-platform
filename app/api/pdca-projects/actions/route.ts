import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch action items for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('pdca_action_items')
      .select('*')
      .eq('project_id', projectId)
      .order('phase', { ascending: true })
      .order('priority', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching action items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action items' },
      { status: 500 }
    )
  }
}

// POST - Create new action item
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('pdca_action_items')
      .insert({
        project_id: body.projectId,
        phase: body.phase,
        title: body.title,
        description: body.description,
        assignee: body.assignee,
        due_date: body.dueDate,
        priority: body.priority || 'medium',
        status: body.status || 'pending',
        estimated_hours: body.estimatedHours,
        notes: body.notes
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      actionItem: data
    })
  } catch (error) {
    console.error('Error creating action item:', error)
    return NextResponse.json(
      { error: 'Failed to create action item' },
      { status: 500 }
    )
  }
}

// PUT - Update action item
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // If status is changing to in_progress, set actual_start_date
    if (updateData.status === 'in_progress' && !updateData.actual_start_date) {
      updateData.actual_start_date = new Date().toISOString().split('T')[0]
    }
    
    // If status is changing to completed, set actual_end_date
    if (updateData.status === 'completed' && !updateData.actual_end_date) {
      updateData.actual_end_date = new Date().toISOString().split('T')[0]
      updateData.progress = 100
    }
    
    const { data, error } = await supabase
      .from('pdca_action_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      actionItem: data
    })
  } catch (error) {
    console.error('Error updating action item:', error)
    return NextResponse.json(
      { error: 'Failed to update action item' },
      { status: 500 }
    )
  }
}

// DELETE - Delete action item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Action item ID is required' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('pdca_action_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting action item:', error)
    return NextResponse.json(
      { error: 'Failed to delete action item' },
      { status: 500 }
    )
  }
}