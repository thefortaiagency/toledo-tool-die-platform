'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, UserX, Clock, TrendingUp, Calendar, AlertCircle, CheckCircle, Timer } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ManningData {
  date: string
  shift_name: string
  operators_scheduled: number
  operators_present: number
  operators_absent: number
  temp_operators: number
  overtime_hours: number
  attendance_rate: number
  manning_status: string
  attendance_notes: string
  actual_efficiency: number
  machine_number: string
}

export default function ManningReport() {
  const [manningData, setManningData] = useState<ManningData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7') // days
  const [selectedShift, setSelectedShift] = useState('all')
  const [shifts, setShifts] = useState<any[]>([])

  useEffect(() => {
    loadManningData()
    loadShifts()
  }, [dateRange, selectedShift])

  const loadShifts = async () => {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .order('shift_name')
    if (data) setShifts(data)
  }

  const loadManningData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('production_data')
        .select(`
          date,
          operators_scheduled,
          operators_present,
          operators_absent,
          temp_operators,
          overtime_hours,
          attendance_rate,
          manning_status,
          attendance_notes,
          actual_efficiency,
          shifts!inner(shift_name),
          machines!inner(machine_number)
        `)
        .gte('date', new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (selectedShift !== 'all') {
        query = query.eq('shifts.shift_name', selectedShift)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedData = data?.map((record: any) => ({
        date: record.date,
        shift_name: record.shifts.shift_name,
        operators_scheduled: record.operators_scheduled || 0,
        operators_present: record.operators_present || 0,
        operators_absent: record.operators_absent || 0,
        temp_operators: record.temp_operators || 0,
        overtime_hours: record.overtime_hours || 0,
        attendance_rate: record.attendance_rate || (record.operators_scheduled > 0 ? (record.operators_present / record.operators_scheduled) * 100 : 0),
        manning_status: record.manning_status || 'Unknown',
        attendance_notes: record.attendance_notes || '',
        actual_efficiency: record.actual_efficiency || 0,
        machine_number: record.machines.machine_number
      })) || []

      setManningData(formattedData)
    } catch (error) {
      console.error('Error loading manning data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary statistics
  const summaryStats = {
    totalRecords: manningData.length,
    avgAttendanceRate: manningData.length > 0 ? manningData.reduce((sum, d) => sum + d.attendance_rate, 0) / manningData.length : 0,
    totalOvertimeHours: manningData.reduce((sum, d) => sum + d.overtime_hours, 0),
    totalTempOperators: manningData.reduce((sum, d) => sum + d.temp_operators, 0),
    avgEfficiency: manningData.length > 0 ? manningData.reduce((sum, d) => sum + d.actual_efficiency, 0) / manningData.length : 0
  }

  // Group data by date for trend charts
  const dailyTrends = manningData.reduce((acc: any, record) => {
    if (!acc[record.date]) {
      acc[record.date] = {
        date: record.date,
        attendance_rate: 0,
        overtime_hours: 0,
        temp_operators: 0,
        efficiency: 0,
        count: 0
      }
    }
    acc[record.date].attendance_rate += record.attendance_rate
    acc[record.date].overtime_hours += record.overtime_hours
    acc[record.date].temp_operators += record.temp_operators
    acc[record.date].efficiency += record.actual_efficiency
    acc[record.date].count++
    return acc
  }, {})

  const trendData = Object.values(dailyTrends).map((day: any) => ({
    date: new Date(day.date).toLocaleDateString(),
    attendance_rate: (day.attendance_rate / day.count).toFixed(1),
    overtime_hours: day.overtime_hours.toFixed(1),
    temp_operators: day.temp_operators,
    efficiency: (day.efficiency / day.count).toFixed(1)
  }))

  // Manning status distribution
  const statusCounts = manningData.reduce((acc: any, record) => {
    acc[record.manning_status] = (acc[record.manning_status] || 0) + 1
    return acc
  }, {})

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: ((count as number / manningData.length) * 100).toFixed(1)
  }))

  // Shift comparison data
  const shiftComparison = manningData.reduce((acc: any, record) => {
    if (!acc[record.shift_name]) {
      acc[record.shift_name] = {
        shift: record.shift_name,
        attendance_rate: 0,
        overtime_hours: 0,
        temp_operators: 0,
        efficiency: 0,
        count: 0
      }
    }
    acc[record.shift_name].attendance_rate += record.attendance_rate
    acc[record.shift_name].overtime_hours += record.overtime_hours
    acc[record.shift_name].temp_operators += record.temp_operators
    acc[record.shift_name].efficiency += record.actual_efficiency
    acc[record.shift_name].count++
    return acc
  }, {})

  const shiftData = Object.values(shiftComparison).map((shift: any) => ({
    shift: shift.shift,
    attendance_rate: (shift.attendance_rate / shift.count).toFixed(1),
    overtime_hours: shift.overtime_hours.toFixed(1),
    temp_operators: shift.temp_operators,
    efficiency: (shift.efficiency / shift.count).toFixed(1)
  }))

  const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#eab308']

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 mr-3 text-orange-600" />
          Manning & Attendance Report
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Track operator attendance, coverage, and staffing trends
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Shifts</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.shift_name}>
                  {shift.shift_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Attendance Rate</p>
                    <p className={`text-2xl font-bold ${
                      summaryStats.avgAttendanceRate >= 95 ? 'text-green-600' :
                      summaryStats.avgAttendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {summaryStats.avgAttendanceRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Overtime Hours</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summaryStats.totalOvertimeHours.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Temp Operators Used</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summaryStats.totalTempOperators}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                    <p className={`text-2xl font-bold ${
                      summaryStats.avgEfficiency >= 90 ? 'text-green-600' :
                      summaryStats.avgEfficiency >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {summaryStats.avgEfficiency.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance_rate" stroke="#10b981" name="Attendance Rate %" strokeWidth={2} />
                    <Line type="monotone" dataKey="efficiency" stroke="#f97316" name="Efficiency %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Manning Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Manning Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Shift Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Shift Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={shiftData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shift" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendance_rate" fill="#10b981" name="Attendance Rate %" />
                    <Bar dataKey="efficiency" fill="#f97316" name="Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overtime Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Overtime & Temp Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="overtime_hours" fill="#8b5cf6" name="Overtime Hours" />
                    <Bar dataKey="temp_operators" fill="#ef4444" name="Temp Operators" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Manning Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled/Present</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {manningData.slice(0, 20).map((record, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.shift_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.machine_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.operators_present}/{record.operators_scheduled}
                          {record.temp_operators > 0 && (
                            <span className="ml-2 text-orange-600">+{record.temp_operators} temp</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.attendance_rate >= 95 ? 'bg-green-100 text-green-800' :
                            record.attendance_rate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.attendance_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.overtime_hours > 0 ? `${record.overtime_hours}h` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.manning_status === 'Have' ? 'bg-green-100 text-green-800' :
                            record.manning_status === 'Need' ? 'bg-red-100 text-red-800' :
                            record.manning_status === 'Call-in' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.manning_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {record.attendance_notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {manningData.length > 20 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing first 20 of {manningData.length} records
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}