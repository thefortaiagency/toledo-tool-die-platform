import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

// Define planned and unplanned scrap codes
const PLANNED_CODES = [10, 21, 28, 32, 51]
const SCRAP_CODE_DESCRIPTIONS: Record<number, string> = {
  // Planned codes
  10: 'Setup/Trial',
  21: 'Engineering Change',
  28: 'First Article',
  32: 'Quality Sample',
  51: 'Scheduled Maintenance',
  
  // Common unplanned codes (add more as needed)
  11: 'Die Issue',
  12: 'Machine Malfunction',
  15: 'Operator Error',
  20: 'Material Defect',
  25: 'Dimensional Issue',
  30: 'Surface Defect',
  35: 'Process Issue',
  40: 'Tool Wear',
  45: 'Power Failure',
  50: 'Other'
}

interface ScrapRecord {
  date: string
  partNumber: string
  scrapCode: number
  scrapDescription: string
  quantity: number
  machine?: string
  shift?: string
  operator?: string
  cost?: number
}

interface ScrapSummary {
  totalScrap: number
  plannedScrap: number
  unplannedScrap: number
  plannedPercentage: number
  unplannedPercentage: number
  byCode: Record<number, {
    description: string
    quantity: number
    percentage: number
    isPlanned: boolean
  }>
  byMonth: Record<string, {
    total: number
    planned: number
    unplanned: number
  }>
  byPart: Record<string, {
    total: number
    planned: number
    unplanned: number
  }>
  topUnplannedCodes: Array<{
    code: number
    description: string
    quantity: number
    percentage: number
  }>
  costAnalysis: {
    totalCost: number
    plannedCost: number
    unplannedCost: number
  }
}

function parseScrapFile(filePath: string): ScrapRecord[] {
  const records: ScrapRecord[] = []
  
  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Extract date from filename (e.g., "1-10-25.xlsx" -> "2025-01-10")
    const fileName = path.basename(filePath, '.xlsx')
    const [month, day, yearShort] = fileName.split('-')
    const year = yearShort.length === 2 ? `20${yearShort}` : yearShort
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    
    // Skip header row and process data
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      if (!row || row.length === 0) continue
      
      // Adjust column indices based on actual file structure
      // This is a template - adjust based on actual Excel structure
      const partNumber = row[0]?.toString() || ''
      const scrapCode = parseInt(row[1]) || 0
      const quantity = parseFloat(row[2]) || 0
      const machine = row[3]?.toString() || ''
      const shift = row[4]?.toString() || ''
      const operator = row[5]?.toString() || ''
      const cost = parseFloat(row[6]) || 0
      
      if (scrapCode && quantity > 0) {
        records.push({
          date: dateStr,
          partNumber,
          scrapCode,
          scrapDescription: SCRAP_CODE_DESCRIPTIONS[scrapCode] || `Code ${scrapCode}`,
          quantity,
          machine,
          shift,
          operator,
          cost: cost || quantity * 0.5 // Default cost if not provided
        })
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
  }
  
  return records
}

function analyzeScrapData(records: ScrapRecord[]): ScrapSummary {
  const summary: ScrapSummary = {
    totalScrap: 0,
    plannedScrap: 0,
    unplannedScrap: 0,
    plannedPercentage: 0,
    unplannedPercentage: 0,
    byCode: {},
    byMonth: {},
    byPart: {},
    topUnplannedCodes: [],
    costAnalysis: {
      totalCost: 0,
      plannedCost: 0,
      unplannedCost: 0
    }
  }
  
  // Process each record
  records.forEach(record => {
    const isPlanned = PLANNED_CODES.includes(record.scrapCode)
    
    // Update totals
    summary.totalScrap += record.quantity
    if (isPlanned) {
      summary.plannedScrap += record.quantity
      summary.costAnalysis.plannedCost += record.cost || 0
    } else {
      summary.unplannedScrap += record.quantity
      summary.costAnalysis.unplannedCost += record.cost || 0
    }
    summary.costAnalysis.totalCost += record.cost || 0
    
    // By code analysis
    if (!summary.byCode[record.scrapCode]) {
      summary.byCode[record.scrapCode] = {
        description: record.scrapDescription,
        quantity: 0,
        percentage: 0,
        isPlanned
      }
    }
    summary.byCode[record.scrapCode].quantity += record.quantity
    
    // By month analysis
    const monthKey = record.date.substring(0, 7) // YYYY-MM
    if (!summary.byMonth[monthKey]) {
      summary.byMonth[monthKey] = { total: 0, planned: 0, unplanned: 0 }
    }
    summary.byMonth[monthKey].total += record.quantity
    if (isPlanned) {
      summary.byMonth[monthKey].planned += record.quantity
    } else {
      summary.byMonth[monthKey].unplanned += record.quantity
    }
    
    // By part analysis
    if (record.partNumber) {
      if (!summary.byPart[record.partNumber]) {
        summary.byPart[record.partNumber] = { total: 0, planned: 0, unplanned: 0 }
      }
      summary.byPart[record.partNumber].total += record.quantity
      if (isPlanned) {
        summary.byPart[record.partNumber].planned += record.quantity
      } else {
        summary.byPart[record.partNumber].unplanned += record.quantity
      }
    }
  })
  
  // Calculate percentages
  if (summary.totalScrap > 0) {
    summary.plannedPercentage = (summary.plannedScrap / summary.totalScrap) * 100
    summary.unplannedPercentage = (summary.unplannedScrap / summary.totalScrap) * 100
    
    // Calculate code percentages
    Object.keys(summary.byCode).forEach(code => {
      summary.byCode[parseInt(code)].percentage = 
        (summary.byCode[parseInt(code)].quantity / summary.totalScrap) * 100
    })
  }
  
  // Get top unplanned codes
  const unplannedCodes = Object.entries(summary.byCode)
    .filter(([_, data]) => !data.isPlanned)
    .map(([code, data]) => ({
      code: parseInt(code),
      description: data.description,
      quantity: data.quantity,
      percentage: data.percentage
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
  
  summary.topUnplannedCodes = unplannedCodes
  
  return summary
}

async function processAllScrapFiles() {
  const scrapDir = '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo'
  const allRecords: ScrapRecord[] = []
  
  console.log('🔍 Processing scrap data files...\n')
  
  // Get all Excel files
  const files = fs.readdirSync(scrapDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
  
  console.log(`Found ${files.length} scrap data files\n`)
  
  // Process each file
  let processedCount = 0
  for (const file of files) {
    const filePath = path.join(scrapDir, file)
    const records = parseScrapFile(filePath)
    allRecords.push(...records)
    processedCount++
    
    if (processedCount % 10 === 0) {
      console.log(`Processed ${processedCount}/${files.length} files...`)
    }
  }
  
  console.log(`\n✅ Processed all ${processedCount} files`)
  console.log(`📊 Total records: ${allRecords.length}\n`)
  
  // Analyze the data
  const summary = analyzeScrapData(allRecords)
  
  // Generate report
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                    YEARLY SCRAP ANALYSIS REPORT                ')
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('📈 OVERALL SUMMARY')
  console.log('─────────────────────────────────────────────────────────────')
  console.log(`Total Scrap Quantity: ${summary.totalScrap.toLocaleString()} pieces`)
  console.log(`Total Scrap Cost: $${summary.costAnalysis.totalCost.toFixed(2).toLocaleString()}\n`)
  
  console.log('📊 PLANNED VS UNPLANNED BREAKDOWN')
  console.log('─────────────────────────────────────────────────────────────')
  console.log(`Planned Scrap:   ${summary.plannedScrap.toLocaleString()} pieces (${summary.plannedPercentage.toFixed(1)}%)`)
  console.log(`                  Cost: $${summary.costAnalysis.plannedCost.toFixed(2).toLocaleString()}`)
  console.log(`Unplanned Scrap: ${summary.unplannedScrap.toLocaleString()} pieces (${summary.unplannedPercentage.toFixed(1)}%)`)
  console.log(`                  Cost: $${summary.costAnalysis.unplannedCost.toFixed(2).toLocaleString()}\n`)
  
  console.log('🎯 PLANNED SCRAP CODES (Acceptable)')
  console.log('─────────────────────────────────────────────────────────────')
  PLANNED_CODES.forEach(code => {
    if (summary.byCode[code]) {
      const data = summary.byCode[code]
      console.log(`Code ${code} - ${data.description}: ${data.quantity.toLocaleString()} (${data.percentage.toFixed(1)}%)`)
    }
  })
  
  console.log('\n⚠️  TOP 10 UNPLANNED SCRAP CODES (Need Attention)')
  console.log('─────────────────────────────────────────────────────────────')
  summary.topUnplannedCodes.forEach((item, index) => {
    console.log(`${index + 1}. Code ${item.code} - ${item.description}: ${item.quantity.toLocaleString()} (${item.percentage.toFixed(1)}%)`)
  })
  
  console.log('\n📅 MONTHLY TREND')
  console.log('─────────────────────────────────────────────────────────────')
  console.log('Month      | Total    | Planned  | Unplanned | Unplanned %')
  console.log('-----------|----------|----------|-----------|-------------')
  
  Object.entries(summary.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      const unplannedPct = data.total > 0 ? (data.unplanned / data.total * 100) : 0
      console.log(
        `${month}   | ${data.total.toString().padStart(8)} | ${data.planned.toString().padStart(8)} | ${data.unplanned.toString().padStart(9)} | ${unplannedPct.toFixed(1).padStart(10)}%`
      )
    })
  
  console.log('\n🏆 TOP 10 PARTS BY SCRAP QUANTITY')
  console.log('─────────────────────────────────────────────────────────────')
  const topParts = Object.entries(summary.byPart)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
  
  topParts.forEach(([part, data], index) => {
    const unplannedPct = data.total > 0 ? (data.unplanned / data.total * 100) : 0
    console.log(
      `${index + 1}. ${part}: ${data.total.toLocaleString()} total (${unplannedPct.toFixed(1)}% unplanned)`
    )
  })
  
  // Save detailed report to JSON
  const reportPath = path.join(
    '/Users/thefortob/Development/ACTIVE-PROJECTS/grok-evolution/toledo-tool-die-platform',
    'data',
    'scrap-analysis-2025.json'
  )
  
  // Ensure data directory exists
  const dataDir = path.dirname(reportPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary,
    records: allRecords
  }, null, 2))
  
  console.log(`\n✅ Detailed report saved to: ${reportPath}`)
  
  return summary
}

// Run the analysis
processAllScrapFiles().catch(console.error)