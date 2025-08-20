import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch progress updates for a project
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
      .from('pdca_progress_updates')
      .select(`
        *,
        pdca_achievements(achievement_text),
        pdca_challenges(challenge_text),
        pdca_next_steps(next_step_text)
      `)
      .eq('project_id', projectId)
      .order('update_date', { ascending: false })
    
    if (error) throw error
    
    // Transform the data to match the expected format
    const formattedData = data.map(update => ({
      id: update.id,
      date: update.update_date,
      author: update.author,
      summary: update.summary,
      overallProgress: update.overall_progress,
      achievements: update.pdca_achievements?.map((a: any) => a.achievement_text) || [],
      challenges: update.pdca_challenges?.map((c: any) => c.challenge_text) || [],
      nextSteps: update.pdca_next_steps?.map((n: any) => n.next_step_text) || []
    }))
    
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error fetching progress updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress updates' },
      { status: 500 }
    )
  }
}

// POST - Create new progress update
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Create the progress update
    const { data: progressUpdate, error: progressError } = await supabase
      .from('pdca_progress_updates')
      .insert({
        project_id: body.projectId,
        author: body.author,
        summary: body.summary,
        overall_progress: body.overallProgress || 0
      })
      .select()
      .single()
    
    if (progressError) throw progressError
    
    // Add achievements
    if (body.achievements && body.achievements.length > 0) {
      const achievements = body.achievements.map((text: string) => ({
        progress_update_id: progressUpdate.id,
        achievement_text: text
      }))
      
      const { error } = await supabase
        .from('pdca_achievements')
        .insert(achievements)
      
      if (error) throw error
    }
    
    // Add challenges
    if (body.challenges && body.challenges.length > 0) {
      const challenges = body.challenges.map((text: string) => ({
        progress_update_id: progressUpdate.id,
        challenge_text: text
      }))
      
      const { error } = await supabase
        .from('pdca_challenges')
        .insert(challenges)
      
      if (error) throw error
    }
    
    // Add next steps
    if (body.nextSteps && body.nextSteps.length > 0) {
      const nextSteps = body.nextSteps.map((text: string) => ({
        progress_update_id: progressUpdate.id,
        next_step_text: text
      }))
      
      const { error } = await supabase
        .from('pdca_next_steps')
        .insert(nextSteps)
      
      if (error) throw error
    }
    
    return NextResponse.json({
      success: true,
      progressUpdate: progressUpdate
    })
  } catch (error) {
    console.error('Error creating progress update:', error)
    return NextResponse.json(
      { error: 'Failed to create progress update' },
      { status: 500 }
    )
  }
}

// DELETE - Delete progress update
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Progress update ID is required' },
        { status: 400 }
      )
    }
    
    // Deleting the progress update will cascade delete related achievements, challenges, and next steps
    const { error } = await supabase
      .from('pdca_progress_updates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting progress update:', error)
    return NextResponse.json(
      { error: 'Failed to delete progress update' },
      { status: 500 }
    )
  }
}