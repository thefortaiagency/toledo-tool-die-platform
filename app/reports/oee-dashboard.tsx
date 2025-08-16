'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Gauge, Factory } from 'lucide-react'
import hitTrackerData from '../../hit-tracker-processed.json'

export default function OEEDashboard() {
  // Process OEE data from imported hit tracker
  const oeeMetrics = hitTrackerData.oee.filter(m => m.oee !== '0.0')
  
  // World-class OEE benchmark
  const worldClassOEE = 85
  
  // Calculate plant-wide OEE
  const plantOEE = oeeMetrics.length > 0 
    ? (oeeMetrics.reduce((sum, m) => sum + parseFloat(m.oee), 0) / oeeMetrics.length).toFixed(1)
    : '0.0'
  
  // Format data for charts
  const machineOEEData = oeeMetrics.map(m => ({
    machine: m.machine,
    availability: parseFloat(m.availability),
    performance: parseFloat(m.performance),
    quality: parseFloat(m.quality),
    oee: parseFloat(m.oee),
    target: worldClassOEE
  }))
  
  // Calculate OEE components average
  const avgAvailability = oeeMetrics.length > 0
    ? (oeeMetrics.reduce((sum, m) => sum + parseFloat(m.availability), 0) / oeeMetrics.length).toFixed(1)
    : '0'
  
  const avgPerformance = oeeMetrics.length > 0
    ? (oeeMetrics.reduce((sum, m) => sum + parseFloat(m.performance), 0) / oeeMetrics.length).toFixed(1)
    : '0'
  
  const avgQuality = oeeMetrics.length > 0
    ? (oeeMetrics.reduce((sum, m) => sum + parseFloat(m.quality), 0) / oeeMetrics.length).toFixed(1)
    : '0'
  
  // Radial chart data for OEE gauge
  const radialData = [{
    name: 'OEE',
    value: parseFloat(plantOEE),
    fill: parseFloat(plantOEE) >= 85 ? '#10b981' : parseFloat(plantOEE) >= 65 ? '#f59e0b' : '#ef4444'
  }]
  
  // Hit production data
  const weeklyProduction = hitTrackerData.summary.totalWeeklyHits
  const yearlyProjection = weeklyProduction * 52
  
  // Status indicators
  const getOEEStatus = (oee: number) => {
    if (oee >= 85) return { color: 'bg-green-500', text: 'World Class', icon: CheckCircle }
    if (oee >= 65) return { color: 'bg-yellow-500', text: 'Typical', icon: AlertTriangle }
    if (oee >= 40) return { color: 'bg-orange-500', text: 'Low', icon: AlertTriangle }
    return { color: 'bg-red-500', text: 'Poor', icon: AlertTriangle }
  }
  
  const plantStatus = getOEEStatus(parseFloat(plantOEE))

  return (
    <div className="space-y-6">
      {/* Header with Plant OEE */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">OEE Dashboard</h1>
            <p className="text-blue-100">Overall Equipment Effectiveness Analysis</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{plantOEE}%</div>
            <Badge className={`${plantStatus.color} text-white border-0`}>
              {plantStatus.text}
            </Badge>
          </div>
        </div>
      </div>

      {/* OEE Components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Availability
            </CardTitle>
            <CardDescription>Equipment uptime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{avgAvailability}%</div>
            <Progress value={parseFloat(avgAvailability)} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">Target: 90%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-green-500" />
              Performance
            </CardTitle>
            <CardDescription>Production speed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{avgPerformance}%</div>
            <Progress value={parseFloat(avgPerformance)} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">Target: 95%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              Quality
            </CardTitle>
            <CardDescription>First pass yield</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{avgQuality}%</div>
            <Progress value={parseFloat(avgQuality)} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">Target: 99.9%</p>
          </CardContent>
        </Card>
      </div>

      {/* Machine OEE Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Machine OEE Breakdown</CardTitle>
          <CardDescription>Individual machine performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={machineOEEData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="machine" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="availability" fill="#3b82f6" name="Availability %" />
              <Bar dataKey="performance" fill="#10b981" name="Performance %" />
              <Bar dataKey="quality" fill="#8b5cf6" name="Quality %" />
              <Bar dataKey="oee" fill="#f59e0b" name="OEE %" />
              <Bar dataKey="target" fill="#e5e7eb" name="Target OEE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Production Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OEE Gauge */}
        <Card>
          <CardHeader>
            <CardTitle>Plant OEE Score</CardTitle>
            <CardDescription>Overall equipment effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                barSize={20} 
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  fill={radialData[0].fill}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan className="text-4xl font-bold" fill="#333">{plantOEE}%</tspan>
                  <tspan x="50%" y="50%" dy="30" className="text-sm" fill="#666">Plant OEE</tspan>
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div>
                <div className="text-xs text-gray-500">World Class</div>
                <div className="text-sm font-bold text-green-600">≥85%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Typical</div>
                <div className="text-sm font-bold text-yellow-600">65-84%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Low</div>
                <div className="text-sm font-bold text-red-600">&lt;65%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Production Summary</CardTitle>
            <CardDescription>Hit tracking and efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Weekly Production</span>
              </div>
              <span className="text-xl font-bold">{weeklyProduction.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-medium">Yearly Projection</span>
              </div>
              <span className="text-xl font-bold">{yearlyProjection.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Active Machines</span>
              </div>
              <span className="text-xl font-bold">{oeeMetrics.length}</span>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">OEE Improvement Opportunity</h4>
              {parseFloat(plantOEE) < worldClassOEE ? (
                <div>
                  <p className="text-sm text-gray-600">
                    Reaching world-class OEE of {worldClassOEE}% would increase production by{' '}
                    <span className="font-bold text-blue-600">
                      {((worldClassOEE / parseFloat(plantOEE) - 1) * 100).toFixed(0)}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Focus on: {parseFloat(avgAvailability) < 90 ? 'Availability' : parseFloat(avgPerformance) < 95 ? 'Performance' : 'Quality'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-green-600 font-medium">
                  Congratulations! You\'ve achieved world-class OEE performance.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>OEE Improvement Recommendations</CardTitle>
          <CardDescription>Based on current performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {parseFloat(avgAvailability) < 90 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Improve Availability</h4>
                  <p className="text-sm text-gray-600">
                    Current: {avgAvailability}% | Target: 90% | Implement preventive maintenance schedules and reduce changeover times
                  </p>
                </div>
              </div>
            )}
            
            {parseFloat(avgPerformance) < 95 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Gauge className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Enhance Performance</h4>
                  <p className="text-sm text-gray-600">
                    Current: {avgPerformance}% | Target: 95% | Optimize cycle times and reduce minor stops
                  </p>
                </div>
              </div>
            )}
            
            {parseFloat(avgQuality) < 99 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Boost Quality</h4>
                  <p className="text-sm text-gray-600">
                    Current: {avgQuality}% | Target: 99.9% | Implement quality checks and reduce rework
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}