'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity, 
  Target, 
  Factory,
  BarChart3,
  Clock,
  Users
} from 'lucide-react'

interface MachineYTD {
  machineId: string
  machineName: string
  target: number
  ytdHits: number
  ytdShift1: number
  ytdShift2: number
  ytdShift3: number
  ytdTarget: number
  performance: number
  lastUpdated: string
}

interface YTDTotalsData {
  overallYTD: number
  overallTarget: number
  overallPerformance: number
  machines: MachineYTD[]
  shiftTotals: {
    shift1: number
    shift2: number
    shift3: number
  }
  daysSinceYearStart: number
  projectedAnnual: number
}

export default function YTDRunningTotals() {
  const [ytdData, setYtdData] = useState<YTDTotalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchYTDData()
  }, [])

  const fetchYTDData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/ytd-totals')
      if (!response.ok) {
        throw new Error('Failed to fetch YTD data')
      }
      const data = await response.json()
      setYtdData(data)
    } catch (err) {
      console.error('Error fetching YTD data:', err)
      setError('Failed to load YTD data')
      // Set mock data for development
      setYtdData(generateMockYTDData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockYTDData = (): YTDTotalsData => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const today = new Date()
    const daysSinceYearStart = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
    
    const machines: MachineYTD[] = [
      {
        machineId: 'b8e48ae1-513f-4211-aa15-a421150c15a4',
        machineName: '600 Ton',
        target: 950,
        ytdHits: 2847500, // ~950 * 24 hours * 125 days
        ytdShift1: 912000,
        ytdShift2: 969750,
        ytdShift3: 965750,
        ytdTarget: 2850000,
        performance: 99.9,
        lastUpdated: today.toISOString()
      },
      {
        machineId: '73a96295-79f3-4dc7-ab38-08ee48679a6f',
        machineName: '1500-1',
        target: 600,
        ytdHits: 1794000, // ~600 * 24 hours * 125 days
        ytdShift1: 574200,
        ytdShift2: 610800,
        ytdShift3: 609000,
        ytdTarget: 1800000,
        performance: 99.7,
        lastUpdated: today.toISOString()
      },
      {
        machineId: '5d509a37-0e1c-4c18-be71-34638b3ec716',
        machineName: '1500-2',
        target: 600,
        ytdHits: 1801500,
        ytdShift1: 576480,
        ytdShift2: 612510,
        ytdShift3: 612510,
        ytdTarget: 1800000,
        performance: 100.1,
        lastUpdated: today.toISOString()
      },
      {
        machineId: '45dadf58-b046-4fe1-93fd-bf76568e8ef1',
        machineName: '1400',
        target: 600,
        ytdHits: 1776000,
        ytdShift1: 568320,
        ytdShift2: 603840,
        ytdShift3: 603840,
        ytdTarget: 1800000,
        performance: 98.7,
        lastUpdated: today.toISOString()
      },
      {
        machineId: '3c9453df-432f-47cb-9fd8-19b9a19fd012',
        machineName: '1000T',
        target: 875,
        ytdHits: 2603750,
        ytdShift1: 833200,
        ytdShift2: 885275,
        ytdShift3: 885275,
        ytdTarget: 2625000,
        performance: 99.2,
        lastUpdated: today.toISOString()
      },
      {
        machineId: '0e29b01a-7383-4c66-81e7-f92e9d52f227',
        machineName: '3000',
        target: 600,
        ytdHits: 1822500,
        ytdShift1: 583200,
        ytdShift2: 619650,
        ytdShift3: 619650,
        ytdTarget: 1800000,
        performance: 101.3,
        lastUpdated: today.toISOString()
      }
    ]

    const overallYTD = machines.reduce((sum, m) => sum + m.ytdHits, 0)
    const overallTarget = machines.reduce((sum, m) => sum + m.ytdTarget, 0)
    const shiftTotals = {
      shift1: machines.reduce((sum, m) => sum + m.ytdShift1, 0),
      shift2: machines.reduce((sum, m) => sum + m.ytdShift2, 0),
      shift3: machines.reduce((sum, m) => sum + m.ytdShift3, 0)
    }

    return {
      overallYTD,
      overallTarget,
      overallPerformance: (overallYTD / overallTarget) * 100,
      machines,
      shiftTotals,
      daysSinceYearStart,
      projectedAnnual: (overallYTD / daysSinceYearStart) * 365
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 100) return 'text-green-600 bg-green-50'
    if (performance >= 95) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getPerformanceIcon = (performance: number) => {
    if (performance >= 100) return <TrendingUp className="h-4 w-4 text-green-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">Loading YTD totals...</p>
        </div>
      </div>
    )
  }

  if (error || !ytdData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">{error || 'No YTD data available'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Company Performance */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Factory className="h-6 w-6" />
            Toledo Tool & Die - YTD Performance
          </CardTitle>
          <CardDescription className="text-orange-700">
            {ytdData.daysSinceYearStart} days into {new Date().getFullYear()} • Last updated: {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Total YTD Hits</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(ytdData.overallYTD)}</p>
              <p className="text-xs text-gray-600">All machines combined</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">YTD Target</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(ytdData.overallTarget)}</p>
              <p className="text-xs text-gray-600">Expected through today</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getPerformanceIcon(ytdData.overallPerformance)}
                <span className="text-sm font-medium text-gray-700">Performance</span>
              </div>
              <p className={`text-2xl font-bold ${ytdData.overallPerformance >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                {ytdData.overallPerformance.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">vs YTD target</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Projected Annual</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatNumber(ytdData.projectedAnnual)}</p>
              <p className="text-xs text-gray-600">Based on current pace</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Totals Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            YTD Shift Performance
          </CardTitle>
          <CardDescription>Running totals by shift across all machines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">1st Shift (Days)</span>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(ytdData.shiftTotals.shift1)}</p>
              <p className="text-xs text-blue-700">
                {((ytdData.shiftTotals.shift1 / ytdData.overallYTD) * 100).toFixed(1)}% of total
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-800">2nd Shift (Afternoons)</span>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(ytdData.shiftTotals.shift2)}</p>
              <p className="text-xs text-orange-700">
                {((ytdData.shiftTotals.shift2 / ytdData.overallYTD) * 100).toFixed(1)}% of total
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">3rd Shift (Nights)</span>
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(ytdData.shiftTotals.shift3)}</p>
              <p className="text-xs text-purple-700">
                {((ytdData.shiftTotals.shift3 / ytdData.overallYTD) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Machine YTD Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Machine YTD Performance
          </CardTitle>
          <CardDescription>Year-to-date running totals by machine and shift</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Machine</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">YTD Hits</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">1st Shift</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">2nd Shift</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">3rd Shift</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700">Performance</th>
                </tr>
              </thead>
              <tbody>
                {ytdData.machines.map((machine) => (
                  <tr key={machine.machineId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-gray-900">{machine.machineName}</p>
                        <p className="text-xs text-gray-500">Target: {machine.target}/hr</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">
                      <p className="font-bold text-lg">{formatNumber(machine.ytdHits)}</p>
                      <p className="text-xs text-gray-500">of {formatNumber(machine.ytdTarget)}</p>
                    </td>
                    <td className="text-right py-3 px-2">
                      <p className="font-medium text-blue-600">{formatNumber(machine.ytdShift1)}</p>
                      <p className="text-xs text-blue-500">
                        {((machine.ytdShift1 / machine.ytdHits) * 100).toFixed(1)}%
                      </p>
                    </td>
                    <td className="text-right py-3 px-2">
                      <p className="font-medium text-orange-600">{formatNumber(machine.ytdShift2)}</p>
                      <p className="text-xs text-orange-500">
                        {((machine.ytdShift2 / machine.ytdHits) * 100).toFixed(1)}%
                      </p>
                    </td>
                    <td className="text-right py-3 px-2">
                      <p className="font-medium text-purple-600">{formatNumber(machine.ytdShift3)}</p>
                      <p className="text-xs text-purple-500">
                        {((machine.ytdShift3 / machine.ytdHits) * 100).toFixed(1)}%
                      </p>
                    </td>
                    <td className="text-right py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        {getPerformanceIcon(machine.performance)}
                        <Badge className={getPerformanceColor(machine.performance)}>
                          {machine.performance.toFixed(1)}%
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            YTD Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top Performing Machines</h4>
              <div className="space-y-2">
                {ytdData.machines
                  .sort((a, b) => b.performance - a.performance)
                  .slice(0, 3)
                  .map((machine, index) => (
                    <div key={machine.machineId} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">{index + 1}</Badge>
                        <span className="font-medium">{machine.machineName}</span>
                      </div>
                      <span className="text-green-600 font-bold">{machine.performance.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-white rounded">
                  <span className="text-gray-600">Daily Average Hits</span>
                  <span className="font-bold">{formatNumber(ytdData.overallYTD / ytdData.daysSinceYearStart)}</span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span className="text-gray-600">Machines Over Target</span>
                  <span className="font-bold text-green-600">
                    {ytdData.machines.filter(m => m.performance >= 100).length} of {ytdData.machines.length}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span className="text-gray-600">Best Shift Performance</span>
                  <span className="font-bold text-blue-600">
                    {ytdData.shiftTotals.shift2 > ytdData.shiftTotals.shift1 && ytdData.shiftTotals.shift2 > ytdData.shiftTotals.shift3 ? '2nd Shift' :
                     ytdData.shiftTotals.shift3 > ytdData.shiftTotals.shift1 ? '3rd Shift' : '1st Shift'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}