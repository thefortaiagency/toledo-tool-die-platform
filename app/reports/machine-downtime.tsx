'use client'

import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts'
import { Clock, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Wrench } from 'lucide-react'
import { machineDowntimeData, maintenanceBreakdown } from '../data/pioneer-metrics'

export default function MachineDowntimeAnalysis() {
  const [selectedMachine, setSelectedMachine] = useState('all')
  const [viewMode, setViewMode] = useState<'cost' | 'hours'>('cost')
  
  // Calculate total downtime costs and hours
  const totalDowntime2024Cost = machineDowntimeData.reduce((sum, m) => sum + m.actual2024Cost, 0)
  const totalDowntime2024Hours = machineDowntimeData.reduce((sum, m) => sum + m.actual2024Hours, 0)
  const totalDowntimeYTDCost = machineDowntimeData.reduce((sum, m) => sum + m.quarterlyCost.q1.actual + m.quarterlyCost.q2.actual, 0)
  const totalDowntimeTargetCost = machineDowntimeData.reduce((sum, m) => sum + (m.quarterlyCost.q1.target + m.quarterlyCost.q2.target), 0)
  
  // Calculate total hours for YTD
  const totalDowntimeYTDHours = machineDowntimeData.reduce((sum, m) => {
    const monthlySum = Object.entries(m.monthlyHours)
      .filter(([month]) => ['Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25'].includes(month))
      .reduce((acc, [_, hours]) => acc + hours, 0)
    return sum + monthlySum
  }, 0)
  
  const totalDowntimeTargetHours = machineDowntimeData.reduce((sum, m) => sum + (m.target2025Hours / 2), 0) // Half year target

  // Prepare monthly trend data based on view mode
  const monthlyTrendData = [
    { 
      month: 'Jan-25',
      '600T': viewMode === 'cost' ? 15.2 * 378 : 15.2,
      '1500-1': viewMode === 'cost' ? 42.5 * 900 : 42.5,
      '1500-2': viewMode === 'cost' ? 45.8 * 900 : 45.8,
      '1400T': viewMode === 'cost' ? 28.5 * 840 : 28.5,
      '1000T': viewMode === 'cost' ? 12.5 * 585 : 12.5,
      '3000T': viewMode === 'cost' ? 48.5 * 1106 : 48.5,
    },
    {
      month: 'Feb-25',
      '600T': viewMode === 'cost' ? 18.5 * 378 : 18.5,
      '1500-1': viewMode === 'cost' ? 38.2 * 900 : 38.2,
      '1500-2': viewMode === 'cost' ? 52.3 * 900 : 52.3,
      '1400T': viewMode === 'cost' ? 31.2 * 840 : 31.2,
      '1000T': viewMode === 'cost' ? 11.8 * 585 : 11.8,
      '3000T': viewMode === 'cost' ? 52.3 * 1106 : 52.3,
    },
    {
      month: 'Mar-25',
      '600T': viewMode === 'cost' ? 12.8 * 378 : 12.8,
      '1500-1': viewMode === 'cost' ? 40.1 * 900 : 40.1,
      '1500-2': viewMode === 'cost' ? 32.4 * 900 : 32.4,
      '1400T': viewMode === 'cost' ? 31.2 * 840 : 31.2,
      '1000T': viewMode === 'cost' ? 12.2 * 585 : 12.2,
      '3000T': viewMode === 'cost' ? 42.8 * 1106 : 42.8,
    },
    {
      month: 'Apr-25',
      '600T': viewMode === 'cost' ? 24.3 * 378 : 24.3,
      '1500-1': viewMode === 'cost' ? 28.9 * 900 : 28.9,
      '1500-2': viewMode === 'cost' ? 48.2 * 900 : 48.2,
      '1400T': viewMode === 'cost' ? 42.8 * 840 : 42.8,
      '1000T': viewMode === 'cost' ? 9.8 * 585 : 9.8,
      '3000T': viewMode === 'cost' ? 45.2 * 1106 : 45.2,
    },
    {
      month: 'May-25',
      '600T': viewMode === 'cost' ? 28.1 * 378 : 28.1,
      '1500-1': viewMode === 'cost' ? 31.5 * 900 : 31.5,
      '1500-2': viewMode === 'cost' ? 51.6 * 900 : 51.6,
      '1400T': viewMode === 'cost' ? 38.5 * 840 : 38.5,
      '1000T': viewMode === 'cost' ? 10.5 * 585 : 10.5,
      '3000T': viewMode === 'cost' ? 48.8 * 1106 : 48.8,
    },
    {
      month: 'Jun-25',
      '600T': viewMode === 'cost' ? 31.2 * 378 : 31.2,
      '1500-1': viewMode === 'cost' ? 22.8 * 900 : 22.8,
      '1500-2': viewMode === 'cost' ? 35.1 * 900 : 35.1,
      '1400T': viewMode === 'cost' ? 29.2 * 840 : 29.2,
      '1000T': viewMode === 'cost' ? 8.2 * 585 : 8.2,
      '3000T': viewMode === 'cost' ? 42.5 * 1106 : 42.5,
    },
  ]

  // Machine performance radar data
  const radarData = machineDowntimeData.map(machine => ({
    machine: machine.machine.split(' ')[0],
    performance: Math.max(0, 100 - ((machine.quarterlyCost.q2.actual / machine.quarterlyCost.q2.target - 1) * 100)),
    target: 100,
  }))

  // Downtime by category - adjust based on view mode
  const downtimeCategories = viewMode === 'cost' ? [
    { name: 'Bolster Repairs', value: 14.87 * 900, color: '#ef4444' },
    { name: 'Press Repairs', value: 14.59 * 900, color: '#f59e0b' },
    { name: 'Transfer System', value: 10.18 * 900, color: '#eab308' },
    { name: 'Other', value: 25.36 * 900, color: '#84cc16' },
  ] : [
    { name: 'Bolster Repairs', value: 14.87, color: '#ef4444' },
    { name: 'Press Repairs', value: 14.59, color: '#f59e0b' },
    { name: 'Transfer System', value: 10.18, color: '#eab308' },
    { name: 'Other', value: 25.36, color: '#84cc16' },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatHours = (value: number) => {
    return `${value.toFixed(1)} hrs`
  }

  const formatValue = (value: number) => {
    return viewMode === 'cost' ? formatCurrency(value) : formatHours(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs mt-1" style={{ color: entry.color }}>
              {entry.name}: {viewMode === 'cost' ? formatCurrency(entry.value) : `${entry.value.toFixed(1)} hrs`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Machine Downtime Analysis</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Comprehensive analysis of machine downtime {viewMode === 'cost' ? 'costs' : 'hours'} and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-xs font-medium text-red-600">+12.8%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">YTD Downtime {viewMode === 'cost' ? 'Cost' : 'Hours'}</h3>
          <p className="text-xl font-bold text-gray-900">
            {viewMode === 'cost' ? formatCurrency(totalDowntimeYTDCost) : formatHours(totalDowntimeYTDHours)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Target: {viewMode === 'cost' ? formatCurrency(totalDowntimeTargetCost) : formatHours(totalDowntimeTargetHours)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-xs font-medium text-green-600">-20.8%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">2024 Total {viewMode === 'cost' ? 'Cost' : 'Hours'}</h3>
          <p className="text-xl font-bold text-gray-900">
            {viewMode === 'cost' ? formatCurrency(totalDowntime2024Cost) : formatHours(totalDowntime2024Hours)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            2025 Target: {viewMode === 'cost' ? formatCurrency(1627000) : formatHours(1627000 / 700)} {/* Avg rate */}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-600">3 Machines</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Over Target</h3>
          <p className="text-xl font-bold text-gray-900">50%</p>
          <p className="text-xs text-gray-500 mt-1">3 of 6 machines</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Q2 2025</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Highest Downtime</h3>
          <p className="text-xl font-bold text-gray-900">3000-Ton</p>
          <p className="text-xs text-gray-500 mt-1">
            {viewMode === 'cost' ? formatCurrency(150956) : formatHours(150956 / 1106)} in Q2
          </p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setViewMode('cost')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'cost'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Cost View
        </button>
        <button
          onClick={() => setViewMode('hours')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'hours'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Hours View
        </button>
      </div>

      {/* Machine Performance Table */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Machine Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Q1 Actual</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Q1 Target</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Q2 Actual</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Q2 Target</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {machineDowntimeData.map((machine, index) => {
                const q1Hours = Object.entries(machine.monthlyHours)
                  .filter(([month]) => ['Jan-25', 'Feb-25', 'Mar-25'].includes(month))
                  .reduce((sum, [_, hours]) => sum + hours, 0)
                const q2Hours = Object.entries(machine.monthlyHours)
                  .filter(([month]) => ['Apr-25', 'May-25', 'Jun-25'].includes(month))
                  .reduce((sum, [_, hours]) => sum + hours, 0)
                const q1TargetHours = machine.target2025Hours / 4
                const q2TargetHours = machine.target2025Hours / 4
                
                const q2Variance = viewMode === 'cost'
                  ? ((machine.quarterlyCost.q2.actual - machine.quarterlyCost.q2.target) / machine.quarterlyCost.q2.target) * 100
                  : ((q2Hours - q2TargetHours) / q2TargetHours) * 100
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-4 text-sm font-medium text-gray-900">{machine.machine}</td>
                    <td className="px-2 py-4 text-sm text-right text-gray-600">{formatCurrency(machine.hourlyRate)}/hr</td>
                    <td className="px-2 py-4 text-sm text-right text-gray-600">
                      {viewMode === 'cost' ? formatCurrency(machine.quarterlyCost.q1.actual) : formatHours(q1Hours)}
                    </td>
                    <td className="px-2 py-4 text-sm text-right text-gray-500">
                      {viewMode === 'cost' ? formatCurrency(machine.quarterlyCost.q1.target) : formatHours(q1TargetHours)}
                    </td>
                    <td className="px-2 py-4 text-sm text-right font-semibold text-gray-900">
                      {viewMode === 'cost' ? formatCurrency(machine.quarterlyCost.q2.actual) : formatHours(q2Hours)}
                    </td>
                    <td className="px-2 py-4 text-sm text-right text-gray-500">
                      {viewMode === 'cost' ? formatCurrency(machine.quarterlyCost.q2.target) : formatHours(q2TargetHours)}
                    </td>
                    <td className="px-2 py-4 text-sm text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        q2Variance <= 0 ? 'bg-green-100 text-green-800' : q2Variance <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {q2Variance > 0 ? '+' : ''}{q2Variance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Downtime Trend ({viewMode === 'cost' ? 'Cost' : 'Hours'})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => viewMode === 'cost' ? `$${(value/1000).toFixed(0)}k` : value.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="600T" stroke="#ef4444" name="600T" strokeWidth={2} />
              <Line type="monotone" dataKey="1500-1" stroke="#f59e0b" name="1500-1" strokeWidth={2} />
              <Line type="monotone" dataKey="1500-2" stroke="#eab308" name="1500-2" strokeWidth={2} />
              <Line type="monotone" dataKey="3000T" stroke="#3b82f6" name="3000T" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Machine Performance Radar */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Q2 Performance vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="machine" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 120]} tick={{ fontSize: 10 }} />
              <Radar name="Performance" dataKey="performance" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              <Radar name="Target" dataKey="target" stroke="#84cc16" fill="#84cc16" fillOpacity={0.3} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Downtime Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Downtime by Category (Q2 - {viewMode === 'cost' ? 'Cost' : 'Hours'})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={downtimeCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {downtimeCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => viewMode === 'cost' ? formatCurrency(value) : formatHours(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Issues */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical Issues - Q2 2025</h3>
          <div className="space-y-3">
            <div className="flex items-start p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">1500-2-Ton Press</p>
                <p className="text-xs text-gray-600 mt-1">
                  72% over Q2 target - Excessive transfer system failures
                  {viewMode === 'hours' && ' (51.6 hrs in May)'}
                </p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">1400-Ton Press</p>
                <p className="text-xs text-gray-600 mt-1">
                  50% over Q2 target - Bolster repair backlog
                  {viewMode === 'hours' && ' (42.8 hrs in Apr)'}
                </p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">600-Ton Press</p>
                <p className="text-xs text-gray-600 mt-1">
                  45% over Q2 target - Increasing monthly trend
                  {viewMode === 'hours' && ' (31.2 hrs in Jun)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Downtime Reduction Action Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Immediate Actions:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">1.</span>
                <span>Schedule preventive maintenance for 1500-2-Ton during low production week</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">2.</span>
                <span>Fast-track bolster repair parts for 1400-Ton press</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">3.</span>
                <span>Implement daily transfer system checks on high-risk machines</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Long-term Improvements:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">1.</span>
                <span>Establish predictive maintenance program using IoT sensors</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">2.</span>
                <span>Cross-train operators on basic troubleshooting procedures</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">3.</span>
                <span>Create maintenance parts inventory buffer for critical components</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}