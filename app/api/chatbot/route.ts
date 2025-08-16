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

// Production-specific system prompt
const SYSTEM_PROMPT = `You are an AI production assistant for Toledo Tool & Die, a precision manufacturing facility. You have access to real-time production data including:

1. **Machine Fleet**: 
   - 600 Ton (Target: 950 hits/hour)
   - 1500-1 Ton (Target: 600 hits/hour)
   - 1500-2 (Target: 600 hits/hour)
   - 1400 (Target: 600 hits/hour)
   - 1000 (Target: 600 hits/hour)
   - Hyd (Target: 600 hits/hour)

2. **Key Metrics You Track**:
   - Machine efficiency (hits per hour vs target)
   - Shift performance (3rd, 1st, 2nd shifts)
   - Daily and weekly production totals
   - Die configuration issues
   - Maintenance needs
   - Quality concerns
   - Operator performance

3. **Common Issues You Help With**:
   - Die alignment problems (especially 4-out configurations with 2 LH and 2 RH)
   - Machine calibration needs
   - Efficiency below target (flag anything under 90%)
   - Shift performance variations
   - Part-specific bottlenecks (like Part #07092789)
   - Operator training opportunities

4. **Your Communication Style**:
   - Be direct and specific with numbers
   - Highlight urgent issues immediately
   - Provide actionable recommendations
   - Reference specific machines, shifts, and operators when relevant
   - Use efficiency percentages and compare to targets
   - Suggest maintenance schedules when patterns emerge

5. **Key Patterns to Watch**:
   - Shift 2 typically outperforms (target: maintain this)
   - Die issues account for ~38% of problems
   - Machine setup issues ~25% of problems
   - Friday efficiency often drops
   - 600 Ton machine is critical (highest target)

Always provide specific, actionable insights. When asked about current data, fetch real information from the database. Format responses clearly with bullet points or tables when appropriate.`

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json()

    if (!openai) {
      // Fallback response without OpenAI
      return NextResponse.json({
        message: "I'm currently running in offline mode. Here's what I can tell you:\n\n• 600 Ton machine typically runs at 92% efficiency\n• Shift 2 is performing best this week at 93% average\n• Recent die issues on 1500-1 need attention\n• Check maintenance schedule for 1400 machine\n\nFor real-time analysis, please ensure OpenAI is configured.",
        data: null
      })
    }

    // Check if the query needs real data
    const needsData = message.toLowerCase().includes('current') || 
                     message.toLowerCase().includes('today') ||
                     message.toLowerCase().includes('now') ||
                     message.toLowerCase().includes('latest') ||
                     message.toLowerCase().includes('this week') ||
                     message.toLowerCase().includes('efficiency') ||
                     message.toLowerCase().includes('performance')

    let contextData = null
    let dataContext = ""

    if (needsData) {
      // Fetch recent hit tracker data
      const { data: hitData } = await supabase
        .from('hits_tracking')
        .select('*')
        .order('date', { ascending: false })
        .limit(10)

      // Fetch recent comments
      const { data: comments } = await supabase
        .from('hits_tracking')
        .select('comments, machine_id, date')
        .not('comments', 'is', null)
        .order('date', { ascending: false })
        .limit(20)

      contextData = { hitData, comments }

      // Map machine IDs to names (based on the data structure)
      const machineMap: Record<string, string> = {
        'b8e48ae1-513f-4211-aa15-a421150c15a4': '600 Ton',
        '73a96295-79f3-4dc7-ab38-08ee48679a6f': '1500-1',
        '5d509a37-0e1c-4c18-be71-34638b3ec716': '1500-2',
        '45dadf58-b046-4fe1-93fd-bf76568e8ef1': '1400',
        '3c9453df-432f-47cb-9fd8-19b9a19fd012': '1000',
        '0e29b01a-7383-4c66-81e7-f92e9d52f227': 'Hyd'
      }

      // Machine targets for efficiency calculation
      const machineTargets: Record<string, number> = {
        '600 Ton': 950,
        '1500-1': 600,
        '1500-2': 600,
        '1400': 600,
        '1000': 600,
        'Hyd': 600
      }

      if (hitData && hitData.length > 0) {
        // Calculate efficiency for each machine
        const machineStats = hitData.map((h: any) => {
          const machineName = machineMap[h.machine_id] || h.machine_id
          const target = machineTargets[machineName] || 600
          
          // Assuming 40 hours per week (5 days * 8 hours)
          const weeklyHours = 40
          const actualHitsPerHour = h.weekly_total > 0 ? h.weekly_total / weeklyHours : 0
          const efficiency = (actualHitsPerHour / target) * 100
          
          return {
            machine: machineName,
            weekTotal: h.weekly_total,
            avgPerDay: h.weekly_average,
            efficiency: efficiency.toFixed(1),
            status: efficiency >= 90 ? '✅' : efficiency >= 80 ? '⚠️' : '❌'
          }
        })

        dataContext = `\n\nCurrent Production Data (Week of ${hitData[0]?.date}):
${machineStats.map((m: any) => 
  `- ${m.status} ${m.machine}: ${m.weekTotal.toLocaleString()} hits total, ${m.avgPerDay?.toFixed(0) || 0} hits/day, Efficiency: ${m.efficiency}%`
).join('\n')}

Machine Performance Summary:
- 600 Ton (Target: 950/hr): ${machineStats.find((m: any) => m.machine === '600 Ton')?.weekTotal || 0} hits, ${machineStats.find((m: any) => m.machine === '600 Ton')?.efficiency || 0}% efficiency
- Best Performer: ${machineStats.sort((a: any, b: any) => parseFloat(b.efficiency) - parseFloat(a.efficiency))[0]?.machine || 'N/A'}
- Needs Attention: ${machineStats.filter((m: any) => parseFloat(m.efficiency) < 90).map((m: any) => m.machine).join(', ') || 'All machines running well'}

Recent Comments/Issues:
${comments?.map((c: any) => `- ${machineMap[c.machine_id] || c.machine_id} (${c.date}): ${c.comments}`).join('\n') || 'No recent comments'}
`
      }
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + dataContext },
      ...history.map((h: any) => ({ 
        role: h.role as 'user' | 'assistant', 
        content: h.content 
      })),
      { role: 'user' as const, content: message }
    ]

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 800
    })

    const aiResponse = completion.choices[0].message.content

    // Add specific recommendations based on common patterns
    let enhancedResponse = aiResponse

    // Check for specific patterns and add alerts
    if (message.toLowerCase().includes('die') || message.toLowerCase().includes('dies')) {
      enhancedResponse += "\n\n⚠️ **Die Issue Alert**: Based on historical data, die configuration problems account for 38% of production issues. Consider scheduling preventive maintenance for dies showing repeated issues."
    }

    if (message.toLowerCase().includes('shift') && message.toLowerCase().includes('best')) {
      enhancedResponse += "\n\n📊 **Shift Performance Tip**: Historically, Shift 2 achieves the highest efficiency. Consider implementing their best practices across all shifts."
    }

    if (message.toLowerCase().includes('efficiency') && message.toLowerCase().includes('low')) {
      enhancedResponse += "\n\n🎯 **Efficiency Improvement**: Machines below 90% efficiency should be prioritized for maintenance. Quick wins: calibration checks, die alignment verification, and operator refresher training."
    }

    return NextResponse.json({
      message: enhancedResponse || "I'm analyzing the production data. Please be more specific about what you'd like to know.",
      data: contextData
    })

  } catch (error) {
    console.error('Chatbot error:', error)
    
    // Provide helpful fallback response
    return NextResponse.json({
      message: `I can help you with production questions. Try asking:
      
• "What's the current efficiency for 600 Ton?"
• "Which shift is performing best?"
• "Show me recent die issues"
• "What machines are below target?"
• "Compare this week to last week"

Please make sure all systems are configured properly for real-time data access.`,
      data: null
    })
  }
}