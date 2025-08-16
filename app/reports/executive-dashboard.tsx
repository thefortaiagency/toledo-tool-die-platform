'use client'

import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Clock, Activity, Target } from 'lucide-react'
import { getExecutiveSummary, getStatusColor } from '../data/pioneer-metrics'

export default function ExecutiveDashboard() {
  const summary = getExecutiveSummary()
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const kpis = [
    {
      title: 'Scrap Cost Reduction',
      icon: DollarSign,
      current: summary.scrap.ytdActual,
      target: summary.scrap.ytdTarget,
      unit: 'currency',
      trend: summary.scrap.q1Performance < 0 ? 'down' : 'up',
      trendValue: summary.scrap.q1Performance,
      status: getStatusColor(summary.scrap.ytdActual, summary.scrap.ytdTarget),
      description: 'YTD Performance',
    },
    {
      title: 'Machine Downtime Cost',
      icon: Clock,
      current: summary.downtime.ytdActual,
      target: summary.downtime.q1Target * 2,
      unit: 'currency',
      trend: summary.downtime.q1Actual > summary.downtime.q1Target ? 'up' : 'down',
      trendValue: ((summary.downtime.q1Actual - summary.downtime.q1Target) / summary.downtime.q1Target) * 100,
      status: getStatusColor(summary.downtime.ytdActual, summary.downtime.q1Target * 2),
      description: 'YTD Downtime Cost',
    },
    {
      title: 'Quality PPM',
      icon: Activity,
      current: summary.quality.ppmQ2,
      target: summary.quality.ppmTarget,
      unit: 'ppm',
      trend: summary.quality.ppmQ2 < summary.quality.ppmQ1 ? 'down' : 'up',
      trendValue: ((summary.quality.ppmQ2 - summary.quality.ppmQ1) / summary.quality.ppmQ1) * 100,
      status: getStatusColor(summary.quality.ppmQ2, 6.25),
      description: 'Q2 Performance',
    },
    {
      title: 'PM Completion Rate',
      icon: Target,
      current: summary.maintenance.pmQ2 * 100,
      target: summary.maintenance.pmTarget * 100,
      unit: 'percentage',
      trend: summary.maintenance.pmQ2 > summary.maintenance.pmQ1 ? 'up' : 'down',
      trendValue: ((summary.maintenance.pmQ2 - summary.maintenance.pmQ1) / summary.maintenance.pmQ1) * 100,
      status: getStatusColor(summary.maintenance.pmQ2, summary.maintenance.pmTarget, false),
      description: 'Q2 Performance',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'yellow':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'red':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${value > 0 ? 'text-red-500' : 'text-green-500'}`} />
    } else {
      return <TrendingDown className={`h-4 w-4 ${value < 0 ? 'text-green-500' : 'text-red-500'}`} />
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Key Performance Indicators - Q2 2025 Update
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                {getStatusIcon(kpi.status)}
              </div>

              <h3 className="text-sm font-medium text-gray-600 mb-2">{kpi.title}</h3>

              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {kpi.unit === 'currency' 
                      ? formatCurrency(kpi.current)
                      : kpi.unit === 'percentage'
                      ? `${kpi.current.toFixed(1)}%`
                      : kpi.current.toFixed(1)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Target: {kpi.unit === 'currency' 
                      ? formatCurrency(kpi.target)
                      : kpi.unit === 'percentage'
                      ? `${kpi.target.toFixed(1)}%`
                      : kpi.target.toFixed(1)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  {getTrendIcon(kpi.trend, kpi.trendValue)}
                  <span className={`text-xs sm:text-sm font-medium mt-1 ${
                    kpi.trendValue < 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(kpi.trendValue)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">{kpi.description}</p>
            </div>
          )
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Annual Targets Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">2025 Annual Targets</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Scrap Cost Reduction</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(summary.scrap.targetSavings)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Downtime Reduction</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(summary.downtime.targetSavings)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Quality PPM Target</span>
              <span className="text-sm font-semibold">25 ppm</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">PM Completion Target</span>
              <span className="text-sm font-semibold">95%</span>
            </div>
          </div>
        </div>

        {/* YTD Performance Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">YTD Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Scrap Costs</span>
              <span className="text-sm font-semibold">
                {formatCurrency(summary.scrap.ytdActual)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Downtime Costs</span>
              <span className="text-sm font-semibold">
                {formatCurrency(summary.downtime.ytdActual)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Average PPM</span>
              <span className="text-sm font-semibold">
                {((summary.quality.ppmQ1 + summary.quality.ppmQ2) / 2).toFixed(1)} ppm
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Average PM Completion</span>
              <span className="text-sm font-semibold">
                {(((summary.maintenance.pmQ1 + summary.maintenance.pmQ2) / 2) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Risk Indicators Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Risk Indicators</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600">3000-Ton Press Downtime</span>
              </div>
              <span className="text-xs font-medium text-yellow-600">+34% vs Target</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">External Sort Costs</span>
              </div>
              <span className="text-xs font-medium text-green-600">-73% vs Target</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">PM Completion Rate</span>
              </div>
              <span className="text-xs font-medium text-green-600">Above Target</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Q2 PPM Trend</span>
              </div>
              <span className="text-xs font-medium text-red-600">Increasing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Items */}
      <div className="mt-6 sm:mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Key Action Items</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Focus on reducing 3000-Ton and 1500-2-Ton press downtime - currently 34% and 72% over Q2 targets</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Investigate Q2 PPM increase from 16.45 to 11.0 (target was 6.25)</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Continue excellent performance on external sort cost reduction (-73% vs target)</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Maintain PM completion rate momentum (97.5% in Q2 vs 95% target)</span>
          </li>
        </ul>
      </div>
    </div>
  )
}