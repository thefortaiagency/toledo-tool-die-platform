'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Download, Share2, RefreshCw, Maximize2 } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts'

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

  const exportReport = () => {
    if (!report) return
    
    // Create a simple HTML export
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #f97316; }
            .insight { background: #fef3c7; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .recommendation { background: #dbeafe; padding: 10px; margin: 10px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>${report.title}</h1>
          <p>${report.description}</p>
          <p>Generated: ${report.timestamp}</p>
          
          <h2>Key Insights</h2>
          ${report.insights.map(i => `<div class="insight">• ${i}</div>`).join('')}
          
          <h2>Recommendations</h2>
          ${report.recommendations.map(r => `<div class="recommendation">• ${r}</div>`).join('')}
        </body>
      </html>
    `
    
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${Date.now()}.html`
    a.click()
  }

  const samplePrompts = [
    "Create a comprehensive efficiency analysis for all machines this week",
    "Show me shift performance comparison with quality metrics",
    "Generate a downtime root cause analysis report",
    "Build a safety incident dashboard for the last 30 days",
    "Create an operator performance scorecard",
    "Show production targets vs actuals with trend analysis"
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
                <button
                  onClick={exportReport}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
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