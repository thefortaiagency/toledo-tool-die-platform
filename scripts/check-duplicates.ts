import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDuplicates() {
  console.log('🔍 Checking for Duplicate Inventory Adjustments...\n')
  console.log('═══════════════════════════════════════════════\n')
  
  // Check for exact duplicates (same part, date, quantity, cost)
  console.log('1️⃣  Checking for exact duplicates...')
  
  const { data: exactDupes } = await supabase.rpc('execute_sql', {
    query: `
      SELECT 
        adjustment_date,
        part_number,
        adjustment_amount,
        extended_cost,
        adjustment_type,
        COUNT(*) as duplicate_count
      FROM inventory_adjustments
      GROUP BY 
        adjustment_date,
        part_number,
        adjustment_amount,
        extended_cost,
        adjustment_type
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `
  })
  
  if (exactDupes && exactDupes.length > 0) {
    console.log('\n⚠️  Found exact duplicates:')
    console.log('Date       | Part Number | Amount | Cost | Type | Count')
    console.log('-----------|-------------|--------|------|------|-------')
    exactDupes.forEach((dup: any) => {
      console.log(
        `${dup.adjustment_date} | ${dup.part_number.substring(0, 10)} | ${dup.adjustment_amount} | ${dup.extended_cost} | ${dup.adjustment_type} | ${dup.duplicate_count}`
      )
    })
  }
  
  // Check for pairs (increase/decrease of same amount)
  console.log('\n2️⃣  Checking for paired transactions (same amount, opposite types)...')
  
  const { data: pairedTrans } = await supabase
    .from('inventory_adjustments')
    .select('adjustment_date, part_number, adjustment_amount, adjustment_type, extended_cost')
    .order('part_number', { ascending: true })
    .order('adjustment_date', { ascending: true })
    .limit(1000)
  
  if (pairedTrans) {
    const pairs: any[] = []
    const groupedByPartDate: Record<string, any[]> = {}
    
    // Group by part number and date
    pairedTrans.forEach(record => {
      const key = `${record.part_number}|${record.adjustment_date}`
      if (!groupedByPartDate[key]) {
        groupedByPartDate[key] = []
      }
      groupedByPartDate[key].push(record)
    })
    
    // Find pairs
    Object.entries(groupedByPartDate).forEach(([key, records]) => {
      if (records.length >= 2) {
        const increases = records.filter(r => r.adjustment_type === 'increase')
        const decreases = records.filter(r => r.adjustment_type === 'decrease')
        
        if (increases.length > 0 && decreases.length > 0) {
          // Check if amounts match
          increases.forEach(inc => {
            decreases.forEach(dec => {
              if (Math.abs(inc.adjustment_amount - dec.adjustment_amount) < 0.01 &&
                  Math.abs(inc.extended_cost - dec.extended_cost) < 0.01) {
                pairs.push({
                  date: inc.adjustment_date,
                  part: inc.part_number,
                  amount: inc.adjustment_amount,
                  cost: inc.extended_cost
                })
              }
            })
          })
        }
      }
    })
    
    if (pairs.length > 0) {
      console.log(`\n⚠️  Found ${pairs.length} paired transactions (increase/decrease pairs)`)
      console.log('These often represent transfers between locations')
      console.log('\nSample pairs:')
      pairs.slice(0, 5).forEach(pair => {
        console.log(`  ${pair.date} - ${pair.part} - Amount: ${pair.amount} - Cost: $${pair.cost}`)
      })
    }
  }
  
  // Check for similar amounts (within 1% tolerance)
  console.log('\n3️⃣  Checking for near-duplicate amounts on same day/part...')
  
  const { data: sampleData } = await supabase
    .from('inventory_adjustments')
    .select('*')
    .limit(5000)
  
  if (sampleData) {
    const nearDupes: any[] = []
    const groupedByPartDate: Record<string, any[]> = {}
    
    sampleData.forEach(record => {
      const key = `${record.part_number}|${record.adjustment_date}`
      if (!groupedByPartDate[key]) {
        groupedByPartDate[key] = []
      }
      groupedByPartDate[key].push(record)
    })
    
    Object.entries(groupedByPartDate).forEach(([key, records]) => {
      if (records.length >= 2) {
        for (let i = 0; i < records.length - 1; i++) {
          for (let j = i + 1; j < records.length; j++) {
            const diff = Math.abs(records[i].adjustment_amount - records[j].adjustment_amount)
            const avg = (records[i].adjustment_amount + records[j].adjustment_amount) / 2
            const percentDiff = avg > 0 ? (diff / avg) * 100 : 0
            
            if (percentDiff < 1 && percentDiff > 0) {
              nearDupes.push({
                date: records[i].adjustment_date,
                part: records[i].part_number,
                amount1: records[i].adjustment_amount,
                amount2: records[j].adjustment_amount,
                diff: diff,
                percentDiff: percentDiff.toFixed(2)
              })
            }
          }
        }
      }
    })
    
    if (nearDupes.length > 0) {
      console.log(`\n⚠️  Found ${nearDupes.length} near-duplicate amounts (within 1% tolerance)`)
      console.log('\nSample near-duplicates:')
      nearDupes.slice(0, 5).forEach(dup => {
        console.log(`  ${dup.date} - ${dup.part.substring(0, 20)} - Amounts: ${dup.amount1} vs ${dup.amount2} (${dup.percentDiff}% diff)`)
      })
    }
  }
  
  // Check for the most common adjustment patterns
  console.log('\n4️⃣  Most common adjustment patterns...')
  
  const { data: patterns } = await supabase.rpc('execute_sql', {
    query: `
      SELECT 
        part_number,
        adjustment_amount,
        COUNT(*) as frequency
      FROM inventory_adjustments
      GROUP BY part_number, adjustment_amount
      HAVING COUNT(*) > 50
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `
  })
  
  if (patterns && patterns.length > 0) {
    console.log('\nMost repeated adjustments:')
    console.log('Part Number          | Amount    | Frequency')
    console.log('---------------------|-----------|----------')
    patterns.forEach((pattern: any) => {
      console.log(
        `${pattern.part_number.substring(0, 20).padEnd(20)} | ${pattern.adjustment_amount.toString().padStart(9)} | ${pattern.frequency}`
      )
    })
  }
  
  // Summary and recommendations
  console.log('\n═══════════════════════════════════════════════')
  console.log('📊 DUPLICATE ANALYSIS SUMMARY')
  console.log('═══════════════════════════════════════════════\n')
  
  const { count: totalCount } = await supabase
    .from('inventory_adjustments')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Total records: ${totalCount?.toLocaleString() || 0}`)
  
  console.log('\n🔍 Key Findings:')
  console.log('1. Container Audit transactions often create paired increase/decrease records')
  console.log('2. Same items moved between locations generate symmetric adjustments')
  console.log('3. Some adjustments appear to be logged multiple times')
  
  console.log('\n💡 Recommendations:')
  console.log('1. Implement deduplication logic for container transfers')
  console.log('2. Net out paired transactions for true inventory impact')
  console.log('3. Add unique constraint on (date, part, amount, type) to prevent duplicates')
  console.log('4. Consider filtering "Container Audit" records for cleaner analysis')
}

// Also check specific patterns from the original analysis
async function checkSpecificPatterns() {
  console.log('\n\n5️⃣  Checking specific high-value patterns from original analysis...')
  
  // Check for the specific high-value adjustments mentioned in the report
  const highValueParts = [
    'B1-2026A-0C',
    '25K701',
    '1344664-00-A_TUMBLE',
    '21743763'
  ]
  
  for (const part of highValueParts) {
    const { data, count } = await supabase
      .from('inventory_adjustments')
      .select('*', { count: 'exact' })
      .like('part_number', `${part}%`)
      .order('adjustment_amount', { ascending: false })
      .limit(10)
    
    if (data && data.length > 0) {
      console.log(`\n📦 ${part}: ${count} total adjustments`)
      console.log('  Top adjustments:')
      data.slice(0, 3).forEach(adj => {
        console.log(`    ${adj.adjustment_date} - ${adj.adjustment_type} ${adj.adjustment_amount} units - $${adj.extended_cost}`)
      })
    }
  }
}

async function main() {
  await checkDuplicates()
  await checkSpecificPatterns()
}

main().catch(console.error)