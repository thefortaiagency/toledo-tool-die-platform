'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts'
import { Download, TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Activity } from 'lucide-react'

interface PioneerScrapData {
  id: string
  part_number: string
  operation: string
  quantity: number
  unit_cost: number
  extended_cost: number
  workcenter: string
  month: string
  source_sheet: string
}

interface MonthlyTrend {
  month: string
  quantity: number
  cost: number
  parts: number
}

interface OperationAnalysis {
  operation: string
  quantity: number
  cost: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316']

export default function PioneerScrapReport() {
  const [data, setData] = useState<PioneerScrapData[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [operationAnalysis, setOperationAnalysis] = useState<OperationAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedWorkcenter, setSelectedWorkcenter] = useState<string>('all')

  const [totalMetrics, setTotalMetrics] = useState({
    totalQuantity: 0,
    totalCost: 0,
    uniqueParts: 0,
    avgCostPerUnit: 0
  })

  useEffect(() => {
    fetchPioneerData()
  }, [selectedMonth, selectedWorkcenter])

  const fetchPioneerData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        source: 'Pioneer',
        ...(selectedMonth !== 'all' && { month: selectedMonth }),
        ...(selectedWorkcenter !== 'all' && { workcenter: selectedWorkcenter })
      })

      const response = await fetch(`/api/scrap/analysis?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setMonthlyTrends(result.monthlyTrends || [])
        setOperationAnalysis(result.operationAnalysis || [])
        
        // Calculate metrics
        const totalQuantity = result.data.reduce((sum: number, item: PioneerScrapData) => sum + item.quantity, 0)
        const totalCost = result.data.reduce((sum: number, item: PioneerScrapData) => sum + item.extended_cost, 0)
        const uniqueParts = new Set(result.data.map((item: PioneerScrapData) => item.part_number)).size
        
        setTotalMetrics({
          totalQuantity,
          totalCost,
          uniqueParts,
          avgCostPerUnit: totalQuantity > 0 ? totalCost / totalQuantity : 0
        })
      }
    } catch (error) {
      console.error('Error fetching Pioneer scrap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Part Number', 'Operation', 'Quantity', 'Unit Cost', 'Extended Cost', 'Workcenter', 'Month']
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.part_number,
        row.operation,
        row.quantity,
        row.unit_cost,
        row.extended_cost,
        row.workcenter,
        row.month
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pioneer-scrap-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('en-US').format(Math.round(value))

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Get unique months and workcenters for filters
  const uniqueMonths = [...new Set(data.map(item => item.month))].sort()
  const uniqueWorkcenters = [...new Set(data.map(item => item.workcenter))].filter(Boolean).sort()

  // Top scrapped parts
  const topScrapParts = data
    .reduce((acc, item) => {
      const existing = acc.find(p => p.part_number === item.part_number)
      if (existing) {
        existing.quantity += item.quantity
        existing.cost += item.extended_cost
      } else {
        acc.push({
          part_number: item.part_number,
          quantity: item.quantity,
          cost: item.extended_cost
        })
      }
      return acc
    }, [] as { part_number: string; quantity: number; cost: number }[])
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pioneer Scrap Analysis</h1>
          <p className="text-gray-600 mt-2">Detailed scrap analysis for Pioneer operations</p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {uniqueMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Workcenter</label>
            <Select value={selectedWorkcenter} onValueChange={setSelectedWorkcenter}>
              <SelectTrigger>
                <SelectValue placeholder="Select workcenter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workcenters</SelectItem>
                {uniqueWorkcenters.map(wc => (
                  <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scrap Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalMetrics.totalQuantity)}</div>
            <p className="text-xs text-muted-foreground">pieces scrapped</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMetrics.totalCost)}</div>
            <p className="text-xs text-muted-foreground">scrap value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Parts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.uniqueParts}</div>
            <p className="text-xs text-muted-foreground">different parts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Unit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMetrics.avgCostPerUnit)}</div>
            <p className="text-xs text-muted-foreground">per scrapped piece</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="operations">By Operation</TabsTrigger>
          <TabsTrigger value="parts">Top Parts</TabsTrigger>
          <TabsTrigger value="workcenters">Workcenters</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Scrap Trends</CardTitle>
              <CardDescription>Pioneer scrap quantity and cost over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'quantity' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                      name === 'quantity' ? 'Quantity' : 'Cost'
                    ]}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="quantity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Quantity" />
                  <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} name="Cost" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scrap by Operation</CardTitle>
              <CardDescription>Pioneer scrap analysis grouped by operation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={operationAnalysis} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="operation" type="category" width={100} />
                  <Tooltip formatter={(value, name) => [
                    name === 'quantity' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                    name === 'quantity' ? 'Quantity' : 'Cost'
                  ]} />
                  <Legend />
                  <Bar dataKey="quantity" fill="#3b82f6" name="Quantity" />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Scrapped Parts</CardTitle>
              <CardDescription>Parts with highest scrap cost in Pioneer operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topScrapParts.map((part, index) => (
                  <div key={part.part_number} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{part.part_number}</p>
                        <p className="text-sm text-gray-600">{formatNumber(part.quantity)} pieces</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(part.cost)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(part.cost / part.quantity)}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workcenters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scrap by Workcenter</CardTitle>
              <CardDescription>Pioneer scrap distribution across workcenters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={uniqueWorkcenters.map(wc => {
                      const wcData = data.filter(item => item.workcenter === wc)
                      return {
                        name: wc || 'Unknown',
                        value: wcData.reduce((sum, item) => sum + item.extended_cost, 0),
                        count: wcData.length
                      }
                    })}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(1)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {uniqueWorkcenters.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}