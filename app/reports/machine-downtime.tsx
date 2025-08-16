'use client'

import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts'
import { Clock, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Wrench } from 'lucide-react'
import { machineDowntimeData, maintenanceBreakdown } from '../data/pioneer-metrics'

export default function MachineDowntimeAnalysis() {
  const [selectedMachine, setSelectedMachine] = useState('all')
  const [viewMode, setViewMode] = useState<'cost' | 'hours'>('cost')
  
  // Calculate total downtime costs
  const totalDowntime2024 = machineDowntimeData.reduce((sum, m) => sum + m.actual2024Cost, 0)
  const totalDowntimeYTD = machineDowntimeData.reduce((sum, m) => sum + m.quarterlyCost.q1.actual + m.quarterlyCost.q2.actual, 0)
  const totalDowntimeTarget = machineDowntimeData.reduce((sum, m) => sum + (m.quarterlyCost.q1.target + m.quarterlyCost.q2.target), 0)

  // Prepare monthly trend data
  const monthlyTrendData = [
    { 
      month: 'Jan-25',
      '600T': 15.2 * 378,
      '1500-1': 42.5 * 900,
      '1500-2': 45.8 * 900,
      '1400T': 28.5 * 840,
      '1000T': 12.5 * 585,
      '3000T': 48.5 * 1106,
    },
    {
      month: 'Feb-25',
      '600T': 18.5 * 378,
      '1500-1': 38.2 * 900,
      '1500-2': 52.3 * 900,
      '1400T': 31.2 * 840,
      '1000T': 11.8 * 585,
      '3000T': 52.3 * 1106,
    },
    {
      month: 'Mar-25',
      '600T': 12.8 * 378,
      '1500-1': 40.1 * 900,
      '1500-2': 32.4 * 900,
      '1400T': 31.2 * 840,
      '1000T': 12.2 * 585,
      '3000T': 42.8 * 1106,
    },
    {
      month: 'Apr-25',
      '600T': 24.3 * 378,
      '1500-1': 28.9 * 900,
      '1500-2': 48.2 * 900,
      '1400T': 42.8 * 840,
      '1000T': 9.8 * 585,
      '3000T': 45.2 * 1106,
    },
    {
      month: 'May-25',
      '600T': 28.1 * 378,
      '1500-1': 31.5 * 900,
      '1500-2': 51.6 * 900,
      '1400T': 38.5 * 840,
      '1000T': 10.5 * 585,
      '3000T': 48.8 * 1106,
    },
    {
      month: 'Jun-25',
      '600T': 31.2 * 378,
      '1500-1': 22.8 * 900,
      '1500-2': 35.1 * 900,
      '1400T': 29.2 * 840,
      '1000T': 8.2 * 585,
      '3000T': 42.5 * 1106,
    },
  ]

  // Machine performance radar data
  const radarData = machineDowntimeData.map(machine => ({
    machine: machine.machine.split(' ')[0],
    performance: Math.max(0, 100 - ((machine.quarterlyCost.q2.actual / machine.quarterlyCost.q2.target - 1) * 100)),
    target: 100,
  }))

  // Downtime by category pie chart
  const downtimeCategories = [
    { name: 'Bolster Repairs', value: 14.87 * 900, color: '#ef4444' },
    { name: 'Press Repairs', value: 14.59 * 900, color: '#f59e0b' },
    { name: 'Transfer System', value: 10.18 * 900, color: '#eab308' },
    { name: 'Other', value: 25.36 * 900, color: '#84cc16' },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
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
          Comprehensive analysis of machine downtime costs and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-xs font-medium text-red-600">+12.8%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">YTD Downtime Cost</h3>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalDowntimeYTD)}</p>
          <p className="text-xs text-gray-500 mt-1">Target: {formatCurrency(totalDowntimeTarget)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-xs font-medium text-green-600">-20.8%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">2024 Total Cost</h3>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalDowntime2024)}</p>
          <p className="text-xs text-gray-500 mt-1">2025 Target: {formatCurrency(1627000)}</p>
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
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(150956)} in Q2</p>
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
                const q2Variance = ((machine.quarterlyCost.q2.actual - machine.quarterlyCost.q2.target) / machine.quarterlyCost.q2.target) * 100
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-4 text-sm font-medium text-gray-900">{machine.machine}</td>
                    <td className="px-2 py-4 text-sm text-right text-gray-600">{formatCurrency(machine.hourlyRate)}/hr</td>
                    <td className="px-2 py-4 text-sm text-right text-gray-600">{formatCurrency(machine.quarterlyCost.q1.actual)}</td>
                    <td className="px-2 py-4 text-sm text-right text-gray-500">{formatCurrency(machine.quarterlyCost.q1.target)}</td>
                    <td className="px-2 py-4 text-sm text-right font-semibold text-gray-900">{formatCurrency(machine.quarterlyCost.q2.actual)}</td>
                    <td className="px-2 py-4 text-sm text-right text-gray-500">{formatCurrency(machine.quarterlyCost.q2.target)}</td>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Downtime Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Downtime by Category (Q2)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={downtimeCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {downtimeCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
                <p className="text-xs text-gray-600 mt-1">72% over Q2 target - Excessive transfer system failures</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">1400-Ton Press</p>
                <p className="text-xs text-gray-600 mt-1">50% over Q2 target - Bolster repair backlog</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">600-Ton Press</p>
                <p className="text-xs text-gray-600 mt-1">45% over Q2 target - Increasing monthly trend</p>
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
                <span>Invest in predictive maintenance sensors for critical components</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">2.</span>
                <span>Cross-train operators on basic troubleshooting procedures</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">3.</span>
                <span>Establish spare parts inventory for frequent failure points</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}