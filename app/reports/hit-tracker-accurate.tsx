'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react'
import MachineDetailModal from './machine-detail-modal'

// Machine configurations with their targets - MUST MATCH DATABASE IDS
const MACHINES = [
  { id: 'b8e48ae1-513f-4211-aa15-a421150c15a4', name: '600 Ton', target: 950, color: 'blue' },
  { id: '73a96295-79f3-4dc7-ab38-08ee48679a6f', name: '1500-1', target: 600, color: 'green' },
  { id: '5d509a37-0e1c-4c18-be71-34638b3ec716', name: '1500-2', target: 600, color: 'purple' },
  { id: '45dadf58-b046-4fe1-93fd-bf76568e8ef1', name: '1400', target: 600, color: 'orange' },
  { id: '3c9453df-432f-47cb-9fd8-19b9a19fd012', name: '1000T', target: 875, color: 'red' },
  { id: '0e29b01a-7383-4c66-81e7-f92e9d52f227', name: 'Hyd', target: 600, color: 'indigo' }
]

interface ShiftData {
  hits: number | null
  hours: number | null
  efficiency: number | null
}

interface DayData {
  date: string
  dayName: string
  shifts: {
    third: ShiftData
    first: ShiftData
    second: ShiftData
  }
  dailyHits: number
  dailyHours: number
  dailyEfficiency: number
}

interface MachineWeekData {
  machineId: string
  machineName: string
  target: number
  days: DayData[]
  weeklyHits: number
  weeklyHours: number
  weeklyPerformance: number
  shiftTotals: {
    third: { hits: number, hours: number, efficiency: number }
    first: { hits: number, hours: number, efficiency: number }
    second: { hits: number, hours: number, efficiency: number }
  }
}

interface WeekData {
  weekStart: string
  weekEnd: string
  machines: MachineWeekData[]
}

export default function HitTrackerAccurate() {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all')
  const [detailModalMachine, setDetailModalMachine] = useState<MachineWeekData | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // NO MOCK DATA - Only use real database data
  const generateMockData = (): WeekData[] => {
    // REMOVED - No mock data allowed
    return []
  }
  
  // Original mock data function removed - only keeping stub for compatibility
  const _unusedMockDataFunction = (): WeekData[] => {
    const weeks: WeekData[] = []
    
    // Generate 4 weeks of data starting from current week
    const today = new Date()
    const currentMonday = new Date(today)
    currentMonday.setDate(today.getDate() - today.getDay() + 1) // Get Monday of current week
    
    const weekStarts: { start: string, end: string }[] = []
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(currentMonday)
      weekStart.setDate(currentMonday.getDate() - (w * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      weekStarts.unshift({
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      })
    }

    weekStarts.forEach(({ start, end }) => {
      const machines: MachineWeekData[] = []
      
      MACHINES.forEach(machine => {
        const days: DayData[] = []
        let weeklyHits = 0
        let weeklyHours = 0

        // Generate 7 days of data
        const startDate = new Date(start)
        for (let d = 0; d < 7; d++) {
          const currentDate = new Date(startDate)
          currentDate.setDate(startDate.getDate() + d)
          
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          const dayName = dayNames[d]
          const isWeekend = d >= 5

          // Generate shift data with some randomness
          const shifts = {
            third: {
              hits: isWeekend ? null : Math.floor(machine.target * 8 * (0.7 + Math.random() * 0.5)),
              hours: isWeekend ? null : 8,
              efficiency: null as number | null
            },
            first: {
              hits: isWeekend ? null : Math.floor(machine.target * 8 * (0.8 + Math.random() * 0.4)),
              hours: isWeekend ? null : 8,
              efficiency: null as number | null
            },
            second: {
              hits: isWeekend ? null : Math.floor(machine.target * 8 * (0.75 + Math.random() * 0.45)),
              hours: isWeekend ? null : 8,
              efficiency: null as number | null
            }
          }

          // Calculate efficiencies
          if (shifts.third.hits !== null && shifts.third.hours !== null && shifts.third.hours > 0) {
            shifts.third.efficiency = (shifts.third.hits / shifts.third.hours) / machine.target
          }
          if (shifts.first.hits !== null && shifts.first.hours !== null && shifts.first.hours > 0) {
            shifts.first.efficiency = (shifts.first.hits / shifts.first.hours) / machine.target
          }
          if (shifts.second.hits !== null && shifts.second.hours !== null && shifts.second.hours > 0) {
            shifts.second.efficiency = (shifts.second.hits / shifts.second.hours) / machine.target
          }

          // Calculate daily totals
          const dailyHits = (shifts.third.hits || 0) + (shifts.first.hits || 0) + (shifts.second.hits || 0)
          const dailyHours = (shifts.third.hours || 0) + (shifts.first.hours || 0) + (shifts.second.hours || 0)
          const dailyEfficiency = dailyHours > 0 ? (dailyHits / dailyHours) / machine.target : 0

          days.push({
            date: currentDate.toISOString().split('T')[0],
            dayName,
            shifts,
            dailyHits,
            dailyHours,
            dailyEfficiency
          })

          weeklyHits += dailyHits
          weeklyHours += dailyHours
        }

        // Calculate shift totals for the week
        const shiftTotals = {
          third: {
            hits: days.reduce((sum, d) => sum + (d.shifts.third.hits || 0), 0),
            hours: days.reduce((sum, d) => sum + (d.shifts.third.hours || 0), 0),
            efficiency: 0
          },
          first: {
            hits: days.reduce((sum, d) => sum + (d.shifts.first.hits || 0), 0),
            hours: days.reduce((sum, d) => sum + (d.shifts.first.hours || 0), 0),
            efficiency: 0
          },
          second: {
            hits: days.reduce((sum, d) => sum + (d.shifts.second.hits || 0), 0),
            hours: days.reduce((sum, d) => sum + (d.shifts.second.hours || 0), 0),
            efficiency: 0
          }
        }

        // Calculate shift efficiencies
        if (shiftTotals.third.hours > 0) {
          shiftTotals.third.efficiency = (shiftTotals.third.hits / shiftTotals.third.hours) / machine.target
        }
        if (shiftTotals.first.hours > 0) {
          shiftTotals.first.efficiency = (shiftTotals.first.hits / shiftTotals.first.hours) / machine.target
        }
        if (shiftTotals.second.hours > 0) {
          shiftTotals.second.efficiency = (shiftTotals.second.hits / shiftTotals.second.hours) / machine.target
        }

        machines.push({
          machineId: machine.id,
          machineName: machine.name,
          target: machine.target,
          days,
          weeklyHits,
          weeklyHours,
          weeklyPerformance: weeklyHours > 0 ? (weeklyHits / weeklyHours) / machine.target : 0,
          shiftTotals
        })
      })

      weeks.push({
        weekStart: start,
        weekEnd: end,
        machines
      })
    })

    return weeks
  }

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Fetch ONLY real data from the database - NO MOCK DATA
    const fetchData = async () => {
      try {
        const response = await fetch('/api/reports/hit-tracker-weeks')
        const data = await response.json()
        
        if (data.weeks && data.weeks.length > 0) {
          setWeekData(data.weeks)
        } else {
          // NO MOCK DATA - Show empty state
          setWeekData([])
          console.log('No data available in database')
        }
      } catch (error) {
        console.error('Error fetching hit tracker data:', error)
        // NO MOCK DATA - Show empty state on error
        setWeekData([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getEfficiencyColor = (efficiency: number | null) => {
    if (efficiency === null) return ''
    if (efficiency >= 1.0) return 'bg-green-100 text-green-800'
    if (efficiency >= 0.9) return 'bg-yellow-100 text-yellow-800'
    if (efficiency >= 0.8) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getEfficiencyIcon = (efficiency: number | null) => {
    if (efficiency === null) return null
    if (efficiency >= 1.0) return <CheckCircle className="w-3 h-3 inline mr-1" />
    if (efficiency >= 0.9) return null
    return <AlertCircle className="w-3 h-3 inline mr-1" />
  }

  const formatEfficiency = (efficiency: number | null) => {
    if (efficiency === null) return '-'
    return `${(efficiency * 100).toFixed(1)}%`
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === 0) return ''
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <span className="ml-3 text-gray-600">Loading Hit Tracker data...</span>
      </div>
    )
  }

  const currentWeek = weekData[currentWeekIndex]
  if (!currentWeek) return null

  const displayMachines = selectedMachine 
    ? currentWeek.machines.filter(m => m.machineId === selectedMachine)
    : currentWeek.machines
  
  // If no machines to display after filtering, show empty state
  if (displayMachines.length === 0) {
    return (
      <div className="space-y-4">
        {/* Week Navigation Header */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentWeekIndex(Math.min(weekData.length - 1, currentWeekIndex + 1))}
              disabled={currentWeekIndex === weekData.length - 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold">Hit Tracker - Week of {currentWeek.weekStart}</h2>
              <p className="text-sm text-gray-600">
                {currentWeek.weekStart} to {currentWeek.weekEnd}
              </p>
            </div>
            
            <button
              onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
              disabled={currentWeekIndex === 0}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Machine Filter Buttons */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedMachine(null)
                setViewMode('all')
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !selectedMachine 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              All Machines
            </button>
            {MACHINES.map(machine => (
              <button
                key={machine.id}
                onClick={() => {
                  setSelectedMachine(machine.id)
                  setViewMode('single')
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedMachine === machine.id 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {machine.name}
                <span className="ml-2 text-xs opacity-75">({machine.target}/hr)</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No data available for the selected machine in this week.</p>
          <button 
            onClick={() => setSelectedMachine(null)}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Show All Machines
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeekIndex(Math.min(weekData.length - 1, currentWeekIndex + 1))}
            disabled={currentWeekIndex === weekData.length - 1}
            className="p-1.5 sm:p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
          
          <div className="text-center px-2">
            <h2 className="text-sm sm:text-xl font-bold">Hit Tracker - Week of {currentWeek.weekStart}</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {currentWeek.weekStart} to {currentWeek.weekEnd}
            </p>
          </div>
          
          <button
            onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
            disabled={currentWeekIndex === 0}
            className="p-1.5 sm:p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Week"
          >
            <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Machine Filter Buttons - Scrollable on mobile */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <button
              onClick={() => {
                setSelectedMachine(null)
                setViewMode('all')
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                !selectedMachine 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              All Machines
            </button>
            {MACHINES.map(machine => (
              <button
                key={machine.id}
                onClick={() => {
                  setSelectedMachine(machine.id)
                  setViewMode('single')
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
                  selectedMachine === machine.id 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {machine.name}
                <span className="ml-1 sm:ml-2 text-xs opacity-75">({machine.target}/hr)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      {isMobile && (
        <div className="space-y-4 md:hidden">
          {displayMachines.map((machine) => (
            <div key={machine.machineId} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">{machine.machineName}</h3>
                <button 
                  onClick={() => setDetailModalMachine(machine)}
                  className="text-blue-600 text-sm"
                >
                  Details →
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekly Hits:</span>
                  <span className="font-semibold">{machine.weeklyHits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekly Hours:</span>
                  <span className="font-semibold">{machine.weeklyHours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className={`font-semibold px-2 rounded ${getEfficiencyColor(machine.weeklyPerformance)}`}>
                    {formatEfficiency(machine.weeklyPerformance)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-600 mb-1">Shift Performance:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold">3rd</div>
                      <div className={`px-1 rounded ${getEfficiencyColor(machine.shiftTotals.third.efficiency)}`}>
                        {formatEfficiency(machine.shiftTotals.third.efficiency)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">1st</div>
                      <div className={`px-1 rounded ${getEfficiencyColor(machine.shiftTotals.first.efficiency)}`}>
                        {formatEfficiency(machine.shiftTotals.first.efficiency)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">2nd</div>
                      <div className={`px-1 rounded ${getEfficiencyColor(machine.shiftTotals.second.efficiency)}`}>
                        {formatEfficiency(machine.shiftTotals.second.efficiency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Hit Tracker Table - Desktop only */}
      <div className={`bg-white rounded-lg shadow overflow-hidden ${isMobile ? 'hidden' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-2 sm:px-3 py-1 sm:py-2 text-left font-medium text-gray-700 border-r-2 border-gray-300 min-w-[100px] sm:min-w-[140px]">
                  <span className="hidden sm:inline">Machine / Shift</span>
                  <span className="sm:hidden">Machine</span>
                </th>
                {currentWeek.machines[0]?.days?.map((day, idx) => (
                  <th key={idx} className="px-1 sm:px-2 py-1 sm:py-2 text-center font-medium text-gray-700 border-r border-gray-200 min-w-[60px] sm:min-w-[100px]">
                    <div className="text-xs hidden sm:block">{day.dayName}</div>
                    <div className="text-xs sm:hidden">{day.dayName.slice(0, 3)}</div>
                    <div className="text-xs text-gray-500">{day.date.slice(5)}</div>
                  </th>
                ))}
                <th className="px-2 sm:px-3 py-1 sm:py-2 text-center font-medium text-gray-700 bg-orange-50 min-w-[80px] sm:min-w-[120px]">
                  <span className="hidden sm:inline">Weekly Total</span>
                  <span className="sm:hidden">Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayMachines.map((machine, machineIdx) => (
                <React.Fragment key={machine.machineId}>
                  {/* Machine Header */}
                  <tr 
                    className="bg-gray-50 border-t-2 border-gray-400 cursor-pointer hover:bg-gray-100"
                    onClick={() => setDetailModalMachine(machine)}
                  >
                    <td colSpan={9} className="px-2 sm:px-3 py-1 sm:py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs sm:text-base">
                          {machine.machineName} 
                          <span className="hidden sm:inline"> (Target: {machine.target}/hr)</span>
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 flex items-center text-xs sm:text-sm">
                          <Info className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* 3rd Shift */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 py-0.5 sm:py-1 text-gray-700 border-r-2 border-gray-300 font-medium text-xs sm:text-sm">
                      <span className="hidden sm:inline">3rd Shift Hits</span>
                      <span className="sm:hidden">3rd Hits</span>
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-1 sm:px-2 py-0.5 sm:py-1 text-center border-r border-gray-200 text-xs sm:text-sm">
                        {formatNumber(day.shifts.third.hits)}
                      </td>
                    ))}
                    <td className="px-2 sm:px-3 py-0.5 sm:py-1 text-center font-semibold bg-orange-50 text-xs sm:text-sm">
                      {formatNumber(machine.shiftTotals.third.hits)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-gray-50/50">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      3rd Shift Hours
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-2 py-1 text-center border-r border-gray-200">
                        {formatNumber(day.shifts.third.hours)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-semibold bg-orange-50">
                      {formatNumber(machine.shiftTotals.third.hours)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      3rd Efficiency
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className={`px-2 py-1 text-center border-r border-gray-200 ${getEfficiencyColor(day.shifts.third.efficiency)}`}>
                        <span className="text-xs">
                          {getEfficiencyIcon(day.shifts.third.efficiency)}
                          {formatEfficiency(day.shifts.third.efficiency)}
                        </span>
                      </td>
                    ))}
                    <td className={`px-3 py-1 text-center font-semibold bg-orange-50 ${getEfficiencyColor(machine.shiftTotals.third.efficiency)}`}>
                      {formatEfficiency(machine.shiftTotals.third.efficiency)}
                    </td>
                  </tr>

                  {/* 1st Shift */}
                  <tr className="hover:bg-gray-50 border-t border-gray-300">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      1st Shift Hits
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-2 py-1 text-center border-r border-gray-200">
                        {formatNumber(day.shifts.first.hits)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-semibold bg-orange-50">
                      {formatNumber(machine.shiftTotals.first.hits)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-gray-50/50">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      1st Shift Hours
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-2 py-1 text-center border-r border-gray-200">
                        {formatNumber(day.shifts.first.hours)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-semibold bg-orange-50">
                      {formatNumber(machine.shiftTotals.first.hours)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      1st Efficiency
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className={`px-2 py-1 text-center border-r border-gray-200 ${getEfficiencyColor(day.shifts.first.efficiency)}`}>
                        <span className="text-xs">
                          {getEfficiencyIcon(day.shifts.first.efficiency)}
                          {formatEfficiency(day.shifts.first.efficiency)}
                        </span>
                      </td>
                    ))}
                    <td className={`px-3 py-1 text-center font-semibold bg-orange-50 ${getEfficiencyColor(machine.shiftTotals.first.efficiency)}`}>
                      {formatEfficiency(machine.shiftTotals.first.efficiency)}
                    </td>
                  </tr>

                  {/* 2nd Shift */}
                  <tr className="hover:bg-gray-50 border-t border-gray-300">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      2nd Shift Hits
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-2 py-1 text-center border-r border-gray-200">
                        {formatNumber(day.shifts.second.hits)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-semibold bg-orange-50">
                      {formatNumber(machine.shiftTotals.second.hits)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-gray-50/50">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      2nd Shift Hours
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-2 py-1 text-center border-r border-gray-200">
                        {formatNumber(day.shifts.second.hours)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-semibold bg-orange-50">
                      {formatNumber(machine.shiftTotals.second.hours)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-1 text-gray-700 border-r-2 border-gray-300 font-medium">
                      2nd Efficiency
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className={`px-2 py-1 text-center border-r border-gray-200 ${getEfficiencyColor(day.shifts.second.efficiency)}`}>
                        <span className="text-xs">
                          {getEfficiencyIcon(day.shifts.second.efficiency)}
                          {formatEfficiency(day.shifts.second.efficiency)}
                        </span>
                      </td>
                    ))}
                    <td className={`px-3 py-1 text-center font-semibold bg-orange-50 ${getEfficiencyColor(machine.shiftTotals.second.efficiency)}`}>
                      {formatEfficiency(machine.shiftTotals.second.efficiency)}
                    </td>
                  </tr>

                  {/* Daily Totals */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-3 py-1 font-bold text-gray-900 border-r-2 border-gray-300">
                      Daily Hits
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-2 py-1 text-center font-semibold border-r border-gray-200">
                        {formatNumber(day.dailyHits)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-bold bg-orange-100">
                      {formatNumber(machine.weeklyHits)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="px-3 py-1 font-bold text-gray-900 border-r-2 border-gray-300">
                      Daily Hours
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className="px-2 py-1 text-center font-semibold border-r border-gray-200">
                        {formatNumber(day.dailyHours)}
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center font-bold bg-orange-100">
                      {formatNumber(machine.weeklyHours)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50 border-b-2 border-gray-400">
                    <td className="px-3 py-1 font-bold text-gray-900 border-r-2 border-gray-300">
                      Daily Efficiency
                    </td>
                    {machine.days.map((day, idx) => (
                      <td key={idx} className={`px-2 py-1 text-center font-semibold border-r border-gray-200 ${getEfficiencyColor(day.dailyEfficiency)}`}>
                        {formatEfficiency(day.dailyEfficiency)}
                      </td>
                    ))}
                    <td className={`px-3 py-1 text-center font-bold bg-orange-100 ${getEfficiencyColor(machine.weeklyPerformance)}`}>
                      {formatEfficiency(machine.weeklyPerformance)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Summary Statistics - Desktop only */}
      {!isMobile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayMachines.map(machine => (
          <div key={machine.machineId} className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{machine.machineName}</h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Hits:</span>
                <span className="font-semibold">{machine.weeklyHits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Hours:</span>
                <span className="font-semibold">{machine.weeklyHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Efficiency:</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${getEfficiencyColor(machine.weeklyPerformance)}`}>
                  {formatEfficiency(machine.weeklyPerformance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Best Shift:</span>
                <span className="font-semibold">
                  {(() => {
                    const shifts = [
                      { name: '3rd', eff: machine.shiftTotals.third.efficiency },
                      { name: '1st', eff: machine.shiftTotals.first.efficiency },
                      { name: '2nd', eff: machine.shiftTotals.second.efficiency }
                    ]
                    const best = shifts.reduce((a, b) => a.eff > b.eff ? a : b)
                    return `${best.name} (${formatEfficiency(best.eff)})`
                  })()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Machine Detail Modal */}
      {detailModalMachine && (
        <MachineDetailModal
          machine={detailModalMachine}
          onClose={() => setDetailModalMachine(null)}
          allWeeksData={weekData}
        />
      )}
    </div>
  )
}