'use client'

import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingDown, TrendingUp, DollarSign, AlertCircle, Target, CheckCircle } from 'lucide-react'
import { qualityMetrics } from '../data/pioneer-metrics'

export default function QualityPerformance() {
  const [selectedMetric, setSelectedMetric] = useState('all')
  
  // Prepare monthly trend data
  const monthlyTrendData = [
    { month: 'Jan-25', scrap: 29610, sort: 270, ppm: 30.5, internal: 0 },
    { month: 'Feb-25', scrap: 25946, sort: 1841, ppm: 16.63, internal: 1269 },
    { month: 'Mar-25', scrap: 25273, sort: 2479, ppm: 2.23, internal: 0 },
    { month: 'Apr-25', scrap: 26588, sort: 5097, ppm: 7.73, internal: 0 },
    { month: 'May-25', scrap: 27641, sort: 1543, ppm: 1.06, internal: 0 },
    { month: 'Jun-25', scrap: 28958, sort: 0, ppm: 2.21, internal: 0 },
  ]

  // Quarterly comparison data
  const quarterlyData = [
    {
      quarter: 'Q1 2025',
      scrapActual: 80829,
      scrapTarget: 106250,
      sortActual: 4590,
      sortTarget: 25000,
      ppmActual: 16.45,
      ppmTarget: 25,
    },
    {
      quarter: 'Q2 2025',
      scrapActual: 83187,
      scrapTarget: 106250,
      sortActual: 6640,
      sortTarget: 25000,
      ppmActual: 11,
      ppmTarget: 6.25,
    },
  ]

  // Cost breakdown for pie chart
  const costBreakdown = [
    { name: 'Scrap Costs', value: 164016, color: '#ef4444' },
    { name: 'External Sort', value: 11230, color: '#f59e0b' },
    { name: 'Internal Sort', value: 1269, color: '#eab308' },
    { name: 'Other Quality', value: 5000, color: '#84cc16' },
  ]

  // Year over year comparison
  const yoyComparison = [
    { metric: 'Scrap Costs', year2024: 566951, ytd2025: 164016, target2025: 212500, change: -71.1 },
    { metric: 'External Sort', year2024: 188435, ytd2025: 11230, target2025: 50000, change: -94.0 },
    { metric: 'PPM', year2024: 129, ytd2025: 13.7, target2025: 15.6, change: -89.4 },
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
              {entry.name}: {
                entry.name.includes('ppm') || entry.name.includes('PPM')
                  ? `${entry.value.toFixed(2)} ppm`
                  : formatCurrency(entry.value)
              }
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quality Performance Report</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Comprehensive quality metrics analysis and trends
        </p>
      </div>

      {/* Metric Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMetric('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedMetric === 'all'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Metrics
        </button>
        <button
          onClick={() => setSelectedMetric('scrap')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedMetric === 'scrap'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Scrap Costs
        </button>
        <button
          onClick={() => setSelectedMetric('sort')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedMetric === 'sort'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Sort Costs
        </button>
        <button
          onClick={() => setSelectedMetric('ppm')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedMetric === 'ppm'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          PPM
        </button>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {qualityMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{metric.metric}</h3>
              {metric.quarterlyData.q2.actual < metric.quarterlyData.q2.target ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xl font-bold text-gray-900">
              {metric.unit === '$' 
                ? formatCurrency(metric.quarterlyData.q1.actual + metric.quarterlyData.q2.actual)
                : `${((metric.quarterlyData.q1.actual + metric.quarterlyData.q2.actual) / 2).toFixed(1)} ${metric.unit}`
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              YTD 2025
            </p>
            <div className="mt-2 flex items-center text-xs">
              {metric.quarterlyData.q2.actual < metric.quarterlyData.q1.actual ? (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600">Improving</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-600">Increasing</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Quality Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {(selectedMetric === 'all' || selectedMetric === 'scrap') && (
                <Line type="monotone" dataKey="scrap" stroke="#ef4444" name="Scrap Costs" strokeWidth={2} />
              )}
              {(selectedMetric === 'all' || selectedMetric === 'sort') && (
                <Line type="monotone" dataKey="sort" stroke="#f59e0b" name="Sort Costs" strokeWidth={2} />
              )}
              {(selectedMetric === 'all' || selectedMetric === 'ppm') && (
                <Line type="monotone" dataKey="ppm" stroke="#3b82f6" name="PPM" strokeWidth={2} yAxisId={selectedMetric === 'ppm' ? 0 : 1} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quarterly Comparison */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Performance vs Target</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {(selectedMetric === 'all' || selectedMetric === 'scrap') && (
                <>
                  <Bar dataKey="scrapActual" fill="#ef4444" name="Scrap Actual" />
                  <Bar dataKey="scrapTarget" fill="#fca5a5" name="Scrap Target" />
                </>
              )}
              {(selectedMetric === 'all' || selectedMetric === 'sort') && (
                <>
                  <Bar dataKey="sortActual" fill="#f59e0b" name="Sort Actual" />
                  <Bar dataKey="sortTarget" fill="#fcd34d" name="Sort Target" />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Breakdown and YoY Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">YTD Quality Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {costBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {costBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Year over Year Comparison Table */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">2024</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">YTD 2025</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {yoyComparison.map((item, index) => (
                  <tr key={index}>
                    <td className="px-2 py-4 text-sm font-medium text-gray-900">{item.metric}</td>
                    <td className="px-2 py-4 text-sm text-right text-gray-600">
                      {item.metric === 'PPM' ? item.year2024 : formatCurrency(item.year2024)}
                    </td>
                    <td className="px-2 py-4 text-sm text-right text-gray-900 font-semibold">
                      {item.metric === 'PPM' ? item.ytd2025.toFixed(1) : formatCurrency(item.ytd2025)}
                    </td>
                    <td className="px-2 py-4 text-sm text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.change < 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.change < 0 ? '↓' : '↑'} {Math.abs(item.change).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality Improvement Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Successes to Maintain:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Scrap costs reduced 24% below Q1/Q2 targets</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>External sort costs 73% below target</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>89% reduction in PPM from 2024 baseline</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Areas Requiring Focus:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Q2 PPM increased to 11.0 (target: 6.25)</span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>April sort costs spike to $5,097</span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Begin tracking internal sort costs consistently</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}