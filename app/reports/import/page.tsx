'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, RefreshCw, Database, Clock, TrendingUp } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importType, setImportType] = useState<'hit-tracker' | 'oee-metrics'>('hit-tracker')
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setImportResult(null)
      previewFile(selectedFile)
    }
  }

  const previewFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // Show first 5 rows as preview
      setPreviewData(jsonData.slice(0, 5))
    } catch (err) {
      setError('Failed to read file. Please ensure it\'s a valid Excel file.')
      console.error(err)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setImporting(true)
    setError(null)

    try {
      // Read the file
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      
      // Get the appropriate sheet based on import type
      const sheetName = importType === 'hit-tracker' 
        ? (workbook.SheetNames.find(name => name.includes('Hit') || name.includes('Tracker')) || workbook.SheetNames[0])
        : (workbook.SheetNames.find(name => name.includes('OEE')) || workbook.SheetNames[0])
      
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Format data for API
      const formattedData = jsonData.map((row: any) => {
        if (importType === 'hit-tracker') {
          return {
            machine: row.machine || row.Machine,
            date: formatDate(row.date || row.Date),
            shift: parseInt(row.shift || row.Shift),
            hits: parseInt(row.hits || row.Hits || 0),
            efficiency: parseFloat(row.efficiency || row.Efficiency || 0),
            downtime_minutes: parseInt(row.downtime_minutes || row['Downtime Minutes'] || 0),
            operator: row.operator || row.Operator,
            part_number: row.part_number || row['Part Number'],
            comments: row.comments || row.Comments
          }
        } else {
          return {
            machine: row.machine || row.Machine,
            date: formatDate(row.date || row.Date),
            availability: parseFloat(row.availability || row.Availability),
            performance: parseFloat(row.performance || row.Performance),
            quality: parseFloat(row.quality || row.Quality)
          }
        }
      })

      // Send to API
      const response = await fetch('/api/reports/hit-tracker-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: importType,
          source: `Excel Import - ${file.name}`,
          data: formattedData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setImportResult(result)
      
      // Clear file input
      setFile(null)
      setPreviewData([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Import failed. Please check your file format.')
      console.error('Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return ''
    
    // If it\'s already a string in YYYY-MM-DD format, return it
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue
    }
    
    // If it\'s an Excel date number, convert it
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }
    
    // Try to parse it as a date
    const date = new Date(dateValue)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    return dateValue
  }

  const downloadTemplate = () => {
    // In a real app, this would download the template file
    window.location.href = '/hit-tracker-import-template.xlsx'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Import Center</h1>
        <p className="text-gray-600">Import production data from Excel files or connect to production systems</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>Upload Excel files with production data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Import Type Selection */}
              <div className="flex gap-4 mb-4">
                <Button
                  variant={importType === 'hit-tracker' ? 'default' : 'outline'}
                  onClick={() => setImportType('hit-tracker')}
                  className="flex-1"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Hit Tracker Data
                </Button>
                <Button
                  variant={importType === 'oee-metrics' ? 'default' : 'outline'}
                  onClick={() => setImportType('oee-metrics')}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  OEE Metrics
                </Button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">
                    {file ? (
                      <span className="text-green-600 font-medium">{file.name}</span>
                    ) : (
                      <>Click to upload or drag and drop</>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Excel files only (.xlsx, .xls)</p>
                </label>
              </div>

              {/* Preview Data */}
              {previewData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {Object.keys(previewData[0]).map(key => (
                            <th key={key} className="px-2 py-1 text-left font-medium text-gray-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            {Object.values(row).map((value: any, i) => (
                              <td key={i} className="px-2 py-1 text-gray-600">
                                {value?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Result */}
              {importResult && importResult.success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-medium mb-2">Import Successful!</div>
                    <div className="space-y-1 text-sm">
                      <p>Records imported: {importResult.summary?.successfulImports || importResult.imported}</p>
                      {importResult.summary?.totalHits && (
                        <p>Total hits: {importResult.summary.totalHits.toLocaleString()}</p>
                      )}
                      {importResult.summary?.averageEfficiency && (
                        <p>Average efficiency: {importResult.summary.averageEfficiency}%</p>
                      )}
                      {importResult.validationErrors?.length > 0 && (
                        <p className="text-orange-600">
                          {importResult.validationErrors.length} rows had errors and were skipped
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {importResult?.validationErrors?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Validation Errors</CardTitle>
                <CardDescription>These rows were not imported due to errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {importResult.validationErrors.slice(0, 10).map((error: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Badge variant="destructive" className="mt-0.5">Row {error.row}</Badge>
                      <span className="text-gray-600">{error.error}</span>
                    </div>
                  ))}
                  {importResult.validationErrors.length > 10 && (
                    <p className="text-sm text-gray-500 italic">
                      ...and {importResult.validationErrors.length - 10} more errors
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instructions Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Import Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Import</span>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  -
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Records</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Machines</span>
                <span className="font-medium">-</span>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">1</Badge>
                  <div>
                    <p className="text-sm font-medium">Download Template</p>
                    <p className="text-xs text-gray-600">Get the Excel template with correct column headers</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">2</Badge>
                  <div>
                    <p className="text-sm font-medium">Fill Your Data</p>
                    <p className="text-xs text-gray-600">Add your production data to the template</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">3</Badge>
                  <div>
                    <p className="text-sm font-medium">Upload File</p>
                    <p className="text-xs text-gray-600">Select your file and click Import</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Required Fields</CardTitle>
            </CardHeader>
            <CardContent>
              {importType === 'hit-tracker' ? (
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-gray-700">Hit Tracker Data:</div>
                  <ul className="space-y-1 text-gray-600">
                    <li>• machine (e.g., "600 Ton")</li>
                    <li>• date (YYYY-MM-DD)</li>
                    <li>• shift (1, 2, or 3)</li>
                    <li>• hits (number)</li>
                  </ul>
                  <div className="font-medium text-gray-700 mt-3">Optional:</div>
                  <ul className="space-y-1 text-gray-600">
                    <li>• efficiency (0-200%)</li>
                    <li>• downtime_minutes</li>
                    <li>• operator</li>
                    <li>• part_number</li>
                    <li>• comments</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-gray-700">OEE Metrics:</div>
                  <ul className="space-y-1 text-gray-600">
                    <li>• machine</li>
                    <li>• date (YYYY-MM-DD)</li>
                    <li>• availability (0-100%)</li>
                    <li>• performance (0-100%)</li>
                    <li>• quality (0-100%)</li>
                  </ul>
                  <div className="text-xs text-gray-500 mt-3">
                    OEE will be calculated automatically
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}