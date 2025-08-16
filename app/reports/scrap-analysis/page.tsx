'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Upload, Download, TrendingUp, TrendingDown, AlertTriangle, Package, Factory, DollarSign, Calendar, Search } from 'lucide-react'
import { formatNumber, formatPercent } from '@/lib/utils'

interface ScrapSummary {
  totalScrap: number
  totalCost: number
  totalRecords: number
  dateRange: {
    start: string
    end: string
  }
}

interface ReasonData {
  reason: string
  quantity: number
  cost: number
  occurrences: number
  uniqueParts: number
  percentage: string
}

interface WorkcenterData {
  workcenter: string
  quantity: number
  cost: number
  records: number
}

interface PartData {
  partNumber: string
  revision: string
  quantity: number
  cost: number
  operationCount: number
  reasonCount: number
}

interface TrendData {
  month: string
  quantity: number
  cost: number
  records: number
}

interface Insight {
  type: 'critical' | 'warning' | 'info' | 'alert' | 'success'
  title: string
  description: string
  action: string
}

export default function ScrapAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<ScrapSummary | null>(null)
  const [topReasons, setTopReasons] = useState<ReasonData[]>([])
  const [workcenterSummary, setWorkcenterSummary] = useState<WorkcenterData[]>([])
  const [topParts, setTopParts] = useState<PartData[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<TrendData[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  
  // Filters
  const [selectedWorkcenter, setSelectedWorkcenter] = useState<string>('')
  const [partNumberFilter, setPartNumberFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().slice(0, 7),
    end: new Date().toISOString().slice(0, 7)
  })

  useEffect(() => {
    fetchScrapData()
  }, [selectedWorkcenter, partNumberFilter, dateRange])

  const fetchScrapData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)
      if (selectedWorkcenter) params.append('workcenter', selectedWorkcenter)
      if (partNumberFilter) params.append('partNumber', partNumberFilter)
      
      const response = await fetch(`/api/scrap/analysis?${params}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('Error fetching scrap data:', data.error)
        return
      }
      
      setSummary(data.summary)
      setTopReasons(data.topReasons || [])
      setWorkcenterSummary(data.workcenterSummary || [])
      setTopParts(data.topParts || [])
      setMonthlyTrend(data.monthlyTrends || [])
      setInsights(data.insights || [])
    } catch (error) {
      console.error('Error fetching scrap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/scrap/import', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(result.message)
        fetchScrapData()
      } else {
        alert('Failed to import file: ' + result.error)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Part Number', 'Revision', 'Quantity', 'Reason Code', 'Workcenter', 'Operation']
    const rows = topParts.map(part => [
      part.partNumber,
      part.revision,
      part.quantity,
      part.reasonCount,
      '-',
      part.operationCount
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scrap-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const COLORS = ['#f97316', '#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6']

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <TrendingUp className="w-5 h-5 text-orange-500" />
      case 'success':
        return <TrendingDown className="w-5 h-5 text-green-500" />
      default:
        return <Package className="w-5 h-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Factory className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading scrap analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scrap Analysis</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive scrap tracking and efficiency analysis
          </p>
        </div>
        <div className="flex gap-3">
          <label className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button 
              variant="outline" 
              className="cursor-pointer"
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Import Excel'}
            </Button>
          </label>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Month</label>
              <Input
                type="month"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Month</label>
              <Input
                type="month"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Workcenter</label>
              <Select value={selectedWorkcenter} onValueChange={setSelectedWorkcenter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Workcenters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Workcenters</SelectItem>
                  {workcenterSummary.map(wc => (
                    <SelectItem key={wc.workcenter} value={wc.workcenter}>
                      {wc.workcenter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Part Number</label>
              <Input
                placeholder="Search part number..."
                value={partNumberFilter}
                onChange={(e) => setPartNumberFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scrap</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary?.totalScrap || 0)}
            </div>
            <p className="text-xs text-gray-500">Units scrapped</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatNumber(summary?.totalCost || 0)}
            </div>
            <p className="text-xs text-gray-500">Extended cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary?.totalRecords || 0)}
            </div>
            <p className="text-xs text-gray-500">
              {summary?.dateRange.start} to {summary?.dateRange.end}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Record</CardTitle>
            <Factory className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(Math.round((summary?.totalScrap || 0) / (summary?.totalRecords || 1)))}
            </div>
            <p className="text-xs text-gray-500">Units/record</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>AI-generated insights from scrap data analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    <p className="text-sm text-blue-600 mt-1">→ {insight.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Scrap Trend</CardTitle>
            <CardDescription>Scrap quantity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="quantity" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Scrap Quantity"
                  dot={{ fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Reasons Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Scrap Reasons</CardTitle>
            <CardDescription>Distribution by reason code</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topReasons.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="quantity"
                >
                  {topReasons.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workcenter Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Scrap by Workcenter</CardTitle>
            <CardDescription>Total scrap quantity by workcenter</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workcenterSummary.slice(0, 10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="workcenter" type="category" width={100} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Bar dataKey="quantity" fill="#f97316" name="Scrap Quantity" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Scrapped Parts</CardTitle>
            <CardDescription>Parts with highest scrap quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {topParts.slice(0, 10).map((part, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {part.partNumber}
                      {part.revision && <span className="text-gray-500 ml-1">Rev {part.revision}</span>}
                    </p>
                    <p className="text-xs text-gray-600">
                      {part.operationCount} operations • {part.reasonCount} reasons
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatNumber(part.quantity)}</p>
                    <p className="text-xs text-gray-600">units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reason Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reason Analysis</CardTitle>
          <CardDescription>Complete breakdown of scrap reasons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Reason Code</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">%</th>
                  <th className="text-right py-2">Occurrences</th>
                  <th className="text-right py-2">Unique Parts</th>
                  <th className="text-right py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {topReasons.map((reason, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{reason.reason}</td>
                    <td className="text-right">{formatNumber(reason.quantity)}</td>
                    <td className="text-right">{reason.percentage}%</td>
                    <td className="text-right">{formatNumber(reason.occurrences)}</td>
                    <td className="text-right">{reason.uniqueParts}</td>
                    <td className="text-right">${formatNumber(reason.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}