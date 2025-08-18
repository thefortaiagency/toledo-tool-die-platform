import * as XLSX from 'xlsx'

// Inspect a sample file to understand structure
const filePath = '/Users/thefortob/Development/ToledoToolAndDie/ScrapInfo/8-1-25.xlsx'

console.log('Inspecting scrap file structure:', filePath)
console.log('═══════════════════════════════════════════════════\n')

try {
  const workbook = XLSX.readFile(filePath)
  
  console.log('Sheet names:', workbook.SheetNames)
  
  // Check the second sheet which appears to be the actual scrap log
  const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  console.log('Using sheet:', sheetName)
  
  // Get data as JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  
  console.log('\nFirst 10 rows:')
  console.log('─────────────────────────────────────────────')
  
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i] as any[]
    console.log(`Row ${i}:`, row)
  }
  
  // Also try with headers
  const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet)
  console.log('\nData with headers (first 3 records):')
  console.log('─────────────────────────────────────────────')
  console.log(JSON.stringify(dataWithHeaders.slice(0, 3), null, 2))
  
  console.log('\nColumn count:', jsonData[0] ? (jsonData[0] as any[]).length : 0)
  console.log('Row count:', jsonData.length)
  
} catch (error) {
  console.error('Error reading file:', error)
}