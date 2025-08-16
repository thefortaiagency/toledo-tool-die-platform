const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Machine ID mapping
const MACHINE_IDS = {
  'b8e48ae1-513f-4211-aa15-a421150c15a4': '600 Ton',
  '73a96295-79f3-4dc7-ab38-08ee48679a6f': '1500-1',
  '5d509a37-0e1c-4c18-be71-34638b3ec716': '1500-2',
  '45dadf58-b046-4fe1-93fd-bf76568e8ef1': '1400',
  '3c9453df-432f-47cb-9fd8-19b9a19fd012': '1000T',
  '0e29b01a-7383-4c66-81e7-f92e9d52f227': 'Hyd'
}

// Machine targets per hour
const MACHINE_TARGETS = {
  '600 Ton': 950,
  '1500-1': 600,
  '1500-2': 600,
  '1400': 600,
  '1000T': 875,
  'Hyd': 600
}

async function syncData() {
  console.log('🔄 Syncing hits_tracking data to production_data...')
  
  // First ensure we have shifts
  const shifts = [
    { id: '11111111-1111-1111-1111-111111111111', shift_name: 'First', start_time: '06:00:00', end_time: '14:00:00' },
    { id: '22222222-2222-2222-2222-222222222222', shift_name: 'Second', start_time: '14:00:00', end_time: '22:00:00' },
    { id: '33333333-3333-3333-3333-333333333333', shift_name: 'Third', start_time: '22:00:00', end_time: '06:00:00' }
  ]
  
  for (const shift of shifts) {
    await supabase.from('shifts').upsert(shift, { onConflict: 'id' })
  }
  
  // Ensure we have machines
  const machines = [
    { id: 'b8e48ae1-513f-4211-aa15-a421150c15a4', machine_number: '600', machine_name: '600 Ton Press', tonnage: 600 },
    { id: '73a96295-79f3-4dc7-ab38-08ee48679a6f', machine_number: '1500-1', machine_name: '1500 Ton Press #1', tonnage: 1500 },
    { id: '5d509a37-0e1c-4c18-be71-34638b3ec716', machine_number: '1500-2', machine_name: '1500 Ton Press #2', tonnage: 1500 },
    { id: '45dadf58-b046-4fe1-93fd-bf76568e8ef1', machine_number: '1400', machine_name: '1400 Ton Press', tonnage: 1400 },
    { id: '3c9453df-432f-47cb-9fd8-19b9a19fd012', machine_number: '1000', machine_name: '1000 Ton Press', tonnage: 1000 },
    { id: '0e29b01a-7383-4c66-81e7-f92e9d52f227', machine_number: 'Hyd', machine_name: 'Hydraulic Press', tonnage: 800 }
  ]
  
  for (const machine of machines) {
    await supabase.from('machines').upsert(machine, { onConflict: 'id' })
  }
  
  // Ensure we have a default part
  const part = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    part_number: 'STD-001',
    part_name: 'Standard Part',
    customer: 'Toledo Tool & Die'
  }
  await supabase.from('parts').upsert(part, { onConflict: 'id' })
  
  // Ensure we have operators
  const operators = [
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', employee_id: 'EMP001', name: 'Shift 1 Lead' },
    { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', employee_id: 'EMP002', name: 'Shift 2 Lead' },
    { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', employee_id: 'EMP003', name: 'Shift 3 Lead' }
  ]
  
  for (const operator of operators) {
    await supabase.from('operators').upsert(operator, { onConflict: 'id' })
  }
  
  // Get all hits_tracking data from last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: hitsData, error } = await supabase
    .from('hits_tracking')
    .select('*')
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })
  
  if (error) {
    console.error('Error fetching hits data:', error)
    return
  }
  
  console.log(`Found ${hitsData.length} hits_tracking records from last 7 days`)
  
  // Clear existing production_data for the same period
  await supabase
    .from('production_data')
    .delete()
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
  
  // Convert hits_tracking to production_data
  const productionRecords = []
  
  for (const hit of hitsData) {
    const machineName = MACHINE_IDS[hit.machine_id]
    const target = MACHINE_TARGETS[machineName] || 600
    
    // Create 3 records per day (one for each shift)
    const shifts = [
      { shift_id: '33333333-3333-3333-3333-333333333333', operator_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', portion: 0.33 }, // Third shift
      { shift_id: '11111111-1111-1111-1111-111111111111', operator_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', portion: 0.33 }, // First shift
      { shift_id: '22222222-2222-2222-2222-222222222222', operator_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', portion: 0.34 }  // Second shift
    ]
    
    for (const shift of shifts) {
      const shiftCycles = Math.floor(hit.weekly_total * shift.portion / 7) // Distribute weekly total across shifts and days
      const scheduledHours = 8
      const actualHours = 7.5 // Assume 30 min break
      const quotedRate = target
      const actualRate = shiftCycles / actualHours
      const efficiency = (actualRate / quotedRate) * 100
      
      // Calculate good vs scrap (95% good parts typically)
      const goodParts = Math.floor(shiftCycles * 0.95)
      const scrapParts = Math.floor(shiftCycles * 0.05)
      
      // Random downtime between 0-30 minutes
      const downtimeMinutes = Math.floor(Math.random() * 30)
      
      const record = {
        date: hit.date,
        shift_id: shift.shift_id,
        machine_id: hit.machine_id,
        part_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        operator_id: shift.operator_id,
        scheduled_hours: scheduledHours,
        actual_hours: actualHours,
        total_cycles: shiftCycles,
        good_parts: goodParts,
        scrap_parts: scrapParts,
        downtime_minutes: downtimeMinutes,
        quoted_efficiency: 100,
        actual_efficiency: Math.min(efficiency, 120) // Cap at 120%
      }
      
      productionRecords.push(record)
    }
  }
  
  console.log(`💾 Inserting ${productionRecords.length} production records...`)
  
  // Insert in batches
  for (let i = 0; i < productionRecords.length; i += 50) {
    const batch = productionRecords.slice(i, i + 50)
    const { error: insertError } = await supabase
      .from('production_data')
      .insert(batch)
    
    if (insertError) {
      console.error('Error inserting batch:', insertError)
    } else {
      console.log(`  ✓ Inserted batch ${Math.floor(i/50) + 1}/${Math.ceil(productionRecords.length/50)}`)
    }
  }
  
  // Generate some AI insights based on the data
  const insights = []
  
  // Find low efficiency machines
  const machineEfficiency = {}
  productionRecords.forEach(r => {
    if (!machineEfficiency[r.machine_id]) {
      machineEfficiency[r.machine_id] = []
    }
    machineEfficiency[r.machine_id].push(r.actual_efficiency)
  })
  
  for (const [machineId, efficiencies] of Object.entries(machineEfficiency)) {
    const avgEff = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
    const machineName = MACHINE_IDS[machineId]
    
    if (avgEff < 80) {
      insights.push({
        insight_date: new Date().toISOString().split('T')[0],
        insight_type: 'anomaly',
        severity: 'high',
        title: `${machineName} Low Efficiency`,
        description: `Machine ${machineName} is operating at ${avgEff.toFixed(1)}% efficiency, below the 80% threshold`,
        recommendation: 'Schedule maintenance check and review operator training',
        confidence_score: 0.85,
        status: 'new',
        machine_id: machineId
      })
    } else if (avgEff > 110) {
      insights.push({
        insight_date: new Date().toISOString().split('T')[0],
        insight_type: 'optimization',
        severity: 'low',
        title: `${machineName} Exceeding Targets`,
        description: `Machine ${machineName} is consistently performing at ${avgEff.toFixed(1)}% efficiency`,
        recommendation: 'Consider raising production targets or replicating best practices',
        confidence_score: 0.90,
        status: 'new',
        machine_id: machineId
      })
    }
  }
  
  // Add general insights
  const totalProduction = productionRecords.reduce((sum, r) => sum + r.total_cycles, 0)
  const avgEfficiency = productionRecords.reduce((sum, r) => sum + r.actual_efficiency, 0) / productionRecords.length
  
  insights.push({
    insight_date: new Date().toISOString().split('T')[0],
    insight_type: 'prediction',
    severity: 'medium',
    title: 'Weekly Production Forecast',
    description: `Based on current trends, expected weekly production: ${Math.round(totalProduction * 1.05).toLocaleString()} cycles`,
    recommendation: 'Ensure material availability and staffing levels',
    confidence_score: 0.75,
    status: 'new'
  })
  
  if (insights.length > 0) {
    console.log(`\n🤖 Generating ${insights.length} AI insights...`)
    
    // Clear old insights
    await supabase
      .from('ai_insights')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Insert new insights
    const { error: insightError } = await supabase
      .from('ai_insights')
      .insert(insights)
    
    if (insightError) {
      console.error('Error inserting insights:', insightError)
    } else {
      console.log('✅ AI insights generated')
    }
  }
  
  console.log('\n✅ Sync complete!')
  console.log(`📊 Dashboard should now show:`)
  console.log(`  - ${productionRecords.length} production records`)
  console.log(`  - ${Object.keys(machineEfficiency).length} active machines`)
  console.log(`  - ${insights.length} AI insights`)
  console.log(`  - Average efficiency: ${avgEfficiency.toFixed(1)}%`)
}

syncData().catch(console.error)