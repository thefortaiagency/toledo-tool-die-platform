import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

interface InventoryAdjustment {
  date: Date
  partNumber: string
  partName: string
  previousQty: number
  adjustedQty: number
  adjustmentAmount: number
  adjustmentType: 'increase' | 'decrease'
  reason?: string
  location?: string
  costImpact?: number
  unitCost?: number
}

interface AdjustmentSummary {
  totalAdjustments: number
  totalIncreases: number
  totalDecreases: number
  netQuantityChange: number
  totalCostImpact: number
  byMonth: Record<string, {
    adjustmentCount: number
    increases: number
    decreases: number
    netQtyChange: number
    costImpact: number
  }>
  byPart: Record<string, {
    partName: string
    adjustmentCount: number
    netQtyChange: number
    costImpact: number
  }>
  byReason: Record<string, {
    count: number
    netQtyChange: number
    costImpact: number
  }>
  topAdjustmentsByValue: Array<{
    date: string
    partNumber: string
    partName: string
    adjustmentQty: number
    costImpact: number
  }>
  adjustmentTrends: {
    averageDailyAdjustments: number
    averageDailyCostImpact: number
    highestAdjustmentDay: string
    highestCostImpactDay: string
  }
}

function parseInventoryFile(filePath: string): InventoryAdjustment[] {
  const adjustments: InventoryAdjustment[] = []
  
  try {
    const workbook = XLSX.readFile(filePath)
    
    // Look for the actual data sheet
    let worksheet: XLSX.WorkSheet | null = null
    let sheetName = ''
    
    // Try to find the sheet with detailed adjustment data
    for (const name of workbook.SheetNames) {
      if (name.includes('Inventory_Adjustment_Report') || name === 'Inventory_Adjustment_Report_202') {
        worksheet = workbook.Sheets[name]
        sheetName = name
        break
      }
    }
    
    // Fall back to first sheet if specific sheet not found
    if (!worksheet) {
      sheetName = workbook.SheetNames[0]
      worksheet = workbook.Sheets[sheetName]
    }
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    
    // Extract date from filename
    const fileName = path.basename(filePath, '.xlsx')
    const [month, day, year] = fileName.split('-').map(n => parseInt(n))
    const fileDate = new Date(2000 + year, month - 1, day)
    
    jsonData.forEach((row: any) => {
      // Based on the actual column names found in the Toledo Tool files
      const partNumber = row['Part Number - Revision'] || row['Part Number'] || ''
      const operation = row['Operation'] || ''
      const lastAction = row['Last Action'] || ''
      
      // Get the adjustment quantity (already represents the adjustment, not absolute qty)
      const quantity = parseFloat(row['Quantity'] || 0)
      const extendedCost = parseFloat(row['Extended Cost'] || 0)
      const originalQty = parseFloat(row['Original Quantity'] || 0)
      
      // Calculate unit cost if we have extended cost and quantity
      const unitCost = quantity !== 0 ? Math.abs(extendedCost / quantity) : parseFloat(row['Unit Cost'] || 0)
      
      // Get additional info
      const reason = row['Adjustment Reason'] || lastAction || 'Not specified'
      const user = row['By'] || row['User_ID'] || ''
      const location = row['Location'] || ''
      const partGroup = row['Part Group'] || ''
      const partType = row['Part Type'] || ''
      const status = row['Status'] || ''
      
      // Only process if we have a part number and a non-zero quantity adjustment
      if (partNumber && quantity !== 0 && !isNaN(quantity)) {
        adjustments.push({
          date: fileDate,
          partNumber: String(partNumber).trim(),
          partName: `${partType} - ${operation}`.trim() || partGroup,
          previousQty: originalQty,
          adjustedQty: originalQty + quantity,
          adjustmentAmount: Math.abs(quantity),
          adjustmentType: quantity > 0 ? 'increase' : 'decrease',
          reason: String(reason).trim() || 'Not specified',
          location: String(location).trim() || operation,
          costImpact: Math.abs(extendedCost),
          unitCost
        })
      }
    })
  } catch (error) {
    console.warn(`Warning processing ${path.basename(filePath)}: ${error}`)
  }
  
  return adjustments
}

function analyzeAdjustments(adjustments: InventoryAdjustment[]): AdjustmentSummary {
  const summary: AdjustmentSummary = {
    totalAdjustments: adjustments.length,
    totalIncreases: 0,
    totalDecreases: 0,
    netQuantityChange: 0,
    totalCostImpact: 0,
    byMonth: {},
    byPart: {},
    byReason: {},
    topAdjustmentsByValue: [],
    adjustmentTrends: {
      averageDailyAdjustments: 0,
      averageDailyCostImpact: 0,
      highestAdjustmentDay: '',
      highestCostImpactDay: ''
    }
  }
  
  const dailyStats: Record<string, { count: number; cost: number }> = {}
  
  adjustments.forEach(adj => {
    // Overall counts
    if (adj.adjustmentType === 'increase') {
      summary.totalIncreases++
      summary.netQuantityChange += adj.adjustmentAmount
    } else {
      summary.totalDecreases++
      summary.netQuantityChange -= adj.adjustmentAmount
    }
    summary.totalCostImpact += adj.costImpact || 0
    
    // By month
    const monthKey = adj.date.toISOString().substring(0, 7)
    if (!summary.byMonth[monthKey]) {
      summary.byMonth[monthKey] = {
        adjustmentCount: 0,
        increases: 0,
        decreases: 0,
        netQtyChange: 0,
        costImpact: 0
      }
    }
    summary.byMonth[monthKey].adjustmentCount++
    if (adj.adjustmentType === 'increase') {
      summary.byMonth[monthKey].increases++
      summary.byMonth[monthKey].netQtyChange += adj.adjustmentAmount
    } else {
      summary.byMonth[monthKey].decreases++
      summary.byMonth[monthKey].netQtyChange -= adj.adjustmentAmount
    }
    summary.byMonth[monthKey].costImpact += adj.costImpact || 0
    
    // By part
    if (!summary.byPart[adj.partNumber]) {
      summary.byPart[adj.partNumber] = {
        partName: adj.partName,
        adjustmentCount: 0,
        netQtyChange: 0,
        costImpact: 0
      }
    }
    summary.byPart[adj.partNumber].adjustmentCount++
    summary.byPart[adj.partNumber].netQtyChange += 
      adj.adjustmentType === 'increase' ? adj.adjustmentAmount : -adj.adjustmentAmount
    summary.byPart[adj.partNumber].costImpact += adj.costImpact || 0
    
    // By reason
    const reasonKey = adj.reason || 'Not specified'
    if (!summary.byReason[reasonKey]) {
      summary.byReason[reasonKey] = {
        count: 0,
        netQtyChange: 0,
        costImpact: 0
      }
    }
    summary.byReason[reasonKey].count++
    summary.byReason[reasonKey].netQtyChange += 
      adj.adjustmentType === 'increase' ? adj.adjustmentAmount : -adj.adjustmentAmount
    summary.byReason[reasonKey].costImpact += adj.costImpact || 0
    
    // Daily stats for trends
    const dayKey = adj.date.toISOString().substring(0, 10)
    if (!dailyStats[dayKey]) {
      dailyStats[dayKey] = { count: 0, cost: 0 }
    }
    dailyStats[dayKey].count++
    dailyStats[dayKey].cost += adj.costImpact || 0
  })
  
  // Calculate trends
  const dailyEntries = Object.entries(dailyStats)
  if (dailyEntries.length > 0) {
    const totalDays = dailyEntries.length
    summary.adjustmentTrends.averageDailyAdjustments = summary.totalAdjustments / totalDays
    summary.adjustmentTrends.averageDailyCostImpact = summary.totalCostImpact / totalDays
    
    // Find highest days
    const highestCountDay = dailyEntries.reduce((max, [day, stats]) => 
      stats.count > (dailyStats[max]?.count || 0) ? day : max, dailyEntries[0][0])
    const highestCostDay = dailyEntries.reduce((max, [day, stats]) => 
      stats.cost > (dailyStats[max]?.cost || 0) ? day : max, dailyEntries[0][0])
    
    summary.adjustmentTrends.highestAdjustmentDay = highestCountDay
    summary.adjustmentTrends.highestCostImpactDay = highestCostDay
  }
  
  // Get top adjustments by value
  summary.topAdjustmentsByValue = adjustments
    .filter(adj => adj.costImpact)
    .sort((a, b) => (b.costImpact || 0) - (a.costImpact || 0))
    .slice(0, 10)
    .map(adj => ({
      date: adj.date.toISOString().substring(0, 10),
      partNumber: adj.partNumber,
      partName: adj.partName,
      adjustmentQty: adj.adjustmentType === 'increase' ? adj.adjustmentAmount : -adj.adjustmentAmount,
      costImpact: adj.costImpact || 0
    }))
  
  return summary
}

async function processAllInventoryFiles() {
  const inventoryDir = '/Users/thefortob/Development/ToledoToolAndDie/Inventory Adjustment'
  const allAdjustments: InventoryAdjustment[] = []
  
  console.log('🔍 Processing Toledo Tool & Die Inventory Adjustment Data\n')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  // Get all Excel files
  const files = fs.readdirSync(inventoryDir)
    .filter(file => file.endsWith('.xlsx'))
    .sort()
  
  console.log(`📁 Found ${files.length} daily inventory adjustment files\n`)
  
  // Process first file to understand structure
  if (files.length > 0) {
    const sampleFile = path.join(inventoryDir, files[0])
    console.log(`📋 Inspecting file structure from: ${files[0]}\n`)
    
    const workbook = XLSX.readFile(sampleFile)
    
    // Show all sheet names
    console.log('Available sheets:', workbook.SheetNames)
    
    // Look for the inventory adjustment sheet
    let targetSheet = null
    for (const name of workbook.SheetNames) {
      if (name.includes('Inventory_Adjustment_Report')) {
        targetSheet = name
        break
      }
    }
    
    if (targetSheet) {
      console.log(`Using sheet: ${targetSheet}\n`)
      const worksheet = workbook.Sheets[targetSheet]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length > 0) {
        console.log('Column Headers:', jsonData[0])
        if (jsonData.length > 1) {
          console.log('Sample data row:', jsonData[1])
        }
        console.log(`Total rows in sheet: ${jsonData.length}`)
        console.log('\n')
      }
    }
  }
  
  // Process all files
  let processedCount = 0
  for (const file of files) {
    const filePath = path.join(inventoryDir, file)
    const adjustments = parseInventoryFile(filePath)
    allAdjustments.push(...adjustments)
    processedCount++
    
    if (processedCount % 20 === 0) {
      process.stdout.write(`\rProcessing: ${processedCount}/${files.length} files...`)
    }
  }
  
  console.log(`\r✅ Processed ${processedCount} files`)
  console.log(`📊 Total adjustment records: ${allAdjustments.length.toLocaleString()}\n`)
  
  // Analyze the data
  const summary = analyzeAdjustments(allAdjustments)
  
  // Generate report
  console.log('═══════════════════════════════════════════════════════════')
  console.log('     TOLEDO TOOL & DIE - 2025 INVENTORY ADJUSTMENT ANALYSIS')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  console.log('📈 EXECUTIVE SUMMARY')
  console.log('─────────────────────────────────────────────────────────')
  console.log(`Total Adjustments:        ${summary.totalAdjustments.toLocaleString()}`)
  console.log(`Inventory Increases:      ${summary.totalIncreases.toLocaleString()} (${(summary.totalIncreases/summary.totalAdjustments*100).toFixed(1)}%)`)
  console.log(`Inventory Decreases:      ${summary.totalDecreases.toLocaleString()} (${(summary.totalDecreases/summary.totalAdjustments*100).toFixed(1)}%)`)
  console.log(`Net Quantity Change:      ${summary.netQuantityChange > 0 ? '+' : ''}${summary.netQuantityChange.toLocaleString()} units`)
  console.log(`Total Cost Impact:        $${summary.totalCostImpact.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}\n`)
  
  console.log('📊 ADJUSTMENT TRENDS')
  console.log('─────────────────────────────────────────────────────────')
  console.log(`Average Daily Adjustments: ${summary.adjustmentTrends.averageDailyAdjustments.toFixed(1)}`)
  console.log(`Average Daily Cost Impact: $${summary.adjustmentTrends.averageDailyCostImpact.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`)
  console.log(`Highest Adjustment Day:    ${summary.adjustmentTrends.highestAdjustmentDay}`)
  console.log(`Highest Cost Impact Day:   ${summary.adjustmentTrends.highestCostImpactDay}\n`)
  
  console.log('📅 MONTHLY BREAKDOWN')
  console.log('─────────────────────────────────────────────────────────')
  console.log('Month     | Adjustments | Increases | Decreases | Net Qty Change | Cost Impact')
  console.log('----------|-------------|-----------|-----------|----------------|------------')
  
  Object.entries(summary.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      console.log(
        `${month}  | ${data.adjustmentCount.toString().padStart(11)} | ${data.increases.toString().padStart(9)} | ${data.decreases.toString().padStart(9)} | ${data.netQtyChange.toLocaleString().padStart(14)} | $${data.costImpact.toFixed(2).padStart(10).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
      )
    })
  
  console.log('\n🏆 TOP 10 ADJUSTMENTS BY VALUE')
  console.log('─────────────────────────────────────────────────────────')
  summary.topAdjustmentsByValue.forEach((item, index) => {
    console.log(
      `${(index + 1).toString().padStart(2)}. ${item.date} | ${item.partNumber.padEnd(20)} | ${item.partName.substring(0, 30).padEnd(30)} | ${item.adjustmentQty.toLocaleString().padStart(8)} units | $${item.costImpact.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    )
  })
  
  console.log('\n📦 TOP PARTS BY ADJUSTMENT FREQUENCY')
  console.log('─────────────────────────────────────────────────────────')
  const topParts = Object.entries(summary.byPart)
    .sort(([, a], [, b]) => b.adjustmentCount - a.adjustmentCount)
    .slice(0, 10)
  
  topParts.forEach(([part, data], index) => {
    console.log(
      `${(index + 1).toString().padStart(2)}. ${part.padEnd(20)} | ${data.partName.substring(0, 25).padEnd(25)} | ${data.adjustmentCount} adjustments | Net: ${data.netQtyChange.toLocaleString()}`
    )
  })
  
  console.log('\n📝 ADJUSTMENT REASONS')
  console.log('─────────────────────────────────────────────────────────')
  const topReasons = Object.entries(summary.byReason)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
  
  topReasons.forEach(([reason, data]) => {
    const pct = (data.count / summary.totalAdjustments * 100).toFixed(1)
    console.log(
      `${reason.padEnd(40)} | ${data.count.toString().padStart(6)} (${pct}%) | $${data.costImpact.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    )
  })
  
  // Save detailed report
  const reportPath = path.join(
    '/Users/thefortob/Development/ACTIVE-PROJECTS/grok-evolution/toledo-tool-die-platform',
    'data',
    'inventory-adjustment-analysis-2025.json'
  )
  
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    adjustmentCount: allAdjustments.length,
    summary
  }, null, 2))
  
  console.log(`\n✅ Detailed report saved to: ${reportPath}`)
  console.log('📊 Data ready for dashboard integration\n')
  
  return summary
}

// Run the analysis
processAllInventoryFiles().catch(console.error)