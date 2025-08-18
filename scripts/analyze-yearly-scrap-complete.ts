import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

// Define planned and unplanned scrap codes
const PLANNED_CODES = [10, 21, 28, 32, 51]

interface ScrapRecord {
  reportDate: Date
  recordDate: Date
  jobNo: string
  partNo: string
  revision: string
  name: string
  serialNo: string
  operation: string
  qty: number
  weight: number
  scrapReason: string
  scrapCode: number
  workcenter: string
  workcenterGroup: string
  location: string
  unitCost: number
  extendedCost: number
  note?: string
}

interface ScrapSummary {
  totalScrapQty: number
  totalScrapCost: number
  plannedScrapQty: number
  plannedScrapCost: number
  unplannedScrapQty: number
  unplannedScrapCost: number
  plannedPercentage: number
  unplannedPercentage: number
  byCode: Record<string, {
    description: string
    quantity: number
    cost: number
    percentage: number
    isPlanned: boolean
  }>
  byMonth: Record<string, {
    totalQty: number
    totalCost: number
    plannedQty: number
    plannedCost: number
    unplannedQty: number
    unplannedCost: number
  }>
  byWorkcenterGroup: Record<string, {
    totalQty: number
    totalCost: number
    plannedQty: number
    unplannedQty: number
  }>
  byPart: Record<string, {
    name: string
    totalQty: number
    totalCost: number
    plannedQty: number
    unplannedQty: number
  }>
  topUnplannedCodes: Array<{
    code: string
    description: string
    quantity: number
    cost: number
    percentage: number
  }>
}

// Convert Excel date to JS Date
function excelDateToJSDate(excelDate: number): Date {
  const date = new Date((excelDate - 25569) * 86400 * 1000)
  return date
}

function extractScrapCode(scrapReason: string): number {
  const match = scrapReason.match(/^(\d+)/)
  return match ? parseInt(match[1]) : 0
}

function parseScrapFile(filePath: string): ScrapRecord[] {
  const records: ScrapRecord[] = []
  
  try {
    const workbook = XLSX.readFile(filePath)
    
    // Try to find the scrap log sheet
    let sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('scrap') || 
      name.toLowerCase().includes('log')
    ) || workbook.SheetNames[1] || workbook.SheetNames[0]
    
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    
    jsonData.forEach((row: any) => {
      // Skip if no quantity
      if (!row['Qty'] || row['Qty'] <= 0) return
      
      const scrapReason = row['Scrap Reason'] || ''
      const scrapCode = extractScrapCode(scrapReason)
      
      records.push({
        reportDate: excelDateToJSDate(row['Report Date']),
        recordDate: excelDateToJSDate(row['Record Date']),
        jobNo: String(row['Job No'] || ''),
        partNo: String(row['Part No'] || ''),
        revision: String(row['Revision'] || ''),
        name: String(row['Name'] || ''),
        serialNo: String(row['Serial No'] || ''),
        operation: String(row['Operation'] || ''),
        qty: parseFloat(row['Qty']) || 0,
        weight: parseFloat(row['Weight']) || 0,
        scrapReason: scrapReason,
        scrapCode: scrapCode,
        workcenter: String(row['Workcenter'] || ''),
        workcenterGroup: String(row['Workcenter Group'] || ''),
        location: String(row['Location'] || ''),
        unitCost: parseFloat(row['Unit Cost($)']) || 0,
        extendedCost: parseFloat(row['Extended Cost($)']) || 0,
        note: row['Note']
      })
    })
  } catch (error) {
    // Some files might not have the scrap log sheet
    console.warn(`Warning processing ${path.basename(filePath)}: ${error}`)
  }
  
  return records
}

function analyzeScrapData(records: ScrapRecord[]): ScrapSummary {
  const summary: ScrapSummary = {
    totalScrapQty: 0,
    totalScrapCost: 0,
    plannedScrapQty: 0,
    plannedScrapCost: 0,
    unplannedScrapQty: 0,
    unplannedScrapCost: 0,
    plannedPercentage: 0,
    unplannedPercentage: 0,
    byCode: {},
    byMonth: {},
    byWorkcenterGroup: {},
    byPart: {},
    topUnplannedCodes: []
  }
  
  // Process each record
  records.forEach(record => {
    const isPlanned = PLANNED_CODES.includes(record.scrapCode)
    
    // Update totals
    summary.totalScrapQty += record.qty
    summary.totalScrapCost += record.extendedCost
    
    if (isPlanned) {
      summary.plannedScrapQty += record.qty
      summary.plannedScrapCost += record.extendedCost
    } else {
      summary.unplannedScrapQty += record.qty
      summary.unplannedScrapCost += record.extendedCost
    }
    
    // By code analysis
    const codeKey = record.scrapReason || `Code ${record.scrapCode}`
    if (!summary.byCode[codeKey]) {
      summary.byCode[codeKey] = {
        description: record.scrapReason,
        quantity: 0,
        cost: 0,
        percentage: 0,
        isPlanned
      }
    }
    summary.byCode[codeKey].quantity += record.qty
    summary.byCode[codeKey].cost += record.extendedCost
    
    // By month analysis
    const monthKey = record.reportDate.toISOString().substring(0, 7) // YYYY-MM
    if (!summary.byMonth[monthKey]) {
      summary.byMonth[monthKey] = {
        totalQty: 0,
        totalCost: 0,
        plannedQty: 0,
        plannedCost: 0,
        unplannedQty: 0,
        unplannedCost: 0
      }
    }
    summary.byMonth[monthKey].totalQty += record.qty
    summary.byMonth[monthKey].totalCost += record.extendedCost
    if (isPlanned) {
      summary.byMonth[monthKey].plannedQty += record.qty
      summary.byMonth[monthKey].plannedCost += record.extendedCost
    } else {
      summary.byMonth[monthKey].unplannedQty += record.qty
      summary.byMonth[monthKey].unplannedCost += record.extendedCost
    }
    
    // By workcenter group analysis
    if (record.workcenterGroup) {
      if (!summary.byWorkcenterGroup[record.workcenterGroup]) {
        summary.byWorkcenterGroup[record.workcenterGroup] = {
          totalQty: 0,
          totalCost: 0,
          plannedQty: 0,
          unplannedQty: 0
        }
      }
      summary.byWorkcenterGroup[record.workcenterGroup].totalQty += record.qty
      summary.byWorkcenterGroup[record.workcenterGroup].totalCost += record.extendedCost
      if (isPlanned) {
        summary.byWorkcenterGroup[record.workcenterGroup].plannedQty += record.qty
      } else {
        summary.byWorkcenterGroup[record.workcenterGroup].unplannedQty += record.qty
      }
    }
    
    // By part analysis
    if (record.partNo) {
      if (!summary.byPart[record.partNo]) {
        summary.byPart[record.partNo] = {
          name: record.name,
          totalQty: 0,
          totalCost: 0,
          plannedQty: 0,
          unplannedQty: 0
        }
      }
      summary.byPart[record.partNo].totalQty += record.qty
      summary.byPart[record.partNo].totalCost += record.extendedCost
      if (isPlanned) {
        summary.byPart[record.partNo].plannedQty += record.qty
      } else {
        summary.byPart[record.partNo].unplannedQty += record.qty
      }
    }
  })
  
  // Calculate percentages
  if (summary.totalScrapQty > 0) {
    summary.plannedPercentage = (summary.plannedScrapQty / summary.totalScrapQty) * 100
    summary.unplannedPercentage = (summary.unplannedScrapQty / summary.totalScrapQty) * 100
    
    // Calculate code percentages
    Object.keys(summary.byCode).forEach(code => {
      summary.byCode[code].percentage = 
        (summary.byCode[code].quantity / summary.totalScrapQty) * 100
    })
  }
  
  // Get top unplanned codes
  const unplannedCodes = Object.entries(summary.byCode)
    .filter(([_, data]) => !data.isPlanned)
    .map(([code, data]) => ({
      code: code,
      description: data.description,
      quantity: data.quantity,
      cost: data.cost,
      percentage: data.percentage
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)
  
  summary.topUnplannedCodes = unplannedCodes
  
  return summary
}

async function processAllScrapFiles() {
  const scrapDir = '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo'
  const allRecords: ScrapRecord[] = []
  
  console.log('🔍 Processing Toledo Tool & Die Scrap Data (2025)\n')
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  // Get all Excel files
  const files = fs.readdirSync(scrapDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
  
  console.log(`📁 Found ${files.length} daily scrap files\n`)
  
  // Process each file
  let processedCount = 0
  let filesWithData = 0
  
  for (const file of files) {
    const filePath = path.join(scrapDir, file)
    const records = parseScrapFile(filePath)
    
    if (records.length > 0) {
      allRecords.push(...records)
      filesWithData++
    }
    
    processedCount++
    
    if (processedCount % 20 === 0) {
      process.stdout.write(`\rProcessing: ${processedCount}/${files.length} files...`)
    }
  }
  
  console.log(`\r✅ Processed ${processedCount} files (${filesWithData} contained scrap data)`)
  console.log(`📊 Total scrap records: ${allRecords.length.toLocaleString()}\n`)
  
  // Analyze the data
  const summary = analyzeScrapData(allRecords)
  
  // Generate report
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('              TOLEDO TOOL & DIE - 2025 SCRAP ANALYSIS           ')
  console.log('═══════════════════════════════════════════════════════════════\n')
  
  console.log('📈 EXECUTIVE SUMMARY')
  console.log('─────────────────────────────────────────────────────────────')
  console.log(`Total Scrap Quantity:    ${summary.totalScrapQty.toLocaleString()} pieces`)
  console.log(`Total Scrap Cost:        $${summary.totalScrapCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}\n`)
  
  console.log('📊 PLANNED VS UNPLANNED BREAKDOWN')
  console.log('─────────────────────────────────────────────────────────────')
  console.log(`PLANNED SCRAP (Codes: ${PLANNED_CODES.join(', ')})`)
  console.log(`  Quantity:  ${summary.plannedScrapQty.toLocaleString()} pieces (${summary.plannedPercentage.toFixed(1)}%)`)
  console.log(`  Cost:      $${summary.plannedScrapCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`)
  console.log(`\nUNPLANNED SCRAP (All other codes)`)
  console.log(`  Quantity:  ${summary.unplannedScrapQty.toLocaleString()} pieces (${summary.unplannedPercentage.toFixed(1)}%)`)
  console.log(`  Cost:      $${summary.unplannedScrapCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}\n`)
  
  console.log('⚠️  TOP 10 UNPLANNED SCRAP REASONS (By Cost)')
  console.log('─────────────────────────────────────────────────────────────')
  summary.topUnplannedCodes.forEach((item, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${item.description.padEnd(45)} $${item.cost.toFixed(2).padStart(12).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} (${item.percentage.toFixed(1)}%)`)
  })
  
  console.log('\n📅 MONTHLY TREND ANALYSIS')
  console.log('─────────────────────────────────────────────────────────────')
  console.log('Month      | Total Cost    | Planned Cost  | Unplanned Cost | Unplanned %')
  console.log('-----------|---------------|---------------|----------------|------------')
  
  Object.entries(summary.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      const unplannedPct = data.totalCost > 0 ? (data.unplannedCost / data.totalCost * 100) : 0
      console.log(
        `${month}   | $${data.totalCost.toFixed(2).padStart(12).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} | $${data.plannedCost.toFixed(2).padStart(12).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} | $${data.unplannedCost.toFixed(2).padStart(13).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} | ${unplannedPct.toFixed(1).padStart(10)}%`
      )
    })
  
  console.log('\n🏭 SCRAP BY WORKCENTER GROUP')
  console.log('─────────────────────────────────────────────────────────────')
  const workcenterData = Object.entries(summary.byWorkcenterGroup)
    .sort(([, a], [, b]) => b.totalCost - a.totalCost)
    .slice(0, 10)
  
  workcenterData.forEach(([group, data]) => {
    const unplannedPct = data.totalQty > 0 ? (data.unplannedQty / data.totalQty * 100) : 0
    console.log(
      `${group.padEnd(35)} $${data.totalCost.toFixed(2).padStart(12).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} (${unplannedPct.toFixed(1)}% unplanned)`
    )
  })
  
  console.log('\n🏆 TOP 10 PARTS BY SCRAP COST')
  console.log('─────────────────────────────────────────────────────────────')
  const topParts = Object.entries(summary.byPart)
    .sort(([, a], [, b]) => b.totalCost - a.totalCost)
    .slice(0, 10)
  
  topParts.forEach(([part, data], index) => {
    const unplannedPct = data.totalQty > 0 ? (data.unplannedQty / data.totalQty * 100) : 0
    console.log(
      `${(index + 1).toString().padStart(2)}. ${part.padEnd(20)} ${data.name.substring(0, 30).padEnd(30)} $${data.totalCost.toFixed(2).padStart(12).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} (${unplannedPct.toFixed(1)}% unplanned)`
    )
  })
  
  // Calculate monthly average
  const monthCount = Object.keys(summary.byMonth).length
  const avgMonthlyCost = summary.totalScrapCost / monthCount
  const avgMonthlyUnplanned = summary.unplannedScrapCost / monthCount
  
  console.log('\n💰 FINANCIAL IMPACT')
  console.log('─────────────────────────────────────────────────────────────')
  console.log(`Average Monthly Scrap Cost:      $${avgMonthlyCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`)
  console.log(`Average Monthly Unplanned Cost:  $${avgMonthlyUnplanned.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`)
  console.log(`\nPotential Annual Savings (if unplanned reduced by 50%): $${(summary.unplannedScrapCost * 0.5).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`)
  
  // Save detailed report to JSON
  const reportPath = path.join(
    '/Users/thefortob/Development/ACTIVE-PROJECTS/grok-evolution/toledo-tool-die-platform',
    'data',
    'scrap-analysis-2025-complete.json'
  )
  
  // Ensure data directory exists
  const dataDir = path.dirname(reportPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    recordCount: allRecords.length,
    summary,
    plannedCodes: PLANNED_CODES
  }, null, 2))
  
  console.log(`\n\n✅ Detailed report saved to: ${reportPath}`)
  console.log('📊 Data ready for dashboard integration\n')
  
  return summary
}

// Run the analysis
processAllScrapFiles().catch(console.error)