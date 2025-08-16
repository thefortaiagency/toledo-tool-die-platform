import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as xlsx from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet) as any[]
    
    // Process and insert data
    const scrapRecords = []
    
    for (const row of jsonData) {
      // Parse the data based on Excel column names
      const record = {
        part_number: row['PartNumber'] || row['Part Number'] || '',
        revision: row['Rev'] || row['Revision'] || '',
        operation: row['Operation'] || '',
        quantity: parseInt(row['Qty'] || row['Quantity'] || 0),
        reason_code: row['Reason'] || row['Reason Code'] || '',
        workcenter: row['WC'] || row['WorkCenter'] || row['Workcenter'] || '',
        unit_cost: parseFloat(row['Unit Cost'] || row['UnitCost'] || 0),
        extended_cost: parseFloat(row['Extended Cost'] || row['ExtendedCost'] || 0),
        month: row['Month'] || new Date().toISOString().slice(0, 7),
        imported_at: new Date().toISOString()
      }
      
      // Only add records with valid data
      if (record.part_number && record.quantity > 0) {
        scrapRecords.push(record)
      }
    }
    
    // Insert into database
    const { data, error } = await supabase
      .from('scrap_data')
      .insert(scrapRecords)
      .select()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      recordsImported: data?.length || 0,
      message: `Successfully imported ${data?.length || 0} scrap records`
    })
    
  } catch (error) {
    console.error('Error importing scrap data:', error)
    return NextResponse.json(
      { error: 'Failed to import scrap data' },
      { status: 500 }
    )
  }
}