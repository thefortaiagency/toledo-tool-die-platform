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

  // Generate mock data based on the Excel format
  const generateMockData = (): MachineData[] => {
    const machines = [
      { name: '600 Ton', target: 950 },
      { name: '1500-1', target: 600 },
      { name: '1500-2', target: 600 },
      { name: '1400', target: 600 },
      { name: '1000', target: 600 }
    ]

    const today = new Date()
    const data: MachineData[] = []

    machines.forEach(machine => {
      const weeks: WeekData[] = []
      
      // Generate 4 weeks of data
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - (w * 7) - today.getDay() + 1) // Start on Monday
        
        const days: DayData[] = []
        let weeklyHits = 0
        let weeklyHours = 0
        
        for (let d = 0; d < 7; d++) {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + d)
          
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          const isWeekend = d >= 5
          
          const shifts: ShiftData[] = []
          let dailyHits = 0
          let dailyHours = 0
          
          // Generate 3 shifts
          for (let s = 1; s <= 3; s++) {
            const baseHits = machine.target * (0.7 + Math.random() * 0.5)
            const hits = isWeekend ? 0 : Math.floor(baseHits * 8)
            const hours = isWeekend ? 0 : 8
            const efficiency = hours > 0 ? (hits / hours) / machine.target : 0
            
            shifts.push({
              shift: s,
              hits,
              hours,
              efficiency: Math.round(efficiency * 100) / 100
            })
            
            dailyHits += hits
            dailyHours += hours
          }
          
          days.push({
            date: date.toISOString().split('T')[0],
            dayName: dayNames[d],
            shifts,
            dailyHits,
            dailyHours,
            dailyEfficiency: dailyHours > 0 ? Math.round((dailyHits / dailyHours / machine.target) * 100) / 100 : 0
          })
          
          weeklyHits += dailyHits
          weeklyHours += dailyHours
        }
        
        weeks.push({
          weekStart: weekStart.toISOString().split('T')[0],
          days,
          weeklyHits,
          weeklyHours,
          weeklyPerformance: weeklyHours > 0 ? Math.round((weeklyHits / weeklyHours / machine.target) * 100) / 100 : 0
        })
      }
      
      data.push({
        machine: machine.name,
        target: machine.target,
        weeks
      })
    })
    
    return data
  }

  useEffect(() => {
    // In a real app, fetch from API
    setMachineData(generateMockData())
    setLoading(false)
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
        <div className="text-gray-600">Loading hit tracker data...</div>
      </div>
    )
  }

  const currentMachine = machineData[0] // Show first machine by default
  const week = currentMachine?.weeks[currentWeek]

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
          onClick={() => setCurrentWeek(Math.min(currentWeek + 1, 3))}
          disabled={currentWeek >= 3}
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
              {/* 3rd Shift */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">3rd Shift Hits</td>
                {week?.days.map((day) => (
                  <td key={`3rd-hits-${day.date}`} className="px-4 py-3 text-sm text-center">
                    {day.shifts[2]?.hits || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-50">
                  {week?.days.reduce((sum, day) => sum + (day.shifts[2]?.hits || 0), 0)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">3rd Shift Hours</td>
                {week?.days.map((day) => (
                  <td key={`3rd-hours-${day.date}`} className="px-4 py-3 text-sm text-center">
                    {day.shifts[2]?.hours || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-50">
                  {week?.days.reduce((sum, day) => sum + (day.shifts[2]?.hours || 0), 0)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">3rd Shift Efficiency</td>
                {week?.days.map((day) => {
                  const eff = day.shifts[2]?.efficiency || 0
                  return (
                    <td key={`3rd-eff-${day.date}`} className="px-4 py-3 text-sm text-center">
                      {eff > 0 && (
                        <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(eff)}`}>
                          {getEfficiencyIcon(eff)}
                          <span className="ml-1 font-medium">{(eff * 100).toFixed(0)}%</span>
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-sm text-center bg-orange-50">
                  {(() => {
                    const totalHits = week?.days.reduce((sum, day) => sum + (day.shifts[2]?.hits || 0), 0) || 0
                    const totalHours = week?.days.reduce((sum, day) => sum + (day.shifts[2]?.hours || 0), 0) || 0
                    const eff = totalHours > 0 ? (totalHits / totalHours) / currentMachine.target : 0
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(eff)}`}>
                        {(eff * 100).toFixed(0)}%
                      </span>
                    )
                  })()}
                </td>
              </tr>

              {/* 1st Shift */}
              <tr className="hover:bg-gray-50 border-t-2">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">1st Shift Hits</td>
                {week?.days.map((day) => (
                  <td key={`1st-hits-${day.date}`} className="px-4 py-3 text-sm text-center">
                    {day.shifts[0]?.hits || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-50">
                  {week?.days.reduce((sum, day) => sum + (day.shifts[0]?.hits || 0), 0)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">1st Shift Hours</td>
                {week?.days.map((day) => (
                  <td key={`1st-hours-${day.date}`} className="px-4 py-3 text-sm text-center">
                    {day.shifts[0]?.hours || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-50">
                  {week?.days.reduce((sum, day) => sum + (day.shifts[0]?.hours || 0), 0)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">1st Shift Efficiency</td>
                {week?.days.map((day) => {
                  const eff = day.shifts[0]?.efficiency || 0
                  return (
                    <td key={`1st-eff-${day.date}`} className="px-4 py-3 text-sm text-center">
                      {eff > 0 && (
                        <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(eff)}`}>
                          {getEfficiencyIcon(eff)}
                          <span className="ml-1 font-medium">{(eff * 100).toFixed(0)}%</span>
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-sm text-center bg-orange-50">
                  {(() => {
                    const totalHits = week?.days.reduce((sum, day) => sum + (day.shifts[0]?.hits || 0), 0) || 0
                    const totalHours = week?.days.reduce((sum, day) => sum + (day.shifts[0]?.hours || 0), 0) || 0
                    const eff = totalHours > 0 ? (totalHits / totalHours) / currentMachine.target : 0
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(eff)}`}>
                        {(eff * 100).toFixed(0)}%
                      </span>
                    )
                  })()}
                </td>
              </tr>

              {/* 2nd Shift */}
              <tr className="hover:bg-gray-50 border-t-2">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">2nd Shift Hits</td>
                {week?.days.map((day) => (
                  <td key={`2nd-hits-${day.date}`} className="px-4 py-3 text-sm text-center">
                    {day.shifts[1]?.hits || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-50">
                  {week?.days.reduce((sum, day) => sum + (day.shifts[1]?.hits || 0), 0)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">2nd Shift Hours</td>
                {week?.days.map((day) => (
                  <td key={`2nd-hours-${day.date}`} className="px-4 py-3 text-sm text-center">
                    {day.shifts[1]?.hours || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-center font-bold bg-orange-50">
                  {week?.days.reduce((sum, day) => sum + (day.shifts[1]?.hours || 0), 0)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">2nd Shift Efficiency</td>
                {week?.days.map((day) => {
                  const eff = day.shifts[1]?.efficiency || 0
                  return (
                    <td key={`2nd-eff-${day.date}`} className="px-4 py-3 text-sm text-center">
                      {eff > 0 && (
                        <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(eff)}`}>
                          {getEfficiencyIcon(eff)}
                          <span className="ml-1 font-medium">{(eff * 100).toFixed(0)}%</span>
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-sm text-center bg-orange-50">
                  {(() => {
                    const totalHits = week?.days.reduce((sum, day) => sum + (day.shifts[1]?.hits || 0), 0) || 0
                    const totalHours = week?.days.reduce((sum, day) => sum + (day.shifts[1]?.hours || 0), 0) || 0
                    const eff = totalHours > 0 ? (totalHits / totalHours) / currentMachine.target : 0
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded ${getEfficiencyColor(eff)}`}>
                        {(eff * 100).toFixed(0)}%
                      </span>
                    )
                  })()}
                </td>
              </tr>

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
          <div className="text-2xl font-bold text-gray-900">{week?.weeklyHits.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Target: {(currentMachine?.target * week?.weeklyHours).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Weekly Hours</div>
          <div className="text-2xl font-bold text-gray-900">{week?.weeklyHours}</div>
          <div className="text-xs text-gray-500">Scheduled: {5 * 24} hrs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Average Efficiency</div>
          <div className={`text-2xl font-bold ${week?.weeklyPerformance >= 1 ? 'text-green-600' : 'text-orange-600'}`}>
            {((week?.weeklyPerformance || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Target: 100%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Best Shift</div>
          <div className="text-2xl font-bold text-gray-900">
            {(() => {
              const shiftTotals = [0, 0, 0]
              const shiftHours = [0, 0, 0]
              week?.days.forEach(day => {
                day.shifts.forEach((shift, index) => {
                  shiftTotals[index] += shift.hits
                  shiftHours[index] += shift.hours
                })
              })
              const efficiencies = shiftTotals.map((hits, i) => 
                shiftHours[i] > 0 ? (hits / shiftHours[i]) / currentMachine.target : 0
              )
              const bestIndex = efficiencies.indexOf(Math.max(...efficiencies))
              const shiftNames = ['1st', '2nd', '3rd']
              return shiftNames[bestIndex]
            })()}
          </div>
          <div className="text-xs text-gray-500">This week's top performer</div>
        </div>
      </div>
    </div>
  )
}