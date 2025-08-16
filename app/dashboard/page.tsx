'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { ProductionData, AIInsight } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Activity, TrendingUp, AlertCircle, CheckCircle, Factory, Users, Package, Clock } from 'lucide-react'
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

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time subscription (optional - will work without it)
    let subscription: any = null
    
    try {
      subscription = supabase
        .channel('production_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'production_data' }, () => {
          fetchDashboardData()
        })
        .subscribe()
    } catch (error) {
      // Silently fail - real-time is optional
      console.log('Real-time connection not established - using manual refresh')
    }

    // Refresh data every 30 seconds as fallback
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
      clearInterval(interval)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch production data from last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: productionData, error } = await supabase
        .from('production_data')
        .select(`
          *,
          machines!inner(machine_number, machine_name),
          shifts!inner(shift_name)
        `)
        .gte('date', sevenDaysAgo.toISOString())
        .order('date', { ascending: false })

      if (error) throw error

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
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Factory className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading production metrics...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#f97316', '#64748b', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6']

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time manufacturing metrics and insights</p>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalCycles)}</div>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <TrendingUp className={`h-4 w-4 ${getEfficiencyColor(metrics.averageEfficiency)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(metrics.averageEfficiency)}`}>
              {formatPercent(metrics.averageEfficiency)}
            </div>
            <p className="text-xs text-gray-500">All machines</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good Parts</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalGoodParts)}</div>
            <p className="text-xs text-gray-500">
              {formatPercent((metrics.totalGoodParts / (metrics.totalGoodParts + metrics.totalScrapParts)) * 100)} yield
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className={`h-4 w-4 ${metrics.alerts > 0 ? 'text-red-600' : 'text-green-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.alerts}</div>
            <p className="text-xs text-gray-500">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
            <Factory className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeMachines}</div>
            <p className="text-xs text-gray-500">Reporting data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shifts Completed</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.shiftsCompleted}</div>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scrap Parts</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalScrapParts)}</div>
            <p className="text-xs text-gray-500">
              {formatPercent((metrics.totalScrapParts / (metrics.totalGoodParts + metrics.totalScrapParts)) * 100)} rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Downtime</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.averageDowntime)}</div>
            <p className="text-xs text-gray-500">Minutes per shift</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Trend</CardTitle>
            <CardDescription>Daily average efficiency over the past week</CardDescription>
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
            <CardDescription>Daily production cycles and parts</CardDescription>
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
                <Bar dataKey="goodParts" fill="#10b981" name="Good Parts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Machine Performance</CardTitle>
            <CardDescription>Efficiency by machine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={machineData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 120]} />
                <YAxis dataKey="machine" type="category" />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#2563eb" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                        'bg-green-100 text-green-700'
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
            <CardDescription>Latest production entries</CardDescription>
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
    </div>
  )
}