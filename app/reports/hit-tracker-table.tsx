'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react'

interface MachineData {
  machine: string
  target: number
  weeks: WeekData[]
}

interface WeekData {
  weekStart: string
  days: DayData[]
  weeklyHits: number
  weeklyHours: number
  weeklyPerformance: number
}

interface DayData {
  date: string
  dayName: string
  shifts: ShiftData[]
  dailyHits: number
  dailyHours: number
  dailyEfficiency: number
}

interface ShiftData {
  shift: number
  hits: number
  hours: number
  efficiency: number
}

export default function HitTrackerTable() {
  const [currentWeek, setCurrentWeek] = useState(0)
  const [machineData, setMachineData] = useState<MachineData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch REAL data from database - NO MOCK DATA
    const fetchData = async () => {
      try {
        const response = await fetch('/api/reports/hit-tracker')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const data = await response.json()
        
        if (data && data.machines) {
          setMachineData(data.machines)
        } else {
          setError('No data available')
          setMachineData([])
        }
      } catch (err) {
        console.error('Error fetching hit tracker data:', err)
        setError('Failed to load data from database')
        setMachineData([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 1.0) return 'text-green-600 bg-green-50'
    if (efficiency >= 0.9) return 'text-yellow-600 bg-yellow-50'
    if (efficiency >= 0.8) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 1.0) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (efficiency >= 0.9) return <Minus className="w-4 h-4 text-yellow-600" />
    return <AlertCircle className="w-4 h-4 text-red-600" />
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (!previous || current === previous) return <Minus className="w-3 h-3 text-gray-400" />
    if (current > previous) return <TrendingUp className="w-3 h-3 text-green-600" />
    return <TrendingDown className="w-3 h-3 text-red-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading hit tracker data from database...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (machineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">No production data available. Please import data from Excel.</div>
      </div>
    )
  }

  const currentMachine = machineData[0] // Show first machine by default
  const week = currentMachine?.weeks?.[currentWeek]

  if (!week) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">No data for selected week</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Machine Selector */}
      <div className="flex space-x-2 mb-4">
        {machineData.map((machine) => (
          <button
            key={machine.machine}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
          >
            <div className="text-sm font-medium">{machine.machine}</div>
            <div className="text-xs text-gray-500">Target: {machine.target}/hr</div>
          </button>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentWeek(Math.min(currentWeek + 1, machineData[0].weeks.length - 1))}
          disabled={currentWeek >= machineData[0].weeks.length - 1}
          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold">Week of {week?.weekStart}</h2>
          <p className="text-sm text-gray-600">
            Weekly Performance: 
            <span className={`ml-2 font-bold ${week?.weeklyPerformance >= 1 ? 'text-green-600' : 'text-orange-600'}`}>
              {(week?.weeklyPerformance * 100).toFixed(1)}%
            </span>
          </p>
        </div>
        
        <button
          onClick={() => setCurrentWeek(Math.max(currentWeek - 1, 0))}
          disabled={currentWeek <= 0}
          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Hit Tracker Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {currentMachine?.machine}
                </th>
                {week?.days.map((day) => (
                  <th key={day.date} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <div>{day.dayName}</div>
                    <div className="text-gray-500 font-normal">{day.date.slice(5)}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-orange-50">
                  Weekly Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Daily Totals */}
              <tr className="hover:bg-gray-50 border-t-4 bg-blue-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">Daily Hits</td>
                {week?.days.map((day) => (
                  <td key={`daily-hits-${day.date}`} className="px-4 py-3 text-sm text-center font-bold">
                    {day.dailyHits || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-100">
                  {week?.weeklyHits}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-blue-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">Daily Hours</td>
                {week?.days.map((day) => (
                  <td key={`daily-hours-${day.date}`} className="px-4 py-3 text-sm text-center font-bold">
                    {day.dailyHours || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-100">
                  {week?.weeklyHours}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-blue-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">Daily Efficiency</td>
                {week?.days.map((day) => {
                  const eff = day.dailyEfficiency || 0
                  return (
                    <td key={`daily-eff-${day.date}`} className="px-4 py-3 text-sm text-center">
                      {eff > 0 && (
                        <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(eff)}`}>
                          {getEfficiencyIcon(eff)}
                          <span className="ml-1 font-bold">{(eff * 100).toFixed(0)}%</span>
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-sm text-center bg-orange-100">
                  <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(week?.weeklyPerformance || 0)}`}>
                    <span className="font-bold">{((week?.weeklyPerformance || 0) * 100).toFixed(0)}%</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Weekly Hits</div>
          <div className="text-2xl font-bold text-gray-900">{week?.weeklyHits?.toLocaleString() || 0}</div>
          <div className="text-xs text-gray-500">Target: {(currentMachine?.target * (week?.weeklyHours || 0))?.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Weekly Hours</div>
          <div className="text-2xl font-bold text-gray-900">{week?.weeklyHours || 0}</div>
          <div className="text-xs text-gray-500">Active Production</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Average Efficiency</div>
          <div className={`text-2xl font-bold ${week?.weeklyPerformance >= 1 ? 'text-green-600' : 'text-orange-600'}`}>
            {((week?.weeklyPerformance || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Target: 100%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Data Source</div>
          <div className="text-2xl font-bold text-gray-900">Database</div>
          <div className="text-xs text-gray-500">Real production data</div>
        </div>
      </div>
    </div>
  )
}