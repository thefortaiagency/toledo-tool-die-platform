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

const REPORT_GENERATION_PROMPT = `You are an AI report generator for Toledo Tool & Die. 
You create dynamic, interactive dashboards from natural language requests.

CRITICAL CONTEXT: Toledo Tool & Die has discovered that 93.8% of their reported $551.9M in "inventory adjustments" 
are actually paired container transfers (parts moving between operations) that net to zero. 
The TRUE inventory impact is only $34.4M. Key real issues are:
- Mass Updates: $540K
- Cycle Count errors: $205K  
- Production Adjustments: $152K
Container transfers between Safe Launch and Dock Audit are NOT real adjustments.

Given a user request, you must:
1. Determine what data to fetch
2. Create appropriate visualizations
3. Generate insights and recommendations
4. ALWAYS distinguish between reported vs TRUE impact when discussing inventory

You must return a JSON object with this EXACT structure:
{
  "title": "Report Title",
  "description": "Brief description of what this report shows",
  "timestamp": "Current timestamp",
  "components": [
    {
      "type": "bar|line|pie|area|metric|table",
      "title": "Component Title",
      "data": [array of data objects],
      "config": {
        "xKey": "field name for x-axis",
        "bars": [{"key": "dataKey", "name": "Display Name"}] // for bar charts
        "lines": [{"key": "dataKey", "name": "Display Name"}] // for line charts
        "areas": [{"key": "dataKey", "name": "Display Name"}] // for area charts
        "columns": [{"key": "dataKey", "name": "Display Name"}] // for tables
      }
    }
  ],
  "insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

IMPORTANT: 
- Generate realistic, varied data based on the context
- Use appropriate chart types for the data
- Create 3-6 components per report
- Provide actionable insights and recommendations`

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    
    if (!openai) {
      return NextResponse.json({
        error: true,
        message: 'AI service not configured'
      })
    }
    
    // Fetch relevant data based on the prompt
    let contextData = ''
    
    // Check for manning/attendance keywords
    if (/manning|attendance|operator|employee|staff|coverage|absent|present|overtime/i.test(prompt)) {
      // Fetch manning data (simulated from production data for now)
      const { data: productionData } = await supabase
        .from('production_data')
        .select(`
          *,
          machines!inner(machine_number, machine_name),
          shifts!inner(shift_name),
          operators!inner(name)
        `)
        .order('date', { ascending: false })
        .limit(100)
      
      if (productionData && productionData.length > 0) {
        // Calculate manning statistics by shift
        const manningByShift: any = {}
        const operatorsByShift: any = {}
        
        productionData.forEach((record: any) => {
          const shift = record.shifts.shift_name
          const operator = record.operators?.name || 'Unknown'
          
          if (!manningByShift[shift]) {
            manningByShift[shift] = {
              totalRecords: 0,
              uniqueOperators: new Set(),
              machinesActive: new Set(),
              totalHours: 0,
              overtimeHours: 0
            }
          }
          
          manningByShift[shift].totalRecords++
          manningByShift[shift].uniqueOperators.add(operator)
          manningByShift[shift].machinesActive.add(record.machines.machine_number)
          manningByShift[shift].totalHours += record.run_time_hours || 0
          
          // Track operators
          if (!operatorsByShift[shift]) {
            operatorsByShift[shift] = {}
          }
          if (!operatorsByShift[shift][operator]) {
            operatorsByShift[shift][operator] = {
              machines: new Set(),
              totalHours: 0,
              efficiency: []
            }
          }
          operatorsByShift[shift][operator].machines.add(record.machines.machine_number)
          operatorsByShift[shift][operator].totalHours += record.run_time_hours || 0
          if (record.actual_efficiency) {
            operatorsByShift[shift][operator].efficiency.push(record.actual_efficiency)
          }
        })
        
        contextData += `\nManning & Attendance Statistics:\n`
        Object.entries(manningByShift).forEach(([shift, stats]: [string, any]) => {
          const avgMachinesPerOperator = stats.machinesActive.size / stats.uniqueOperators.size
          contextData += `\n${shift}:\n`
          contextData += `- Unique Operators: ${stats.uniqueOperators.size}\n`
          contextData += `- Active Machines: ${stats.machinesActive.size}\n`
          contextData += `- Coverage Ratio: ${avgMachinesPerOperator.toFixed(1)} machines/operator\n`
          contextData += `- Total Production Hours: ${stats.totalHours.toFixed(1)}\n`
          
          // List top operators
          const shiftOperators = operatorsByShift[shift]
          if (shiftOperators) {
            const topOperators = Object.entries(shiftOperators)
              .sort((a: any, b: any) => b[1].totalHours - a[1].totalHours)
              .slice(0, 3)
            
            contextData += `- Top Operators by Hours:\n`
            topOperators.forEach(([name, data]: [string, any]) => {
              const avgEff = data.efficiency.length > 0 
                ? (data.efficiency.reduce((a: number, b: number) => a + b, 0) / data.efficiency.length).toFixed(1)
                : 'N/A'
              contextData += `  • ${name}: ${data.totalHours.toFixed(1)} hrs, ${data.machines.size} machines, ${avgEff}% efficiency\n`
            })
          }
        })
        
        // Calculate attendance estimates
        const totalUniqueOperators = new Set()
        Object.values(manningByShift).forEach((stats: any) => {
          stats.uniqueOperators.forEach((op: string) => totalUniqueOperators.add(op))
        })
        
        contextData += `\nOverall Manning:\n`
        contextData += `- Total Unique Operators: ${totalUniqueOperators.size}\n`
        contextData += `- Average Machines Running: ${Object.values(manningByShift).reduce((sum: number, s: any) => sum + s.machinesActive.size, 0) / Object.keys(manningByShift).length}\n`
      }
    }
    
    // Determine what data to fetch based on keywords in prompt
    if (/machine|efficiency|performance/i.test(prompt)) {
      const { data: machineData } = await supabase
        .from('production_data')
        .select(`
          *,
          machines!inner(machine_number, machine_name),
          shifts!inner(shift_name)
        `)
        .order('date', { ascending: false })
        .limit(100)
      
      if (machineData && machineData.length > 0) {
        // Aggregate machine data
        const machineStats: any = {}
        machineData.forEach((record: any) => {
          const machine = record.machines.machine_number
          if (!machineStats[machine]) {
            machineStats[machine] = {
              totalEfficiency: 0,
              count: 0,
              downtime: 0,
              goodParts: 0,
              scrapParts: 0
            }
          }
          machineStats[machine].totalEfficiency += record.actual_efficiency || 0
          machineStats[machine].count++
          machineStats[machine].downtime += record.downtime_minutes || 0
          machineStats[machine].goodParts += record.good_parts || 0
          machineStats[machine].scrapParts += record.scrap_parts || 0
        })
        
        contextData += `\nMachine Statistics:\n`
        Object.entries(machineStats).forEach(([machine, stats]: [string, any]) => {
          const avgEfficiency = stats.count > 0 ? (stats.totalEfficiency / stats.count).toFixed(1) : 0
          contextData += `- ${machine}: ${avgEfficiency}% efficiency, ${stats.downtime} min downtime, ${stats.goodParts} good parts, ${stats.scrapParts} scrap\n`
        })
      }
    }
    
    if (/shift/i.test(prompt)) {
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
        const shiftStats: any = {}
        shiftData.forEach((record: any) => {
          const shift = record.shifts.shift_name
          if (!shiftStats[shift]) {
            shiftStats[shift] = {
              totalEfficiency: 0,
              count: 0,
              totalDowntime: 0,
              totalGoodParts: 0,
              totalScrapParts: 0
            }
          }
          shiftStats[shift].totalEfficiency += record.actual_efficiency || 0
          shiftStats[shift].count++
          shiftStats[shift].totalDowntime += record.downtime_minutes || 0
          shiftStats[shift].totalGoodParts += record.good_parts || 0
          shiftStats[shift].totalScrapParts += record.scrap_parts || 0
        })
        
        contextData += `\nShift Statistics (Last 7 Days):\n`
        Object.entries(shiftStats).forEach(([shift, stats]: [string, any]) => {
          const avgEfficiency = stats.count > 0 ? (stats.totalEfficiency / stats.count).toFixed(1) : 0
          contextData += `- ${shift}: ${avgEfficiency}% efficiency, ${stats.totalDowntime} min downtime, ${stats.totalGoodParts} good parts, ${stats.totalScrapParts} scrap\n`
        })
      }
    }
    
    if (/quality|scrap|defect/i.test(prompt)) {
      const { data: qualityData } = await supabase
        .from('production_data')
        .select('good_parts, scrap_parts, actual_efficiency, date')
        .order('date', { ascending: false })
        .limit(50)
      
      if (qualityData) {
        const totalGood = qualityData.reduce((sum, r) => sum + (r.good_parts || 0), 0)
        const totalScrap = qualityData.reduce((sum, r) => sum + (r.scrap_parts || 0), 0)
        const scrapRate = totalGood > 0 ? ((totalScrap / (totalGood + totalScrap)) * 100).toFixed(2) : 0
        
        contextData += `\nQuality Metrics:\n`
        contextData += `- Total Good Parts: ${totalGood}\n`
        contextData += `- Total Scrap Parts: ${totalScrap}\n`
        contextData += `- Overall Scrap Rate: ${scrapRate}%\n`
      }
    }
    
    if (/downtime|maintenance/i.test(prompt)) {
      const { data: downtimeData } = await supabase
        .from('production_data')
        .select(`
          downtime_minutes,
          issue_category,
          machines!inner(machine_number)
        `)
        .gt('downtime_minutes', 0)
        .order('date', { ascending: false })
        .limit(100)
      
      if (downtimeData) {
        const downtimeByCategory: any = {}
        const downtimeByMachine: any = {}
        
        downtimeData.forEach((record: any) => {
          const category = record.issue_category || 'Uncategorized'
          const machine = record.machines.machine_number
          
          downtimeByCategory[category] = (downtimeByCategory[category] || 0) + record.downtime_minutes
          downtimeByMachine[machine] = (downtimeByMachine[machine] || 0) + record.downtime_minutes
        })
        
        contextData += `\nDowntime Analysis:\n`
        contextData += `By Category:\n`
        Object.entries(downtimeByCategory).forEach(([cat, mins]) => {
          contextData += `- ${cat}: ${mins} minutes\n`
        })
        contextData += `By Machine:\n`
        Object.entries(downtimeByMachine).forEach(([machine, mins]) => {
          contextData += `- ${machine}: ${mins} minutes\n`
        })
      }
    }
    
    // Generate the report specification using GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: REPORT_GENERATION_PROMPT + '\n\nAvailable Data:\n' + contextData
        },
        {
          role: 'user',
          content: `Generate a comprehensive report for: "${prompt}"\n\nCreate varied visualizations with realistic Toledo Tool & Die production data. Include bar charts, line charts, metrics, and tables as appropriate.`
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })
    
    const reportSpec = JSON.parse(completion.choices[0].message.content || '{}')
    
    // Add current timestamp
    reportSpec.timestamp = new Date().toLocaleString()
    
    return NextResponse.json({
      report: reportSpec
    })
    
  } catch (error: any) {
    console.error('Report generation error:', error)
    return NextResponse.json({
      error: true,
      message: 'Failed to generate report'
    })
  }
}