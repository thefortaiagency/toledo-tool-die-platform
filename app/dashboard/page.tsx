'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { ProductionData, AIInsight } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Activity, TrendingUp, AlertCircle, CheckCircle, Factory, Users, Package, Clock, X } from 'lucide-react'
import { formatNumber, formatPercent, formatDate, getEfficiencyColor, getEfficiencyBgColor } from '@/lib/utils'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalCycles: 0,
    averageEfficiency: 0,
    activeMachines: 0,
    alerts: 0,
    totalGoodParts: 0,
    totalScrapParts: 0,
    averageDowntime: 0,
    shiftsCompleted: 0
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [machineData, setMachineData] = useState<any[]>([])
  const [shiftData, setShiftData] = useState<any[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [recentProduction, setRecentProduction] = useState<any[]>([])
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
    
    // Disable real-time subscription to avoid WebSocket errors
    // Real-time updates are not critical for this dashboard
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch production data from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: productionData, error } = await supabase
        .from('production_data')
        .select(`
          *,
          machines(machine_number),
          shifts(shift_name)
        `)
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: false })

      // Don't throw on error, just log it
      if (error) {
        console.error('Error fetching production data:', error)
        // Continue with empty data rather than throwing
      }

      // Fetch AI insights
      const { data: insightsData } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(5)

      if (productionData && productionData.length > 0) {
        // Calculate metrics
        const totalCycles = productionData.reduce((sum, d) => sum + (d.total_cycles || 0), 0)
        const totalGoodParts = productionData.reduce((sum, d) => sum + (d.good_parts || 0), 0)
        const totalScrapParts = productionData.reduce((sum, d) => sum + (d.scrap_parts || 0), 0)
        const avgEfficiency = productionData.reduce((sum, d) => sum + (d.actual_efficiency || 0), 0) / productionData.length
        const avgDowntime = productionData.reduce((sum, d) => sum + (d.downtime_minutes || 0), 0) / productionData.length
        const uniqueMachines = new Set(productionData.map(d => d.machine_id)).size
        const uniqueShifts = new Set(productionData.map(d => `${d.date}-${d.shift_id}`)).size
        
        setMetrics({
          totalCycles,
          totalGoodParts,
          totalScrapParts,
          averageEfficiency: avgEfficiency,
          averageDowntime: avgDowntime,
          activeMachines: uniqueMachines,
          shiftsCompleted: uniqueShifts,
          alerts: insightsData?.length || 0
        })
        // Prepare daily trend data
        const dailyData = productionData.reduce((acc: any, curr) => {
          const date = new Date(curr.date).toLocaleDateString()
          if (!acc[date]) {
            acc[date] = { 
              date, 
              efficiency: 0, 
              cycles: 0, 
              goodParts: 0,
              scrapParts: 0,
              count: 0 
            }
          }
          acc[date].efficiency += curr.actual_efficiency || 0
          acc[date].cycles += curr.total_cycles || 0
          acc[date].goodParts += curr.good_parts || 0
          acc[date].scrapParts += curr.scrap_parts || 0
          acc[date].count++
          return acc
        }, {})

        const chartData = Object.values(dailyData).map((d: any) => ({
          date: d.date,
          efficiency: parseFloat((d.efficiency / d.count).toFixed(1)),
          cycles: d.cycles,
          goodParts: d.goodParts,
          scrapParts: d.scrapParts,
          scrapRate: parseFloat(((d.scrapParts / (d.goodParts + d.scrapParts)) * 100).toFixed(1))
        })).reverse()

        setChartData(chartData)

        // Prepare machine performance data
        const machinePerformance = productionData.reduce((acc: any, curr) => {
          const machineNumber = curr.machines?.machine_number || 'Unknown'
          if (!acc[machineNumber]) {
            acc[machineNumber] = { 
              machine: machineNumber,
              efficiency: 0,
              cycles: 0,
              downtime: 0,
              count: 0
            }
          }
          acc[machineNumber].efficiency += curr.actual_efficiency || 0
          acc[machineNumber].cycles += curr.total_cycles || 0
          acc[machineNumber].downtime += curr.downtime_minutes || 0
          acc[machineNumber].count++
          return acc
        }, {})

        const machineData = Object.values(machinePerformance).map((m: any) => ({
          machine: m.machine,
          efficiency: parseFloat((m.efficiency / m.count).toFixed(1)),
          cycles: m.cycles,
          downtime: m.downtime
        }))

        setMachineData(machineData)

        // Prepare shift performance data
        const shiftPerformance = productionData.reduce((acc: any, curr) => {
          const shiftName = curr.shifts?.shift_name || 'Unknown'
          if (!acc[shiftName]) {
            acc[shiftName] = { 
              shift: shiftName,
              efficiency: 0,
              production: 0,
              count: 0
            }
          }
          acc[shiftName].efficiency += curr.actual_efficiency || 0
          acc[shiftName].production += curr.good_parts || 0
          acc[shiftName].count++
          return acc
        }, {})

        const shiftData = Object.values(shiftPerformance).map((s: any) => ({
          shift: s.shift,
          efficiency: parseFloat((s.efficiency / s.count).toFixed(1)),
          production: s.production
        }))

        setShiftData(shiftData)

        // Set recent production
        setRecentProduction(productionData.slice(0, 10))

        // Set insights
        if (insightsData) {
          setInsights(insightsData)
        }
      } else {
        // Set default values when no data is available
        setMetrics({
          totalCycles: 0,
          averageEfficiency: 0,
          activeMachines: 0,
          alerts: 0,
          totalGoodParts: 0,
          totalScrapParts: 0,
          averageDowntime: 0,
          shiftsCompleted: 0
        })
        setChartData([])
        setMachineData([])
        setShiftData([])
        setRecentProduction([])
        setInsights([])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMetricClick = async (metricType: string) => {
    setSelectedMetric(metricType)
    setLoading(true)
    
    try {
      // Get 30 days of detailed data for the specific metric
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: productionData, error } = await supabase
        .from('production_data')
        .select(`
          *,
          machines(machine_number),
          shifts(shift_name)
        `)
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: true })

      if (error) throw error

      // Process data based on metric type
      let detailChartData: any[] = []
      let insights: any[] = []

      switch (metricType) {
        case 'cycles':
          // Daily cycle trends
          const cyclesByDay = productionData?.reduce((acc: any, curr) => {
            const date = new Date(curr.date).toLocaleDateString()
            if (!acc[date]) acc[date] = { date, cycles: 0, machines: new Set() }
            acc[date].cycles += curr.total_cycles || 0
            acc[date].machines.add(curr.machines?.machine_number)
            return acc
          }, {})
          
          detailChartData = Object.values(cyclesByDay || {}).map((d: any) => ({
            ...d,
            machineCount: d.machines.size
          }))
          
          insights = [
            { title: 'Peak Day', value: detailChartData.reduce((max: any, day: any) => day.cycles > max.cycles ? day : max, { cycles: 0 }) },
            { title: 'Daily Average', value: Math.round(detailChartData.reduce((sum: number, day: any) => sum + day.cycles, 0) / detailChartData.length) },
            { title: 'Total Days', value: detailChartData.length }
          ]
          break

        case 'efficiency':
          // Daily efficiency trends by machine
          const efficiencyByDay = productionData?.reduce((acc: any, curr) => {
            const date = new Date(curr.date).toLocaleDateString()
            if (!acc[date]) acc[date] = { date, totalEff: 0, count: 0, machines: [] }
            acc[date].totalEff += curr.actual_efficiency || 0
            acc[date].count++
            acc[date].machines.push({ 
              machine: curr.machines?.machine_number, 
              efficiency: curr.actual_efficiency 
            })
            return acc
          }, {})
          
          detailChartData = Object.values(efficiencyByDay || {}).map((d: any) => ({
            date: d.date,
            avgEfficiency: parseFloat((d.totalEff / d.count).toFixed(1)),
            machineCount: d.machines.length,
            bestMachine: d.machines.reduce((best: any, m: any) => m.efficiency > best.efficiency ? m : best, { efficiency: 0 }),
            worstMachine: d.machines.reduce((worst: any, m: any) => m.efficiency < worst.efficiency ? m : worst, { efficiency: 100 })
          }))
          
          insights = [
            { title: 'Best Day', value: detailChartData.reduce((max: any, day: any) => day.avgEfficiency > max.avgEfficiency ? day : max, { avgEfficiency: 0 }) },
            { title: 'Trend', value: detailChartData.length > 1 ? (detailChartData[detailChartData.length - 1].avgEfficiency - detailChartData[0].avgEfficiency > 0 ? 'Improving' : 'Declining') : 'Stable' }
          ]
          break

        case 'goodParts':
          // Daily good parts production
          const goodPartsByDay = productionData?.reduce((acc: any, curr) => {
            const date = new Date(curr.date).toLocaleDateString()
            if (!acc[date]) acc[date] = { date, goodParts: 0, totalParts: 0 }
            acc[date].goodParts += curr.good_parts || 0
            acc[date].totalParts += (curr.good_parts || 0) + (curr.scrap_parts || 0)
            return acc
          }, {})
          
          detailChartData = Object.values(goodPartsByDay || {}).map((d: any) => ({
            date: d.date,
            goodParts: d.goodParts,
            yield: parseFloat(((d.goodParts / d.totalParts) * 100).toFixed(1))
          }))
          
          insights = [
            { title: 'Best Yield Day', value: detailChartData.reduce((max: any, day: any) => day.yield > max.yield ? day : max, { yield: 0 }) },
            { title: 'Worst Yield Day', value: detailChartData.reduce((min: any, day: any) => day.yield < min.yield ? day : min, { yield: 100 }) }
          ]
          break

        case 'scrapParts':
          // Daily scrap parts analysis
          const scrapByDay = productionData?.reduce((acc: any, curr) => {
            const date = new Date(curr.date).toLocaleDateString()
            if (!acc[date]) acc[date] = { date, scrapParts: 0, totalParts: 0, machines: [] }
            acc[date].scrapParts += curr.scrap_parts || 0
            acc[date].totalParts += (curr.good_parts || 0) + (curr.scrap_parts || 0)
            acc[date].machines.push({
              machine: curr.machines?.machine_number,
              scrapParts: curr.scrap_parts || 0
            })
            return acc
          }, {})
          
          detailChartData = Object.values(scrapByDay || {}).map((d: any) => ({
            date: d.date,
            scrapParts: d.scrapParts,
            scrapRate: parseFloat(((d.scrapParts / d.totalParts) * 100).toFixed(1)),
            worstMachine: d.machines.reduce((worst: any, m: any) => m.scrapParts > worst.scrapParts ? m : worst, { scrapParts: 0 })
          }))
          
          insights = [
            { title: 'Worst Scrap Day', value: detailChartData.reduce((max: any, day: any) => day.scrapParts > max.scrapParts ? day : max, { scrapParts: 0 }) },
            { title: 'Best Scrap Day', value: detailChartData.reduce((min: any, day: any) => day.scrapParts < min.scrapParts ? day : min, { scrapParts: 10000 }) },
            { title: 'Avg Scrap Rate', value: `${(detailChartData.reduce((sum: number, day: any) => sum + day.scrapRate, 0) / detailChartData.length).toFixed(1)}%` }
          ]
          break

        case 'downtime':
          // Daily downtime by machine
          const downtimeByDay = productionData?.reduce((acc: any, curr) => {
            const date = new Date(curr.date).toLocaleDateString()
            if (!acc[date]) acc[date] = { date, totalDowntime: 0, machines: [] }
            acc[date].totalDowntime += curr.downtime_minutes || 0
            acc[date].machines.push({ 
              machine: curr.machines?.machine_number, 
              downtime: curr.downtime_minutes || 0 
            })
            return acc
          }, {})
          
          detailChartData = Object.values(downtimeByDay || {}).map((d: any) => ({
            date: d.date,
            totalDowntime: d.totalDowntime,
            avgDowntime: parseFloat((d.totalDowntime / d.machines.length).toFixed(1)),
            worstMachine: d.machines.reduce((worst: any, m: any) => m.downtime > worst.downtime ? m : worst, { downtime: 0 })
          }))
          
          insights = [
            { title: 'Worst Day', value: detailChartData.reduce((max: any, day: any) => day.totalDowntime > max.totalDowntime ? day : max, { totalDowntime: 0 }) },
            { title: 'Best Day', value: detailChartData.reduce((min: any, day: any) => day.totalDowntime < min.totalDowntime ? day : min, { totalDowntime: 1000 }) }
          ]
          break

        default:
          detailChartData = []
          insights = []
      }

      setDetailData({
        type: metricType,
        chartData: detailChartData,
        insights: insights
      })

    } catch (error) {
      console.error('Error fetching metric details:', error)
    } finally {
      setLoading(false)
    }
  }

  const closeDetailView = () => {
    setSelectedMetric(null)
    setDetailData(null)
  }

  if (loading && !selectedMetric) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Factory className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading production metrics...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#f97316', '#64748b', '#0ea5e9', '#fb923c', '#f59e0b', '#8b5cf6']

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
        <p className="text-gray-600 mt-2">Manufacturing metrics from the last 7 days</p>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => handleMetricClick('cycles')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalCycles)}</div>
            <p className="text-xs text-gray-500">Last 30 days • Click for details</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => handleMetricClick('efficiency')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <TrendingUp className={`h-4 w-4 ${getEfficiencyColor(metrics.averageEfficiency)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(metrics.averageEfficiency)}`}>
              {formatPercent(metrics.averageEfficiency)}
            </div>
            <p className="text-xs text-gray-500">Last 30 days avg • Click for details</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => handleMetricClick('goodParts')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good Parts</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalGoodParts)}</div>
            <p className="text-xs text-gray-500">
              Last 30 days • {formatPercent((metrics.totalGoodParts / (metrics.totalGoodParts + metrics.totalScrapParts)) * 100)} yield • Click for details
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => handleMetricClick('scrapParts')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scrap Parts</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalScrapParts)}</div>
            <p className="text-xs text-gray-500">
              Last 30 days • {formatPercent((metrics.totalScrapParts / (metrics.totalGoodParts + metrics.totalScrapParts)) * 100)} rate • Click for details
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => handleMetricClick('downtime')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Downtime</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.averageDowntime)}m</div>
            <p className="text-xs text-gray-500">Last 30 days avg • Click for details</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Trend</CardTitle>
            <CardDescription>Daily average efficiency (Last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 120]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Efficiency %" 
                  dot={{ fill: '#2563eb' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scrapRate" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  name="Scrap Rate %" 
                  dot={{ fill: '#dc2626' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Production Volume</CardTitle>
            <CardDescription>Daily production cycles and parts (Last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cycles" fill="#1a1a1a" name="Total Cycles" />
                <Bar dataKey="goodParts" fill="#f97316" name="Good Parts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <Card>
          <CardHeader>
            <CardTitle>Shift Distribution</CardTitle>
            <CardDescription>Production by shift</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={shiftData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ shift, production }) => `${shift}: ${formatNumber(production)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="production"
                >
                  {shiftData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Machine Downtime</CardTitle>
            <CardDescription>Total minutes by machine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {machineData.slice(0, 5).map((machine) => (
                <div key={machine.machine} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{machine.machine}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${Math.min((machine.downtime / 500) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{machine.downtime}m</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Anomalies and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{insight.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        {insight.recommendation && (
                          <p className="text-xs text-blue-600 mt-1">→ {insight.recommendation}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        insight.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        insight.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {insight.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active insights</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Production</CardTitle>
            <CardDescription>Most recent production records (Last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentProduction.slice(0, 5).map((prod) => (
                <div key={prod.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Machine {prod.machines?.machine_number} - {prod.shifts?.shift_name} Shift
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(prod.date)} • {formatNumber(prod.total_cycles)} cycles
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${getEfficiencyColor(prod.actual_efficiency || 0)}`}>
                      {formatPercent(prod.actual_efficiency || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedMetric && detailData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {detailData.type === 'cycles' && 'Total Cycles - 30 Day Analysis'}
                {detailData.type === 'efficiency' && 'Efficiency Trends - 30 Day Analysis'}
                {detailData.type === 'goodParts' && 'Good Parts Production - 30 Day Analysis'}
                {detailData.type === 'scrapParts' && 'Scrap Parts Analysis - 30 Day Analysis'}
                {detailData.type === 'downtime' && 'Downtime Analysis - 30 Day Analysis'}
              </h2>
              <button
                onClick={closeDetailView}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {detailData.insights.map((insight: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                    <div className="text-lg font-bold text-orange-600">
                      {typeof insight.value === 'object' 
                        ? `${insight.value.date}: ${
                            detailData.type === 'cycles' ? formatNumber(insight.value.cycles) :
                            detailData.type === 'efficiency' ? `${insight.value.avgEfficiency}%` :
                            detailData.type === 'goodParts' ? `${insight.value.yield}%` :
                            detailData.type === 'scrapParts' ? formatNumber(insight.value.scrapParts) :
                            `${insight.value.totalDowntime}m`
                          }`
                        : insight.value
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Trend</h3>
                {detailData.type === 'cycles' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={detailData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Cycles']} />
                      <Bar dataKey="cycles" fill="#f97316" name="Daily Cycles" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {detailData.type === 'efficiency' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={detailData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${Number(value)}%`, 'Efficiency']} />
                      <Line type="monotone" dataKey="avgEfficiency" stroke="#2563eb" strokeWidth={2} name="Average Efficiency" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {detailData.type === 'goodParts' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={detailData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="goodParts" stroke="#10b981" strokeWidth={2} name="Good Parts" />
                      <Line type="monotone" dataKey="yield" stroke="#ef4444" strokeWidth={2} name="Yield %" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {detailData.type === 'scrapParts' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={detailData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Scrap Parts']} />
                      <Bar dataKey="scrapParts" fill="#dc2626" name="Daily Scrap Parts" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {detailData.type === 'downtime' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={detailData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value)} minutes`, 'Downtime']} />
                      <Bar dataKey="totalDowntime" fill="#dc2626" name="Total Downtime" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Additional Details Table */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Date</th>
                        {detailData.type === 'cycles' && (
                          <>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Total Cycles</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Active Machines</th>
                          </>
                        )}
                        {detailData.type === 'efficiency' && (
                          <>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Avg Efficiency</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Best Machine</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Worst Machine</th>
                          </>
                        )}
                        {detailData.type === 'goodParts' && (
                          <>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Good Parts</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Yield %</th>
                          </>
                        )}
                        {detailData.type === 'scrapParts' && (
                          <>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Scrap Parts</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Scrap Rate %</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Worst Machine</th>
                          </>
                        )}
                        {detailData.type === 'downtime' && (
                          <>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Total Downtime</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Avg Per Machine</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Worst Machine</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detailData.chartData.slice(0, 10).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{row.date}</td>
                          {detailData.type === 'cycles' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(row.cycles)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.machineCount}</td>
                            </>
                          )}
                          {detailData.type === 'efficiency' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.avgEfficiency}%</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.bestMachine.machine} ({row.bestMachine.efficiency}%)</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.worstMachine.machine} ({row.worstMachine.efficiency}%)</td>
                            </>
                          )}
                          {detailData.type === 'goodParts' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(row.goodParts)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.yield}%</td>
                            </>
                          )}
                          {detailData.type === 'scrapParts' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(row.scrapParts)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.scrapRate}%</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.worstMachine.machine} ({row.worstMachine.scrapParts})</td>
                            </>
                          )}
                          {detailData.type === 'downtime' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.totalDowntime}m</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.avgDowntime}m</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.worstMachine.machine} ({row.worstMachine.downtime}m)</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}