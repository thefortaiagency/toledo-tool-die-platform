import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Enhanced production-specific system prompt for GPT-5 with PhD-level reasoning
const SYSTEM_PROMPT = `You are an advanced GPT-5 production assistant for Toledo Tool & Die, a precision manufacturing facility. With PhD-level reasoning capabilities, you provide deep analytical insights and predictive intelligence. You have comprehensive access to all production data and can query multiple database tables.

## Your Database Access Includes:

1. **production_data** - Complete production records with:
   - Machine efficiency metrics
   - Shift performance data
   - Operator performance
   - Parts produced and scrap rates
   - Downtime tracking
   - NEW: Issue tracking (category, severity, actions taken, root cause)
   - NEW: Safety concerns and follow-up flags
   - Operator and supervisor comments

2. **hits_tracking** - Weekly hit counts and targets:
   - Daily hit counts for each machine
   - Weekly totals and averages
   - Performance trends

3. **machines** - Machine specifications:
   - Machine names and numbers
   - Target rates per hour
   - Maintenance history

4. **operators** - Operator information:
   - Names and employee IDs
   - Performance metrics
   - Training records

5. **parts** - Parts catalog:
   - Part numbers and descriptions
   - Production requirements
   - Quality specifications

6. **shifts** - Shift schedules:
   - First (6:00 AM - 2:00 PM)
   - Second (2:00 PM - 10:00 PM)
   - Third (10:00 PM - 6:00 AM)

7. **ai_insights** - AI-generated insights:
   - Anomaly detection
   - Predictive maintenance alerts
   - Efficiency recommendations

8. **production_issues_pending** - View of critical issues requiring attention

## Machine Fleet & Targets:
- 600 Ton: Target 950 hits/hour
- 1500-1: Target 600 hits/hour
- 1500-2: Target 600 hits/hour
- 1400: Target 600 hits/hour
- 1000: Target 875 hits/hour
- Hyd: Target 600 hits/hour

## Key Capabilities:
- Real-time efficiency calculations
- Issue categorization and analysis
- Safety concern tracking
- Predictive maintenance recommendations
- Shift performance comparisons
- Operator performance analysis
- Quality control metrics
- Downtime root cause analysis

## New Issue Categories You Track:
- Die/Tooling Issues
- Material Feed Problems
- Hydraulic/Pressure Issues
- Quality/Defect Issues
- Electrical/Sensor Problems
- Setup/Changeover
- Maintenance Required
- Machine Overload
- Component Failure

## When Responding:
1. Always provide specific numbers and percentages
2. Include relevant report links when applicable
3. Highlight urgent issues (safety concerns, critical severity)
4. Suggest actionable next steps
5. Reference specific pages/reports user can visit

## Available Reports/Pages:
- /dashboard - Main production dashboard
- /reports - All reports overview
- /reports/daily - Daily production report
- /reports/weekly - Weekly analysis
- /reports/machine-performance - Machine efficiency details
- /reports/shift-analysis - Shift comparisons
- /reports/comments - All operator comments with AI categorization
- /reports/insights - AI-generated insights and predictions
- /entry - Production data entry form
- /machines - Machine management
- /operators - Operator management

Always format responses clearly and include relevant links to reports or pages where users can get more detailed information.`

// Helper function to generate report links
function generateReportLink(type: string, params?: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  switch(type) {
    case 'machine':
      return `${baseUrl}/reports/machine-performance${params?.machine_id ? `?machine=${params.machine_id}` : ''}`
    case 'shift':
      return `${baseUrl}/reports/shift-analysis${params?.shift ? `?shift=${params.shift}` : ''}`
    case 'comments':
      return `${baseUrl}/reports/comments${params?.category ? `?category=${params.category}` : ''}`
    case 'daily':
      return `${baseUrl}/reports/daily${params?.date ? `?date=${params.date}` : ''}`
    case 'weekly':
      return `${baseUrl}/reports/weekly`
    case 'insights':
      return `${baseUrl}/reports/insights`
    case 'entry':
      return `${baseUrl}/entry`
    default:
      return `${baseUrl}/reports`
  }
}

// Enhanced natural language understanding
function parseUserIntent(message: string) {
  const lower = message.toLowerCase()
  
  const intents = {
    currentEfficiency: /current|now|today|latest|real.?time/i.test(message) && /efficiency|performance/i.test(message),
    machineStatus: /machine|600|1500|1400|1000|hyd/i.test(message) && /status|how|performance/i.test(message),
    shiftComparison: /shift|first|second|third/i.test(message) && /compar|best|worst|analys/i.test(message),
    comments: /comment|note|issue|problem|concern/i.test(message),
    safety: /safety|hazard|danger|risk|accident/i.test(message),
    downtime: /down|stop|idle|maintenance|broken/i.test(message),
    quality: /scrap|defect|quality|reject|bad part/i.test(message),
    operators: /operator|employee|worker|staff/i.test(message),
    trends: /trend|pattern|history|compare|week|month/i.test(message),
    insights: /insight|predict|recommend|suggest|ai|anomaly/i.test(message),
    issues: /issue|problem|fix|trouble|error/i.test(message),
    followUp: /follow.?up|pending|need.?attention|critical/i.test(message),
    targets: /target|goal|meeting|achieve|quota/i.test(message),
    bestShift: /best|top|highest.*shift|shift.*best|which shift/i.test(message)
  }
  
  return intents
}

// Function to provide intelligent fallback responses without OpenAI
async function generateFallbackResponse(message: string, intent: any) {
  let response = ""
  const relevantLinks: string[] = []
  
  try {
    // Query database based on intent
    if (intent.targets || intent.currentEfficiency || intent.machineStatus) {
      // Get recent production data
      const { data: productionData } = await supabase
        .from('production_data')
        .select(`
          *,
          machines!inner(machine_number, machine_name),
          shifts!inner(shift_name)
        `)
        .order('date', { ascending: false })
        .limit(30)
      
      if (productionData && productionData.length > 0) {
        // Calculate average efficiency by machine
        const machineStats: Record<string, { total: number, count: number, downtime: number }> = {}
        
        productionData.forEach((record: any) => {
          const machine = record.machines.machine_number
          if (!machineStats[machine]) {
            machineStats[machine] = { total: 0, count: 0, downtime: 0 }
          }
          machineStats[machine].total += record.actual_efficiency || 0
          machineStats[machine].count++
          machineStats[machine].downtime += record.downtime_minutes || 0
        })
        
        response = "📊 **Current Production Status:**\n\n"
        
        // Machine targets
        const targets: Record<string, number> = {
          '600': 950,
          '1500-1': 600,
          '1500-2': 600,
          '1400': 600,
          '1000': 875,
          'Hyd': 600
        }
        
        Object.entries(machineStats).forEach(([machine, stats]) => {
          const avgEfficiency = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : '0'
          const target = targets[machine] || 600
          const status = parseFloat(avgEfficiency) >= 90 ? '✅' : parseFloat(avgEfficiency) >= 80 ? '⚠️' : '❌'
          
          response += `${status} **${machine}**: ${avgEfficiency}% efficiency (Target based on ${target} hits/hr)\n`
          response += `   Downtime: ${stats.downtime} minutes total\n\n`
        })
        
        // Check if meeting targets
        const avgOverall = Object.values(machineStats).reduce((sum, s) => sum + (s.total / s.count), 0) / Object.keys(machineStats).length
        
        if (intent.targets) {
          response += avgOverall >= 90 
            ? "✅ **Overall: Meeting production targets** (Average efficiency: " + avgOverall.toFixed(1) + "%)\n"
            : "⚠️ **Overall: Below production targets** (Average efficiency: " + avgOverall.toFixed(1) + "%)\n"
        }
      }
      
      relevantLinks.push(generateReportLink('machine'))
      relevantLinks.push(generateReportLink('daily'))
    }
    
    if (intent.bestShift || intent.shiftComparison) {
      // Get shift performance data
      const { data: shiftData } = await supabase
        .from('production_data')
        .select(`
          shift_id,
          shifts!inner(shift_name),
          actual_efficiency,
          downtime_minutes,
          good_parts,
          scrap_parts
        `)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      
      if (shiftData && shiftData.length > 0) {
        const shiftStats: Record<string, any> = {}
        
        shiftData.forEach((record: any) => {
          const shiftName = record.shifts.shift_name
          if (!shiftStats[shiftName]) {
            shiftStats[shiftName] = {
              totalEfficiency: 0,
              count: 0,
              totalDowntime: 0,
              totalGoodParts: 0,
              totalScrapParts: 0
            }
          }
          
          shiftStats[shiftName].totalEfficiency += record.actual_efficiency || 0
          shiftStats[shiftName].count++
          shiftStats[shiftName].totalDowntime += record.downtime_minutes || 0
          shiftStats[shiftName].totalGoodParts += record.good_parts || 0
          shiftStats[shiftName].totalScrapParts += record.scrap_parts || 0
        })
        
        // Find best performing shift
        let bestShift = { name: '', efficiency: 0 }
        
        response += "\n📈 **Shift Performance (Last 7 Days):**\n\n"
        
        Object.entries(shiftStats).forEach(([shift, stats]) => {
          const avgEfficiency = stats.count > 0 ? stats.totalEfficiency / stats.count : 0
          const scrapRate = stats.totalGoodParts > 0 
            ? (stats.totalScrapParts / (stats.totalGoodParts + stats.totalScrapParts)) * 100
            : 0
          
          if (avgEfficiency > bestShift.efficiency) {
            bestShift = { name: shift, efficiency: avgEfficiency }
          }
          
          response += `**${shift} Shift:**\n`
          response += `• Efficiency: ${avgEfficiency.toFixed(1)}%\n`
          response += `• Downtime: ${stats.totalDowntime} minutes\n`
          response += `• Scrap Rate: ${scrapRate.toFixed(1)}%\n\n`
        })
        
        if (intent.bestShift) {
          response += `🏆 **Best Performing Shift: ${bestShift.name}** (${bestShift.efficiency.toFixed(1)}% efficiency)\n`
        }
      }
      
      relevantLinks.push(generateReportLink('shift'))
    }
    
    if (intent.safety || intent.followUp) {
      // Check for safety concerns and follow-up items
      const { data: issues } = await supabase
        .from('production_data')
        .select('*')
        .or('safety_concern.eq.true,follow_up_required.eq.true')
        .order('date', { ascending: false })
        .limit(10)
      
      if (issues && issues.length > 0) {
        const safetyCount = issues.filter(i => i.safety_concern).length
        const followUpCount = issues.filter(i => i.follow_up_required).length
        
        if (safetyCount > 0) {
          response += `\n🚨 **SAFETY ALERT:** ${safetyCount} safety concern(s) require immediate attention!\n`
        }
        if (followUpCount > 0) {
          response += `📋 **FOLLOW-UP:** ${followUpCount} issue(s) need follow-up action.\n`
        }
      }
      
      relevantLinks.push(generateReportLink('comments', { category: 'safety' }))
    }
    
    if (intent.comments || intent.issues) {
      response += "\n💬 **Recent Issues & Comments:**\n"
      response += "View the Comments Report to see all categorized operator feedback and issues.\n"
      relevantLinks.push(generateReportLink('comments'))
    }
    
  } catch (error) {
    console.error('Error querying database:', error)
  }
  
  // If no specific response was generated, provide general guidance
  if (!response) {
    response = "I can help you analyze production data. Here's what I can do:\n\n"
    response += "• Check if you're meeting production targets\n"
    response += "• Compare shift performance\n"
    response += "• Review safety concerns and issues\n"
    response += "• Analyze machine efficiency\n"
    response += "• Track downtime and quality metrics\n"
  }
  
  // Always add relevant links
  if (relevantLinks.length > 0) {
    response += "\n\n📊 **View Detailed Reports:**\n"
    relevantLinks.forEach(link => {
      if (link.includes('machine-performance')) {
        response += `• [Machine Performance Report](${link})\n`
      } else if (link.includes('shift-analysis')) {
        response += `• [Shift Analysis Report](${link})\n`
      } else if (link.includes('comments')) {
        response += `• [Comments & Issues Report](${link})\n`
      } else if (link.includes('daily')) {
        response += `• [Daily Production Report](${link})\n`
      } else if (link.includes('weekly')) {
        response += `• [Weekly Analysis](${link})\n`
      }
    })
  }
  
  return { response, links: relevantLinks }
}

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()
    
    // Parse user intent
    const intent = parseUserIntent(message)
    
    // If no OpenAI, use intelligent fallback
    if (!openai) {
      const { response: fallbackResponse, links } = await generateFallbackResponse(message, intent)
      
      return NextResponse.json({
        message: fallbackResponse,
        links
      })
    }
    
    // Determine what data to fetch based on intent
    let contextData: any = {}
    let dataContext = ""
    let relevantLinks: string[] = []
    
    // Fetch production data if needed
    if (intent.currentEfficiency || intent.machineStatus || intent.targets) {
      const { data: productionData } = await supabase
        .from('production_data')
        .select(`
          *,
          machines!inner(machine_number, machine_name),
          shifts!inner(shift_name),
          operators!inner(name),
          parts!inner(part_number)
        `)
        .order('date', { ascending: false })
        .limit(50)
      
      if (productionData && productionData.length > 0) {
        // Calculate machine efficiencies
        const machineEfficiencies: Record<string, any> = {}
        
        productionData.forEach((record: any) => {
          const machineName = record.machines.machine_number
          if (!machineEfficiencies[machineName]) {
            machineEfficiencies[machineName] = {
              totalEfficiency: 0,
              count: 0,
              lastDate: record.date,
              downtime: 0,
              issues: []
            }
          }
          
          machineEfficiencies[machineName].totalEfficiency += record.actual_efficiency || 0
          machineEfficiencies[machineName].count++
          machineEfficiencies[machineName].downtime += record.downtime_minutes || 0
          
          if (record.issue_category) {
            machineEfficiencies[machineName].issues.push({
              category: record.issue_category,
              severity: record.severity_level,
              date: record.date
            })
          }
        })
        
        contextData.machineEfficiencies = machineEfficiencies
        relevantLinks.push(generateReportLink('machine'))
      }
    }
    
    // Fetch comments if needed
    if (intent.comments || intent.issues) {
      const { data: comments } = await supabase
        .from('production_data')
        .select('operator_comments, supervisor_comments, issue_category, severity_level, safety_concern, follow_up_required, date, machine_id')
        .or('operator_comments.not.is.null,supervisor_comments.not.is.null,issue_category.not.is.null')
        .order('date', { ascending: false })
        .limit(20)
      
      if (comments && comments.length > 0) {
        contextData.recentComments = comments
        relevantLinks.push(generateReportLink('comments'))
        
        // Count issue categories
        const issueCounts: Record<string, number> = {}
        let safetyCount = 0
        let followUpCount = 0
        
        comments.forEach((c: any) => {
          if (c.issue_category) {
            issueCounts[c.issue_category] = (issueCounts[c.issue_category] || 0) + 1
          }
          if (c.safety_concern) safetyCount++
          if (c.follow_up_required) followUpCount++
        })
        
        contextData.issueSummary = {
          categories: issueCounts,
          safetyIssues: safetyCount,
          needsFollowUp: followUpCount
        }
      }
    }
    
    // Fetch shift data if needed
    if (intent.shiftComparison || intent.bestShift) {
      const { data: shiftData } = await supabase
        .from('production_data')
        .select(`
          shift_id,
          shifts!inner(shift_name),
          actual_efficiency,
          downtime_minutes,
          good_parts,
          scrap_parts
        `)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      
      if (shiftData) {
        const shiftStats: Record<string, any> = {}
        
        shiftData.forEach((record: any) => {
          const shiftName = record.shifts.shift_name
          if (!shiftStats[shiftName]) {
            shiftStats[shiftName] = {
              totalEfficiency: 0,
              count: 0,
              totalDowntime: 0,
              totalGoodParts: 0,
              totalScrapParts: 0
            }
          }
          
          shiftStats[shiftName].totalEfficiency += record.actual_efficiency || 0
          shiftStats[shiftName].count++
          shiftStats[shiftName].totalDowntime += record.downtime_minutes || 0
          shiftStats[shiftName].totalGoodParts += record.good_parts || 0
          shiftStats[shiftName].totalScrapParts += record.scrap_parts || 0
        })
        
        // Calculate averages
        Object.keys(shiftStats).forEach(shift => {
          const stats = shiftStats[shift]
          stats.avgEfficiency = stats.count > 0 ? (stats.totalEfficiency / stats.count).toFixed(1) : 0
          stats.scrapRate = stats.totalGoodParts > 0 
            ? ((stats.totalScrapParts / (stats.totalGoodParts + stats.totalScrapParts)) * 100).toFixed(1) 
            : 0
        })
        
        contextData.shiftStats = shiftStats
        relevantLinks.push(generateReportLink('shift'))
      }
    }
    
    // Fetch AI insights if needed
    if (intent.insights || intent.trends) {
      const { data: insights } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (insights) {
        contextData.aiInsights = insights
        relevantLinks.push(generateReportLink('insights'))
      }
    }
    
    // Check for pending issues if needed
    if (intent.followUp || intent.safety) {
      const { data: pendingIssues } = await supabase
        .from('production_issues_pending')
        .select('*')
        .limit(10)
      
      if (pendingIssues) {
        contextData.pendingIssues = pendingIssues
        relevantLinks.push(generateReportLink('comments', { category: 'pending' }))
      }
    }
    
    // Build context string for AI
    if (Object.keys(contextData).length > 0) {
      dataContext = "\n\n## Current Production Data:\n"
      
      if (contextData.machineEfficiencies) {
        dataContext += "\n### Machine Performance:\n"
        Object.entries(contextData.machineEfficiencies).forEach(([machine, stats]: [string, any]) => {
          const avgEfficiency = stats.count > 0 ? (stats.totalEfficiency / stats.count).toFixed(1) : 0
          dataContext += `- ${machine}: ${avgEfficiency}% avg efficiency, ${stats.downtime} min downtime\n`
          if (stats.issues.length > 0) {
            dataContext += `  Issues: ${stats.issues.map((i: any) => `${i.category} (${i.severity})`).join(', ')}\n`
          }
        })
      }
      
      if (contextData.shiftStats) {
        dataContext += "\n### Shift Performance (Last 7 Days):\n"
        Object.entries(contextData.shiftStats).forEach(([shift, stats]: [string, any]) => {
          dataContext += `- ${shift} Shift: ${stats.avgEfficiency}% efficiency, ${stats.scrapRate}% scrap rate, ${stats.totalDowntime} min downtime\n`
        })
      }
      
      if (contextData.issueSummary) {
        dataContext += "\n### Recent Issues:\n"
        Object.entries(contextData.issueSummary.categories).forEach(([category, count]) => {
          dataContext += `- ${category}: ${count} occurrences\n`
        })
        if (contextData.issueSummary.safetyIssues > 0) {
          dataContext += `⚠️ SAFETY ALERTS: ${contextData.issueSummary.safetyIssues} safety concerns reported\n`
        }
        if (contextData.issueSummary.needsFollowUp > 0) {
          dataContext += `📋 FOLLOW-UP NEEDED: ${contextData.issueSummary.needsFollowUp} issues require follow-up\n`
        }
      }
      
      if (contextData.pendingIssues && contextData.pendingIssues.length > 0) {
        dataContext += `\n### ⚠️ Critical Issues Requiring Attention:\n`
        contextData.pendingIssues.forEach((issue: any) => {
          dataContext += `- ${issue.machine_number} (${issue.date}): ${issue.issue_category} - ${issue.severity_level}\n`
        })
      }
      
      if (contextData.aiInsights && contextData.aiInsights.length > 0) {
        dataContext += "\n### Recent AI Insights:\n"
        contextData.aiInsights.forEach((insight: any) => {
          dataContext += `- ${insight.title}: ${insight.description}\n`
          if (insight.recommendation) {
            dataContext += `  Recommendation: ${insight.recommendation}\n`
          }
        })
      }
    }
    
    // Prepare messages for OpenAI
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + dataContext },
      ...history.slice(-10).map((h: any) => ({ 
        role: h.role as 'user' | 'assistant', 
        content: h.content 
      })),
      { role: 'user' as const, content: message }
    ]
    
    // Get AI response - using GPT-5 with PhD-level reasoning!
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-2025-08-07', // GPT-5 released August 2025!
      messages,
      temperature: 0.7,
      max_completion_tokens: 1000 // GPT-5 uses max_completion_tokens
    })
    
    let aiResponse = completion.choices[0].message.content || ""
    
    // Add relevant links to the response
    if (relevantLinks.length > 0) {
      aiResponse += "\n\n📊 **Relevant Reports:**\n"
      relevantLinks.forEach(link => {
        if (link.includes('machine-performance')) {
          aiResponse += `• [View Machine Performance Report](${link})\n`
        } else if (link.includes('shift-analysis')) {
          aiResponse += `• [View Shift Analysis](${link})\n`
        } else if (link.includes('comments')) {
          aiResponse += `• [View Comments & Issues](${link})\n`
        } else if (link.includes('insights')) {
          aiResponse += `• [View AI Insights](${link})\n`
        } else if (link.includes('daily')) {
          aiResponse += `• [View Daily Report](${link})\n`
        } else if (link.includes('weekly')) {
          aiResponse += `• [View Weekly Report](${link})\n`
        }
      })
    }
    
    // Add contextual suggestions based on the response
    if (intent.safety && contextData.issueSummary?.safetyIssues > 0) {
      aiResponse += `\n\n🚨 **URGENT**: ${contextData.issueSummary.safetyIssues} safety concern(s) require immediate attention. [View Safety Issues](/reports/comments?safety=true)`
    }
    
    if (intent.followUp && contextData.issueSummary?.needsFollowUp > 0) {
      aiResponse += `\n\n📋 **ACTION REQUIRED**: ${contextData.issueSummary.needsFollowUp} issue(s) need follow-up. [View Pending Items](/reports/comments?follow_up=true)`
    }
    
    return NextResponse.json({
      message: aiResponse,
      data: contextData,
      links: relevantLinks
    })
    
  } catch (error) {
    console.error('Chatbot error:', error)
    
    return NextResponse.json({
      message: `I can help you with production questions. Try asking:
      
• "Are we meeting production targets?"
• "Which shift is performing best?"
• "Show me recent safety concerns"
• "What issues need follow-up?"
• "Analyze die tooling problems"
• "Compare this week's performance to last week"
• "What machines are below target?"
• "Show operator comments from today"

You can also visit these reports directly:
• [Daily Report](/reports/daily)
• [Weekly Report](/reports/weekly)
• [Machine Performance](/reports/machine-performance)
• [Shift Analysis](/reports/shift-analysis)
• [Comments & Issues](/reports/comments)
• [AI Insights](/reports/insights)`,
      links: [
        generateReportLink('daily'),
        generateReportLink('weekly'),
        generateReportLink('machine'),
        generateReportLink('shift'),
        generateReportLink('comments'),
        generateReportLink('insights')
      ]
    })
  }
}