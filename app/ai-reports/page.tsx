'use client'

import { useState, useRef } from 'react'
import { Sparkles, Loader2, Download, Share2, RefreshCw, Maximize2, FileText, FileSpreadsheet, Image as ImageIcon, FileJson } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { toPng } from 'html-to-image'

interface ChartComponent {
  type: 'bar' | 'line' | 'pie' | 'radar' | 'area' | 'scatter' | 'metric' | 'table'
  title: string
  data: any[]
  config?: any
}

interface GeneratedReport {
  title: string
  description: string
  timestamp: string
  components: ChartComponent[]
  insights: string[]
  recommendations: string[]
}

export default function AIReportGenerator() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<GeneratedReport | null>(null)
  const [error, setError] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const generateReport = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/ai-report-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const data = await response.json()
      
      if (data.error) {
        setError(data.message)
      } else {
        setReport(data.report)
      }
    } catch (err) {
      setError('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const renderChart = (component: ChartComponent, index: number) => {
    const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#eab308']
    
    switch (component.type) {
      case 'bar':
        return (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{component.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={component.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={component.config?.xKey || 'name'} />
                <YAxis />
                <Tooltip />
                <Legend />
                {component.config?.bars?.map((bar: any, i: number) => (
                  <Bar key={i} dataKey={bar.key} fill={colors[i % colors.length]} name={bar.name} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      
      case 'line':
        return (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{component.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={component.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={component.config?.xKey || 'name'} />
                <YAxis />
                <Tooltip />
                <Legend />
                {component.config?.lines?.map((line: any, i: number) => (
                  <Line key={i} type="monotone" dataKey={line.key} stroke={colors[i % colors.length]} name={line.name} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      
      case 'pie':
        return (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{component.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={component.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {component.data.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      
      case 'area':
        return (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{component.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={component.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={component.config?.xKey || 'name'} />
                <YAxis />
                <Tooltip />
                <Legend />
                {component.config?.areas?.map((area: any, i: number) => (
                  <Area key={i} type="monotone" dataKey={area.key} stackId="1" stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.6} name={area.name} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      
      case 'metric':
        return (
          <div key={index} className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2 opacity-90">{component.title}</h3>
            <div className="text-4xl font-bold">{component.data[0]?.value}</div>
            {component.data[0]?.change && (
              <div className="mt-2 text-sm opacity-80">
                {component.data[0].change > 0 ? '↑' : '↓'} {Math.abs(component.data[0].change)}% from last period
              </div>
            )}
          </div>
        )
      
      case 'table':
        return (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">{component.title}</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {component.config?.columns?.map((col: any) => (
                    <th key={col.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {component.data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {component.config?.columns?.map((col: any) => (
                      <td key={col.key} className="px-4 py-2 text-sm text-gray-900">
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      
      default:
        return null
    }
  }

  const exportToPDF = async () => {
    if (!report || !reportRef.current) return
    
    setExportLoading(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${report.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExportLoading(false)
      setShowExportMenu(false)
    }
  }

  const exportToExcel = () => {
    if (!report) return
    
    setExportLoading(true)
    try {
      const wb = XLSX.utils.book_new()
      
      // Add insights and recommendations sheet
      const summaryData = [
        ['Report Title', report.title],
        ['Description', report.description],
        ['Generated', report.timestamp],
        [''],
        ['Key Insights'],
        ...report.insights.map(i => [i]),
        [''],
        ['Recommendations'],
        ...report.recommendations.map(r => [r])
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
      
      // Add data sheets for each component
      report.components.forEach((component, idx) => {
        if (component.type === 'table' || component.data.length > 0) {
          const sheet = XLSX.utils.json_to_sheet(component.data)
          XLSX.utils.book_append_sheet(wb, sheet, `Data-${idx + 1}`)
        }
      })
      
      XLSX.writeFile(wb, `${report.title.replace(/\s+/g, '-')}-${Date.now()}.xlsx`)
    } catch (err) {
      console.error('Excel export failed:', err)
    } finally {
      setExportLoading(false)
      setShowExportMenu(false)
    }
  }

  const exportToPNG = async () => {
    if (!report || !reportRef.current) return
    
    setExportLoading(true)
    try {
      // Use html2canvas for better full-page capture
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
        logging: false
      })
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `${report.title.replace(/\s+/g, '-')}-${Date.now()}.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png', 0.95)
    } catch (err) {
      console.error('PNG export failed:', err)
    } finally {
      setExportLoading(false)
      setShowExportMenu(false)
    }
  }

  const exportToHTML = () => {
    if (!report) return
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 2rem;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 1rem;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: white;
              padding: 2rem;
            }
            .header h1 {
              font-size: 2.5rem;
              margin-bottom: 0.5rem;
            }
            .header p {
              opacity: 0.9;
              margin-bottom: 0.5rem;
            }
            .header .timestamp {
              opacity: 0.7;
              font-size: 0.875rem;
            }
            .content {
              padding: 2rem;
            }
            .section {
              margin-bottom: 2rem;
            }
            .section h2 {
              color: #f97316;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 2px solid #fed7aa;
            }
            .card {
              background: #f9fafb;
              border-left: 4px solid #f97316;
              padding: 1rem;
              margin-bottom: 1rem;
              border-radius: 0.5rem;
            }
            .insight {
              background: #fef3c7;
              border-left-color: #fbbf24;
            }
            .recommendation {
              background: #dbeafe;
              border-left-color: #3b82f6;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 1rem;
              margin-bottom: 2rem;
            }
            .metric-card {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 1.5rem;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .metric-value {
              font-size: 2rem;
              font-weight: bold;
              margin: 0.5rem 0;
            }
            .metric-label {
              opacity: 0.9;
              font-size: 0.875rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1rem;
            }
            th {
              background: #f3f4f6;
              padding: 0.75rem;
              text-align: left;
              font-weight: 600;
              color: #4b5563;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 0.75rem;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:hover {
              background: #f9fafb;
            }
            .footer {
              background: #f3f4f6;
              padding: 1.5rem 2rem;
              text-align: center;
              color: #6b7280;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${report.title}</h1>
              <p>${report.description}</p>
              <p class="timestamp">Generated: ${report.timestamp}</p>
            </div>
            
            <div class="content">
              <div class="section">
                <h2>Key Insights</h2>
                ${report.insights.map(i => `<div class="card insight">${i}</div>`).join('')}
              </div>
              
              <div class="section">
                <h2>Recommendations</h2>
                ${report.recommendations.map(r => `<div class="card recommendation">${r}</div>`).join('')}
              </div>
              
              <div class="section">
                <h2>Data Summary</h2>
                <div class="grid">
                  ${report.components
                    .filter(c => c.type === 'metric')
                    .map(c => `
                      <div class="metric-card">
                        <div class="metric-label">${c.title}</div>
                        <div class="metric-value">${c.data[0]?.value || 'N/A'}</div>
                      </div>
                    `).join('')}
                </div>
              </div>
            </div>
            
            <div class="footer">
              Generated by Toledo Tool & Die AI Report Generator
            </div>
          </div>
        </body>
      </html>
    `
    
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title.replace(/\s+/g, '-')}-${Date.now()}.html`
    a.click()
    setShowExportMenu(false)
  }

  const exportToJSON = () => {
    if (!report) return
    
    const json = JSON.stringify(report, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title.replace(/\s+/g, '-')}-${Date.now()}.json`
    a.click()
    setShowExportMenu(false)
  }

  const samplePrompts = [
    "Create a comprehensive efficiency analysis for all machines this week",
    "Show me shift performance comparison with quality metrics",
    "Generate a downtime root cause analysis report",
    "Build a manning and attendance report for all shifts",
    "Create an operator performance scorecard with hours worked",
    "Show staffing coverage analysis with overtime trends"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Report Generator</h1>
                <p className="text-sm text-gray-600">Create custom dashboards with natural language</p>
              </div>
            </div>
            {report && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setReport(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>New Report</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exportLoading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                  >
                    {exportLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Export</span>
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={exportToPDF}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium">Export as PDF</div>
                          <div className="text-xs text-gray-500">Full report with charts</div>
                        </div>
                      </button>
                      <button
                        onClick={exportToExcel}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium">Export as Excel</div>
                          <div className="text-xs text-gray-500">Data in spreadsheet format</div>
                        </div>
                      </button>
                      <button
                        onClick={exportToPNG}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                      >
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Export as Image</div>
                          <div className="text-xs text-gray-500">High-quality PNG</div>
                        </div>
                      </button>
                      <button
                        onClick={exportToHTML}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="font-medium">Export as HTML</div>
                          <div className="text-xs text-gray-500">Styled web page</div>
                        </div>
                      </button>
                      <button
                        onClick={exportToJSON}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center space-x-3 transition-colors"
                      >
                        <FileJson className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-medium">Export as JSON</div>
                          <div className="text-xs text-gray-500">Raw data format</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!report ? (
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What report would you like to generate?
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && generateReport()}
                placeholder="e.g., Show me machine efficiency trends with downtime analysis for the past week"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                disabled={loading}
              />
              <button
                onClick={generateReport}
                disabled={loading || !prompt.trim()}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Sample Prompts */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Try these examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {samplePrompts.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(sample)}
                  className="text-left p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg hover:from-orange-50 hover:to-orange-100 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{sample}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8" ref={reportRef}>
          {/* Report Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{report.title}</h2>
            <p className="text-gray-600 mt-2">{report.description}</p>
            <p className="text-sm text-gray-500 mt-2">Generated: {report.timestamp}</p>
          </div>

          {/* Dynamic Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {report.components.map((component, i) => renderChart(component, i))}
          </div>

          {/* Insights & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-3">
                {report.insights.map((insight, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}