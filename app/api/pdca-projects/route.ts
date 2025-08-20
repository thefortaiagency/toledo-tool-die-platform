import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all PDCA projects or a specific project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    if (projectId) {
      // Fetch specific project with all related data
      const { data: project, error: projectError } = await supabase
        .from('pdca_projects')
        .select(`
          *,
          pdca_success_criteria(*),
          pdca_stakeholders(*),
          pdca_action_items(*),
          pdca_milestones(*, pdca_milestone_criteria(*)),
          pdca_progress_updates(*, pdca_achievements(*), pdca_challenges(*), pdca_next_steps(*))
        `)
        .eq('project_id', projectId)
        .single()
      
      if (projectError) throw projectError
      
      return NextResponse.json(project)
    } else {
      // Fetch all projects summary
      const { data: projects, error } = await supabase
        .from('pdca_project_summary')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('PDCA tables not yet created in database')
          return NextResponse.json([])
        }
        throw error
      }
      
      return NextResponse.json(projects || [])
    }
  } catch (error) {
    console.error('Error fetching PDCA projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST - Create new PDCA project
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Start a transaction
    const { data: project, error: projectError } = await supabase
      .from('pdca_projects')
      .insert({
        project_id: body.projectId,
        project_name: body.projectName,
        project_type: body.projectType,
        target_metric: body.targetMetric,
        current_value: body.currentValue,
        target_value: body.targetValue,
        unit: body.unit,
        project_manager: body.projectManager,
        sponsor: body.sponsor,
        start_date: body.startDate,
        target_end_date: body.targetEndDate,
        estimated_budget: body.estimatedBudget,
        risk_level: body.riskLevel,
        business_impact: body.businessImpact,
        status: 'planning'
      })
      .select()
      .single()
    
    if (projectError) throw projectError
    
    // Insert success criteria
    if (body.successCriteria && body.successCriteria.length > 0) {
      const criteria = body.successCriteria.map((text: string) => ({
        project_id: project.id,
        criteria_text: text
      }))
      
      const { error: criteriaError } = await supabase
        .from('pdca_success_criteria')
        .insert(criteria)
      
      if (criteriaError) throw criteriaError
    }
    
    // Insert stakeholders
    if (body.stakeholders && body.stakeholders.length > 0) {
      const stakeholders = body.stakeholders.map((name: string) => ({
        project_id: project.id,
        stakeholder_name: name
      }))
      
      const { error: stakeholderError } = await supabase
        .from('pdca_stakeholders')
        .insert(stakeholders)
      
      if (stakeholderError) throw stakeholderError
    }
    
    // Insert initial action items if provided
    if (body.actionItems && body.actionItems.length > 0) {
      const items = body.actionItems.map((item: any) => ({
        project_id: project.id,
        phase: item.phase,
        title: item.title,
        description: item.description,
        assignee: item.assignee,
        due_date: item.dueDate,
        priority: item.priority,
        status: 'pending'
      }))
      
      const { error: itemsError } = await supabase
        .from('pdca_action_items')
        .insert(items)
      
      if (itemsError) throw itemsError
    }
    
    // Insert initial milestones if provided
    if (body.milestones && body.milestones.length > 0) {
      for (const milestone of body.milestones) {
        const { data: milestonData, error: milestoneError } = await supabase
          .from('pdca_milestones')
          .insert({
            project_id: project.id,
            title: milestone.title,
            description: milestone.description,
            target_date: milestone.targetDate,
            status: 'pending'
          })
          .select()
          .single()
        
        if (milestoneError) throw milestoneError
        
        // Insert milestone criteria
        if (milestone.criteriaList && milestone.criteriaList.length > 0) {
          const criteria = milestone.criteriaList.map((text: string) => ({
            milestone_id: milestonData.id,
            criteria_text: text
          }))
          
          const { error: criteriaError } = await supabase
            .from('pdca_milestone_criteria')
            .insert(criteria)
          
          if (criteriaError) throw criteriaError
        }
      }
    }
    
    // Create initial progress update
    if (body.initialProgress) {
      const { data: progressUpdate, error: progressError } = await supabase
        .from('pdca_progress_updates')
        .insert({
          project_id: project.id,
          author: body.projectManager || 'System',
          summary: body.initialProgress.summary || 'Project initiated',
          overall_progress: 0
        })
        .select()
        .single()
      
      if (progressError) throw progressError
      
      // Add achievements, challenges, and next steps
      if (body.initialProgress.achievements) {
        const achievements = body.initialProgress.achievements.map((text: string) => ({
          progress_update_id: progressUpdate.id,
          achievement_text: text
        }))
        await supabase.from('pdca_achievements').insert(achievements)
      }
      
      if (body.initialProgress.challenges) {
        const challenges = body.initialProgress.challenges.map((text: string) => ({
          progress_update_id: progressUpdate.id,
          challenge_text: text
        }))
        await supabase.from('pdca_challenges').insert(challenges)
      }
      
      if (body.initialProgress.nextSteps) {
        const nextSteps = body.initialProgress.nextSteps.map((text: string) => ({
          progress_update_id: progressUpdate.id,
          next_step_text: text
        }))
        await supabase.from('pdca_next_steps').insert(nextSteps)
      }
    }
    
    return NextResponse.json({
      success: true,
      project: project
    })
  } catch (error) {
    console.error('Error creating PDCA project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

// PUT - Update existing PDCA project
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { projectId, ...updateData } = body
    
    const { data, error } = await supabase
      .from('pdca_projects')
      .update(updateData)
      .eq('project_id', projectId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      project: data
    })
  } catch (error) {
    console.error('Error updating PDCA project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}