'use client'

import React, { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Target, Calendar, DollarSign, Award } from 'lucide-react'
import { qualityMetrics, machineDowntimeData, getExecutiveSummary } from '../data/pioneer-metrics'

export default function QuarterlyBusinessReview() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q2')
  const summary = getExecutiveSummary()

  // Q1 and Q2 Performance Data
  const quarterlyPerformance = {
    Q1: {
      scrapCost: { actual: 80829, target: 106250, variance: -23.9 },
      sortCost: { actual: 4590, target: 25000, variance: -81.6 },
      ppm: { actual: 16.45, target: 25, variance: -34.2 },
      downtime: { actual: 460851, target: 421500, variance: 9.3 },
      pmCompletion: { actual: 96.7, target: 95, variance: 1.8 },
    },
    Q2: {
      scrapCost: { actual: 83187, target: 106250, variance: -21.7 },
      sortCost: { actual: 6640, target: 25000, variance: -73.4 },
      ppm: { actual: 11, target: 6.25, variance: 76.0 },
      downtime: { actual: 524298, target: 421500, variance: 24.4 },
      pmCompletion: { actual: 97.5, target: 95, variance: 2.6 },
    },
  }

  // Goal Achievement Radial Data
  const goalAchievement = [
    { name: 'Scrap Reduction', value: 78, fill: '#10b981' },
    { name: 'Sort Cost', value: 127, fill: '#10b981' },
    { name: 'Quality PPM', value: 24, fill: '#ef4444' },
    { name: 'Downtime', value: 76, fill: '#f59e0b' },
    { name: 'PM Completion', value: 103, fill: '#10b981' },
  ]

  // Monthly Performance Trend
  const monthlyTrend = [
    { month: 'Jan', scrap: 29610, downtime: 153000, ppm: 30.5 },
    { month: 'Feb', scrap: 25946, downtime: 154000, ppm: 16.63 },
    { month: 'Mar', scrap: 25273, downtime: 153851, ppm: 2.23 },
    { month: 'Apr', scrap: 26588, downtime: 165000, ppm: 7.73 },
    { month: 'May', scrap: 27641, downtime: 178000, ppm: 1.06 },
    { month: 'Jun', scrap: 28958, downtime: 181298, ppm: 2.21 },
  ]

  // YTD Progress
  const ytdProgress = [
    { metric: 'Total Cost Savings', target: 284451, actual: 198234, percentage: 69.7 },
    { metric: 'Quality Improvement', target: 75, actual: 89.4, percentage: 119.2 },
    { metric: 'Efficiency Gains', target: 15, actual: 12.3, percentage: 82 },
    { metric: 'Safety Record', target: 0, actual: 0, percentage: 100 },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getVarianceColor = (variance: number, invertColors = false) => {
    if (invertColors) {
      return variance > 0 ? 'text-red-600' : 'text-green-600'
    }
    return variance < 0 ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (variance: number, invertColors = false) => {
    const isGood = invertColors ? variance <= 0 : variance >= 0
    return isGood ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    )
  }

  const currentQuarterData = quarterlyPerformance[selectedQuarter as keyof typeof quarterlyPerformance]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quarterly Business Review</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Q2 2025 Performance Review and YTD Analysis
        </p>
      </div>

      {/* Quarter Selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setSelectedQuarter('Q1')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedQuarter === 'Q1'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Q1 2025
        </button>
        <button
          onClick={() => setSelectedQuarter('Q2')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedQuarter === 'Q2'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Q2 2025
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <h2 className="text-xl font-bold mb-4">Executive Summary - {selectedQuarter} 2025</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm opacity-90">Quarter Status</p>
            <p className="text-2xl font-bold">Mixed Performance</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Cost Savings YTD</p>
            <p className="text-2xl font-bold">{formatCurrency(198234)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Goal Achievement</p>
            <p className="text-2xl font-bold">3 of 5 Targets Met</p>
          </div>
        </div>
      </div>

      {/* KPI Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quarter Performance Table */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedQuarter} Performance vs Targets</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Scrap Costs</p>
                  <p className="text-xs text-gray-500">
                    Actual: {formatCurrency(currentQuarterData.scrapCost.actual)} | Target: {formatCurrency(currentQuarterData.scrapCost.target)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getVarianceColor(currentQuarterData.scrapCost.variance, true)}`}>
                  {currentQuarterData.scrapCost.variance.toFixed(1)}%
                </span>
                {getStatusIcon(currentQuarterData.scrapCost.variance)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Sort Costs</p>
                  <p className="text-xs text-gray-500">
                    Actual: {formatCurrency(currentQuarterData.sortCost.actual)} | Target: {formatCurrency(currentQuarterData.sortCost.target)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getVarianceColor(currentQuarterData.sortCost.variance, true)}`}>
                  {currentQuarterData.sortCost.variance.toFixed(1)}%
                </span>
                {getStatusIcon(currentQuarterData.sortCost.variance)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Quality PPM</p>
                  <p className="text-xs text-gray-500">
                    Actual: {currentQuarterData.ppm.actual} | Target: {currentQuarterData.ppm.target}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getVarianceColor(currentQuarterData.ppm.variance, true)}`}>
                  {currentQuarterData.ppm.variance > 0 ? '+' : ''}{currentQuarterData.ppm.variance.toFixed(1)}%
                </span>
                {getStatusIcon(-currentQuarterData.ppm.variance)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Machine Downtime</p>
                  <p className="text-xs text-gray-500">
                    Actual: {formatCurrency(currentQuarterData.downtime.actual)} | Target: {formatCurrency(currentQuarterData.downtime.target)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getVarianceColor(currentQuarterData.downtime.variance, true)}`}>
                  +{currentQuarterData.downtime.variance.toFixed(1)}%
                </span>
                {getStatusIcon(-currentQuarterData.downtime.variance)}
              </div>
            </div>
          </div>
        </div>

        {/* Goal Achievement Radial */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Achievement Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={goalAchievement}>
              <PolarAngleAxis type="number" domain={[0, 150]} angleAxisId={0} tick={false} />
              <RadialBar 
                dataKey="value" 
                cornerRadius={10} 
                fill="#f59e0b" 
                background={{ fill: '#f3f4f6' }}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {goalAchievement.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.fill }} />
                <span className="text-gray-600">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">YTD Monthly Performance Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="scrap" stroke="#ef4444" name="Scrap Cost ($)" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="downtime" stroke="#f59e0b" name="Downtime Cost ($)" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="ppm" stroke="#3b82f6" name="PPM" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* YTD Progress and Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* YTD Progress */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">YTD Progress to Annual Goals</h3>
          <div className="space-y-4">
            {ytdProgress.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.metric}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      item.percentage >= 100 ? 'bg-green-500' : 
                      item.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    Actual: {item.metric.includes('Cost') ? formatCurrency(item.actual) : item.actual}
                  </span>
                  <span className="text-xs text-gray-500">
                    Target: {item.metric.includes('Cost') ? formatCurrency(item.target) : item.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quarter over Quarter Comparison */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarter-over-Quarter Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { metric: 'Scrap', Q1: 80829, Q2: 83187 },
              { metric: 'Sort', Q1: 4590, Q2: 6640 },
              { metric: 'Downtime', Q1: 460851 / 1000, Q2: 524298 / 1000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Q1" fill="#fbbf24" />
              <Bar dataKey="Q2" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Wins and Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Key Wins */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            Key Wins - {selectedQuarter} 2025
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Scrap costs reduced by {Math.abs(currentQuarterData.scrapCost.variance).toFixed(0)}% vs target</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>External sort costs {Math.abs(currentQuarterData.sortCost.variance).toFixed(0)}% below target</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>PM completion rate at {currentQuarterData.pmCompletion.actual}% (target: 95%)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Zero safety incidents maintained</span>
            </li>
          </ul>
        </div>

        {/* Key Challenges */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Key Challenges - {selectedQuarter} 2025
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠</span>
              <span>Machine downtime {currentQuarterData.downtime.variance.toFixed(0)}% over target</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠</span>
              <span>PPM increased to {currentQuarterData.ppm.actual} (target: {currentQuarterData.ppm.target})</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠</span>
              <span>3 of 6 machines exceeding downtime targets</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">⚠</span>
              <span>Transfer system failures increasing monthly</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Next Quarter Focus */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Q3 2025 Strategic Focus Areas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Quality</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Reduce PPM to below 6.25</li>
              <li>• Maintain scrap cost reduction</li>
              <li>• Implement quality checkpoints</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Efficiency</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Reduce 3000-Ton downtime by 30%</li>
              <li>• Address transfer system issues</li>
              <li>• Increase PM compliance to 98%</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Cost Savings</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Target $150K quarterly savings</li>
              <li>• Reduce overtime by 15%</li>
              <li>• Optimize material usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}