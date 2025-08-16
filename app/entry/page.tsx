'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Machine, Shift, Part, Operator } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Save, RefreshCw, Calculator, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

export default function DataEntry() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [machines, setMachines] = useState<Machine[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift_id: '',
    machine_id: '',
    part_id: '',
    operator_id: '',
    part_number_new: '',
    operator_name_new: '',
    total_cycles: '',
    good_parts: '',
    scrap_parts: '',
    downtime_minutes: '',
    scheduled_hours: '8',
    actual_hours: '',
    operator_comments: '',
    supervisor_comments: '',
    manning_status: 'Have'
  })

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      // Load machines
      const { data: machinesData } = await supabase
        .from('machines')
        .select('*')
        .order('machine_number')
      if (machinesData) setMachines(machinesData)

      // Load shifts
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .order('shift_name')
      if (shiftsData) setShifts(shiftsData)

      // Load parts
      const { data: partsData } = await supabase
        .from('parts')
        .select('*')
        .order('part_number')
      if (partsData) setParts(partsData)

      // Load operators
      const { data: operatorsData } = await supabase
        .from('operators')
        .select('*')
        .order('name')
      if (operatorsData) setOperators(operatorsData)
    } catch (err) {
      console.error('Error loading form data:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      // Create new part if needed
      let partId = formData.part_id
      if (!partId && formData.part_number_new) {
        const { data: newPart, error: partError } = await supabase
          .from('parts')
          .insert({ 
            part_number: formData.part_number_new,
            part_name: `Part ${formData.part_number_new}`
          })
          .select()
          .single()
        
        if (partError) throw partError
        partId = newPart.id
      }

      // Create new operator if needed
      let operatorId = formData.operator_id
      if (!operatorId && formData.operator_name_new) {
        const { data: newOperator, error: opError } = await supabase
          .from('operators')
          .insert({ 
            employee_id: `EMP-${Date.now()}`,
            name: formData.operator_name_new
          })
          .select()
          .single()
        
        if (opError) throw opError
        operatorId = newOperator.id
      }

      // Calculate efficiency
      const goodParts = parseInt(formData.good_parts) || 0
      const totalCycles = parseInt(formData.total_cycles) || 0
      const actualEfficiency = totalCycles > 0 ? (goodParts / totalCycles) * 100 : 0

      // Insert production data
      const { error: prodError } = await supabase
        .from('production_data')
        .insert({
          date: formData.date,
          shift_id: formData.shift_id,
          machine_id: formData.machine_id,
          part_id: partId,
          operator_id: operatorId,
          total_cycles: parseInt(formData.total_cycles) || 0,
          good_parts: goodParts,
          scrap_parts: parseInt(formData.scrap_parts) || 0,
          downtime_minutes: parseInt(formData.downtime_minutes) || 0,
          scheduled_hours: parseFloat(formData.scheduled_hours) || 8,
          actual_hours: parseFloat(formData.actual_hours) || 0,
          actual_efficiency: actualEfficiency,
          operator_comments: formData.operator_comments,
          supervisor_comments: formData.supervisor_comments,
          manning_status: formData.manning_status
        })

      if (prodError) throw prodError

      // Check for anomalies and create AI insight
      if (actualEfficiency < 70) {
        await supabase
          .from('ai_insights')
          .insert({
            insight_date: formData.date,
            insight_type: 'anomaly',
            severity: actualEfficiency < 50 ? 'high' : 'medium',
            machine_id: formData.machine_id,
            part_id: partId,
            operator_id: operatorId,
            title: 'Low Efficiency Alert',
            description: `Machine recorded ${actualEfficiency.toFixed(1)}% efficiency, which is below target`,
            recommendation: 'Review machine maintenance schedule and operator training',
            confidence_score: 0.85
          })
      }
      
      setSuccess(true)
      // Reset form but keep date, shift, and machine for faster entry
      setFormData({
        ...formData,
        part_id: '',
        part_number_new: '',
        operator_id: '',
        operator_name_new: '',
        total_cycles: '',
        good_parts: '',
        scrap_parts: '',
        downtime_minutes: '',
        actual_hours: '',
        operator_comments: '',
        supervisor_comments: ''
      })

      // Reload parts and operators in case new ones were added
      loadFormData()

      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      console.error('Error submitting data:', err)
      // Check for duplicate entry error
      if (err.message?.includes('duplicate key')) {
        setError('Production data for this date, shift, and machine already exists. Please check your entry.')
      } else {
        setError(err.message || 'Error submitting data. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const calculateEfficiency = () => {
    const good = parseInt(formData.good_parts) || 0
    const total = parseInt(formData.total_cycles) || 0
    if (total === 0) return '0.0'
    return ((good / total) * 100).toFixed(1)
  }

  const calculateScrapRate = () => {
    const scrap = parseInt(formData.scrap_parts) || 0
    const total = parseInt(formData.total_cycles) || 0
    if (total === 0) return '0.0'
    return ((scrap / total) * 100).toFixed(1)
  }

  const calculateUptime = () => {
    const downtime = parseInt(formData.downtime_minutes) || 0
    const scheduledMinutes = (parseFloat(formData.scheduled_hours) || 8) * 60
    if (scheduledMinutes === 0) return '100.0'
    const uptime = ((scheduledMinutes - downtime) / scheduledMinutes) * 100
    return Math.max(0, uptime).toFixed(1)
  }

  const getTargetForMachine = () => {
    const machine = machines.find(m => m.id === formData.machine_id)
    if (!machine) return null
    // Target rates per hour based on machine
    const targets: Record<string, number> = {
      '600': 950,
      '1500-1': 600,
      '1500-2': 600,
      '1400': 600,
      '1000': 875,
      'Hyd': 600
    }
    return targets[machine.machine_number] || 600
  }

  const calculateActualRate = () => {
    const cycles = parseInt(formData.total_cycles) || 0
    const hours = parseFloat(formData.actual_hours) || 1
    if (hours === 0) return 0
    return Math.round(cycles / hours)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Production Data Entry</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Submit shift production reports and metrics</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">Production data submitted successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Shift Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shift Information</CardTitle>
              <CardDescription>Basic shift and machine details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Shift</label>
                <select
                  name="shift_id"
                  value={formData.shift_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Shift</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shift_name} ({shift.start_time} - {shift.end_time})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Machine</label>
                <select
                  name="machine_id"
                  value={formData.machine_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_number} - {machine.machine_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Manning Status</label>
                <select
                  name="manning_status"
                  value={formData.manning_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Have">Have</option>
                  <option value="Need">Need</option>
                  <option value="Call-in">Call-in</option>
                  <option value="NCNS">NCNS</option>
                  <option value="PTO">PTO</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Production Details */}
          <Card>
            <CardHeader>
              <CardTitle>Production Details</CardTitle>
              <CardDescription>Part and operator information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Part Number</label>
                <select
                  name="part_id"
                  value={formData.part_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!formData.part_number_new}
                >
                  <option value="">Select Part or Enter New</option>
                  {parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.part_number} - {part.part_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="part_number_new"
                  value={formData.part_number_new}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Or enter new part number"
                  disabled={!!formData.part_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Operator</label>
                <select
                  name="operator_id"
                  value={formData.operator_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!formData.operator_name_new}
                >
                  <option value="">Select Operator or Enter New</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.employee_id})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="operator_name_new"
                  value={formData.operator_name_new}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Or enter new operator name"
                  disabled={!!formData.operator_id}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Scheduled Hours</label>
                  <input
                    type="number"
                    name="scheduled_hours"
                    value={formData.scheduled_hours}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.5"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Actual Hours</label>
                  <input
                    type="number"
                    name="actual_hours"
                    value={formData.actual_hours}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.5"
                    min="0"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Production Metrics</CardTitle>
              <CardDescription>Cycles, parts, and quality data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Total Cycles</label>
                <input
                  type="number"
                  name="total_cycles"
                  value={formData.total_cycles}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Good Parts</label>
                  <input
                    type="number"
                    name="good_parts"
                    value={formData.good_parts}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Scrap Parts</label>
                  <input
                    type="number"
                    name="scrap_parts"
                    value={formData.scrap_parts}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Downtime (minutes)</label>
                <input
                  type="number"
                  name="downtime_minutes"
                  value={formData.downtime_minutes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <Calculator className="h-4 w-4 mr-1" />
                      Calculated Efficiency:
                    </span>
                    <span className={`text-lg font-bold ${
                      parseFloat(calculateEfficiency()) >= 100 ? 'text-green-600' :
                      parseFloat(calculateEfficiency()) >= 90 ? 'text-yellow-600' :
                      parseFloat(calculateEfficiency()) >= 80 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {calculateEfficiency()}%
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Scrap Rate:
                    </span>
                    <span className={`text-lg font-bold ${
                      parseFloat(calculateScrapRate()) <= 2 ? 'text-green-600' :
                      parseFloat(calculateScrapRate()) <= 5 ? 'text-yellow-600' :
                      parseFloat(calculateScrapRate()) <= 10 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {calculateScrapRate()}%
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Machine Uptime:
                    </span>
                    <span className={`text-lg font-bold ${
                      parseFloat(calculateUptime()) >= 95 ? 'text-green-600' :
                      parseFloat(calculateUptime()) >= 90 ? 'text-yellow-600' :
                      parseFloat(calculateUptime()) >= 80 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {calculateUptime()}%
                    </span>
                  </div>
                </div>

                {formData.machine_id && formData.actual_hours && (
                  <div className="p-4 bg-blue-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Actual vs Target Rate:
                      </span>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          calculateActualRate() >= (getTargetForMachine() || 0) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {calculateActualRate()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {' '}/ {getTargetForMachine()} per hour
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments & Notes</CardTitle>
              <CardDescription>Additional information and observations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Operator Comments</label>
                <textarea
                  name="operator_comments"
                  value={formData.operator_comments}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter any operator comments or notes..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Supervisor Comments</label>
                <textarea
                  name="supervisor_comments"
                  value={formData.supervisor_comments}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter supervisor comments or observations..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-0 sm:space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Submit Production Data
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}