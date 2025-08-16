'use client'

import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, BarChart3, Activity } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface MachineDetailModalProps {
  machine: any
  onClose: () => void
  allWeeksData: any[]
}

export default function MachineDetailModal({ machine, onClose, allWeeksData }: MachineDetailModalProps) {
  if (!machine) return null

  // Calculate statistics across all weeks for this machine
  const machineHistory = allWeeksData.map(week => {
    const machineData = week.machines.find((m: any) => m.machineId === machine.machineId)
    return {
      week: week.weekStart,
      efficiency: machineData?.weeklyPerformance || 0,
      hits: machineData?.weeklyHits || 0,
      hours: machineData?.weeklyHours || 0,
      shift1: machineData?.shiftTotals.first.efficiency || 0,
      shift2: machineData?.shiftTotals.second.efficiency || 0,
      shift3: machineData?.shiftTotals.third.efficiency || 0
    }
  })

  // Calculate shift performance distribution
  const shiftPerformance = [
    { name: '3rd Shift', value: machine.shiftTotals.third.efficiency * 100, color: '#f59e0b' },
    { name: '1st Shift', value: machine.shiftTotals.first.efficiency * 100, color: '#10b981' },
    { name: '2nd Shift', value: machine.shiftTotals.second.efficiency * 100, color: '#3b82f6' }
  ]

  // Daily performance for current week
  const dailyPerformance = machine.days.map((day: any) => ({
    day: day.dayName.slice(0, 3),
    efficiency: day.dailyEfficiency * 100,
    hits: day.dailyHits,
    target: machine.target * day.dailyHours
  }))

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600'
    if (efficiency >= 90) return 'text-yellow-600'
    if (efficiency >= 80) return 'text-orange-600'
    return 'text-red-600'
  }

  const avgEfficiency = machine.weeklyPerformance * 100
  const totalHits = machine.weeklyHits
  const totalHours = machine.weeklyHours
  const targetHits = machine.target * totalHours

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{machine.machineName} - Detailed Analysis</h2>
            <p className="text-sm text-gray-600">Target: {machine.target} hits/hour</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-600 font-medium">Weekly Efficiency</span>
                {avgEfficiency >= 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div className={`text-2xl font-bold ${getEfficiencyColor(avgEfficiency)}`}>
                {avgEfficiency.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {avgEfficiency >= 100 ? 'Above target' : `${(100 - avgEfficiency).toFixed(1)}% below target`}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-600 font-medium">Total Hits</span>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalHits.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Target: {targetHits.toLocaleString()}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600 font-medium">Total Hours</span>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalHours}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Utilization: {((totalHours / 168) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-orange-600 font-medium">Best Shift</span>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(() => {
                  const shifts = [
                    { name: '3rd', eff: machine.shiftTotals.third.efficiency },
                    { name: '1st', eff: machine.shiftTotals.first.efficiency },
                    { name: '2nd', eff: machine.shiftTotals.second.efficiency }
                  ]
                  const best = shifts.reduce((a, b) => a.eff > b.eff ? a : b)
                  return best.name
                })()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {(() => {
                  const shifts = [
                    { name: '3rd', eff: machine.shiftTotals.third.efficiency },
                    { name: '1st', eff: machine.shiftTotals.first.efficiency },
                    { name: '2nd', eff: machine.shiftTotals.second.efficiency }
                  ]
                  const best = shifts.reduce((a, b) => a.eff > b.eff ? a : b)
                  return `${(best.eff * 100).toFixed(1)}% efficiency`
                })()}
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-2 gap-6">
            {/* Daily Performance Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Daily Performance This Week</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#f97316" name="Efficiency %" />
                  <Bar dataKey="hits" fill="#3b82f6" name="Hits" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Shift Distribution Pie Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Shift Performance Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={shiftPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${entry.value?.toFixed(1) || 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {shiftPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Trend Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Historical Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={machineHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="efficiency" stroke="#f97316" name="Overall Efficiency" strokeWidth={2} />
                <Line type="monotone" dataKey="shift1" stroke="#10b981" name="1st Shift" />
                <Line type="monotone" dataKey="shift2" stroke="#3b82f6" name="2nd Shift" />
                <Line type="monotone" dataKey="shift3" stroke="#8b5cf6" name="3rd Shift" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Shift Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold p-4 border-b">Shift Details for Current Week</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Shift</th>
                  <th className="px-4 py-2 text-right">Total Hits</th>
                  <th className="px-4 py-2 text-right">Total Hours</th>
                  <th className="px-4 py-2 text-right">Avg/Hour</th>
                  <th className="px-4 py-2 text-right">Efficiency</th>
                  <th className="px-4 py-2 text-right">vs Target</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-medium">3rd Shift</td>
                  <td className="px-4 py-2 text-right">{machine.shiftTotals.third.hits.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{machine.shiftTotals.third.hours}</td>
                  <td className="px-4 py-2 text-right">
                    {machine.shiftTotals.third.hours > 0 
                      ? Math.round(machine.shiftTotals.third.hits / machine.shiftTotals.third.hours)
                      : 0}
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold ${getEfficiencyColor(machine.shiftTotals.third.efficiency * 100)}`}>
                    {(machine.shiftTotals.third.efficiency * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    {machine.shiftTotals.third.efficiency >= 1 ? (
                      <span className="text-green-600">+{((machine.shiftTotals.third.efficiency - 1) * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="text-red-600">{((machine.shiftTotals.third.efficiency - 1) * 100).toFixed(1)}%</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">1st Shift</td>
                  <td className="px-4 py-2 text-right">{machine.shiftTotals.first.hits.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{machine.shiftTotals.first.hours}</td>
                  <td className="px-4 py-2 text-right">
                    {machine.shiftTotals.first.hours > 0 
                      ? Math.round(machine.shiftTotals.first.hits / machine.shiftTotals.first.hours)
                      : 0}
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold ${getEfficiencyColor(machine.shiftTotals.first.efficiency * 100)}`}>
                    {(machine.shiftTotals.first.efficiency * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    {machine.shiftTotals.first.efficiency >= 1 ? (
                      <span className="text-green-600">+{((machine.shiftTotals.first.efficiency - 1) * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="text-red-600">{((machine.shiftTotals.first.efficiency - 1) * 100).toFixed(1)}%</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">2nd Shift</td>
                  <td className="px-4 py-2 text-right">{machine.shiftTotals.second.hits.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{machine.shiftTotals.second.hours}</td>
                  <td className="px-4 py-2 text-right">
                    {machine.shiftTotals.second.hours > 0 
                      ? Math.round(machine.shiftTotals.second.hits / machine.shiftTotals.second.hours)
                      : 0}
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold ${getEfficiencyColor(machine.shiftTotals.second.efficiency * 100)}`}>
                    {(machine.shiftTotals.second.efficiency * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    {machine.shiftTotals.second.efficiency >= 1 ? (
                      <span className="text-green-600">+{((machine.shiftTotals.second.efficiency - 1) * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="text-red-600">{((machine.shiftTotals.second.efficiency - 1) * 100).toFixed(1)}%</span>
                    )}
                  </td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{machine.weeklyHits.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{machine.weeklyHours}</td>
                  <td className="px-4 py-2 text-right">
                    {machine.weeklyHours > 0 
                      ? Math.round(machine.weeklyHits / machine.weeklyHours)
                      : 0}
                  </td>
                  <td className={`px-4 py-2 text-right ${getEfficiencyColor(machine.weeklyPerformance * 100)}`}>
                    {(machine.weeklyPerformance * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    {machine.weeklyPerformance >= 1 ? (
                      <span className="text-green-600">+{((machine.weeklyPerformance - 1) * 100).toFixed(1)}%</span>
                    ) : (
                      <span className="text-red-600">{((machine.weeklyPerformance - 1) * 100).toFixed(1)}%</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}