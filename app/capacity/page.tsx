'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Factory, TrendingUp, AlertCircle, Calendar, Activity, Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Capacity data for all presses
const capacityData = {
  summary: {
    totalPresses: 14,
    dateRange: 'August 1 - October 30, 2024',
    weeksAnalyzed: 50,
    averageOEE: 0.85
  },
  presses: [
    { id: '150t', name: '150-Ton', apw: 43006.25, mpw: 51607.5, allocation: 21.5, shifts: 3, status: 'optimal' },
    { id: '200t', name: '200-Ton', apw: 72036.5, mpw: 86443.8, allocation: 36.0, shifts: 3, status: 'optimal' },
    { id: '250t', name: '250-Ton', apw: 38009, mpw: 45610.8, allocation: 31.7, shifts: 2, status: 'optimal' },
    { id: '300t', name: '300-Ton', apw: 50895, mpw: 61074, allocation: 25.4, shifts: 3, status: 'optimal' },
    { id: '400t', name: '400-Ton', apw: 111779.75, mpw: 134135.7, allocation: 55.9, shifts: 3, status: 'warning' },
    { id: '600t', name: '600-Ton', apw: 99167.75, mpw: 119001.3, allocation: 49.6, shifts: 3, status: 'optimal' },
    { id: 'P600t', name: 'P600-Ton', apw: 118652.5, mpw: 142383, allocation: 59.3, shifts: 3, status: 'warning' },
    { id: 'P1000t', name: 'P1000-Ton', apw: 60360, mpw: 72432, allocation: 30.2, shifts: 3, status: 'optimal' },
    { id: '1200t', name: '1200-Ton', apw: 72006, mpw: 86407.2, allocation: 36.0, shifts: 3, status: 'optimal' },
    { id: 'P1400t', name: 'P1400-Ton', apw: 63523.5, mpw: 76228.2, allocation: 31.8, shifts: 3, status: 'optimal' },
    { id: '1600t', name: '1600-Ton', apw: 68549, mpw: 82258.8, allocation: 34.3, shifts: 3, status: 'optimal' },
    { id: 'P1500t', name: 'P1500-1-Ton', apw: 78330, mpw: 93996, allocation: 39.2, shifts: 3, status: 'optimal' },
    { id: 'P1500-2', name: 'P1500-2-Ton', apw: 54098.75, mpw: 64918.5, allocation: 27.0, shifts: 3, status: 'optimal' },
    { id: 'P3000', name: 'P3000-Ton', apw: 73008.25, mpw: 87609.9, allocation: 36.5, shifts: 3, status: 'optimal' }
  ]
};

export default function CapacityAnalysisPage() {
  const [selectedPress, setSelectedPress] = useState('all');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [dateFilter, setDateFilter] = useState('current');

  // Calculate overall metrics
  const totalAPW = capacityData.presses.reduce((sum, press) => sum + press.apw, 0);
  const totalMPW = capacityData.presses.reduce((sum, press) => sum + press.mpw, 0);
  const averageAllocation = capacityData.presses.reduce((sum, press) => sum + press.allocation, 0) / capacityData.presses.length;
  const pressesWarning = capacityData.presses.filter(p => p.status === 'warning').length;
  const pressesOptimal = capacityData.presses.filter(p => p.status === 'optimal').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Press Capacity Analysis</h1>
              <p className="text-gray-300 mt-2">Complete capacity planning for {capacityData.summary.dateRange}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {viewMode === 'summary' ? <BarChart3 className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                {viewMode === 'summary' ? 'Detailed View' : 'Summary View'}
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Presses</p>
                  <p className="text-2xl font-bold">{capacityData.summary.totalPresses}</p>
                </div>
                <Factory className="h-8 w-8 text-orange-400" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Average OEE</p>
                  <p className="text-2xl font-bold">{(capacityData.summary.averageOEE * 100).toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total APW</p>
                  <p className="text-2xl font-bold">{(totalAPW / 1000).toFixed(0)}K</p>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total MPW</p>
                  <p className="text-2xl font-bold">{(totalMPW / 1000).toFixed(0)}K</p>
                </div>
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Avg Allocation</p>
                  <p className="text-2xl font-bold">{averageAllocation.toFixed(1)}%</p>
                </div>
                <AlertCircle className={`h-8 w-8 ${averageAllocation > 50 ? 'text-yellow-400' : 'text-green-400'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              <button
                onClick={() => setSelectedPress('all')}
                className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                  selectedPress === 'all'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Presses
              </button>
              {capacityData.presses.map(press => (
                <button
                  key={press.id}
                  onClick={() => setSelectedPress(press.id)}
                  className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                    selectedPress === press.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {press.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        {selectedPress === 'all' ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Capacity Overview */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Factory className="h-5 w-5 text-gray-600" />
                  Capacity Overview by Press
                </h3>
                <div className="space-y-3">
                  {capacityData.presses.map(press => (
                    <div key={press.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded ${press.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                        <div>
                          <p className="font-medium">{press.name}</p>
                          <p className="text-sm text-gray-600">{press.shifts} shifts/day</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{press.allocation.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">allocation</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production Metrics */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  Production Metrics
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Actual Production Weekly (APW)</span>
                      <span className="font-bold text-lg">{(totalAPW / 1000).toFixed(1)}K parts</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: '85%' }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Max Production Weekly (MPW)</span>
                      <span className="font-bold text-lg">{(totalMPW / 1000).toFixed(1)}K parts</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Press Utilization</p>
                        <p className="text-xl font-bold text-green-600">{pressesOptimal} Optimal</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Need Attention</p>
                        <p className="text-xl font-bold text-yellow-600">{pressesWarning} Warning</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Press Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Detailed Press Capacity Data</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Press</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shifts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APW Parts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MPW Parts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {capacityData.presses.map(press => (
                      <tr key={press.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{press.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{press.shifts} shifts</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{press.apw.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{press.mpw.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{press.allocation.toFixed(1)}%</span>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  press.allocation > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(press.allocation, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            press.status === 'optimal' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {press.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => setSelectedPress(press.id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // Individual Press Details
          <div className="space-y-6">
            {(() => {
              const press = capacityData.presses.find(p => p.id === selectedPress);
              if (!press) return null;
              
              return (
                <>
                  {/* Press Header */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{press.name} Press Details</h2>
                        <p className="text-gray-600">Capacity analysis for {capacityData.summary.dateRange}</p>
                      </div>
                      <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                        press.status === 'optimal' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {press.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Press Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Shifts per Day</p>
                        <p className="text-2xl font-bold text-gray-900">{press.shifts}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">APW Production</p>
                        <p className="text-2xl font-bold text-blue-600">{(press.apw / 1000).toFixed(1)}K</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">MPW Capacity</p>
                        <p className="text-2xl font-bold text-purple-600">{(press.mpw / 1000).toFixed(1)}K</p>
                      </div>
                      <div className={`p-4 rounded-lg ${
                        press.allocation > 50 ? 'bg-yellow-50' : 'bg-green-50'
                      }`}>
                        <p className="text-sm text-gray-600">Allocation</p>
                        <p className={`text-2xl font-bold ${
                          press.allocation > 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {press.allocation.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold mb-4">Operating Parameters</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Operating Pattern</span>
                          <span className="font-medium">Progressive & Transfer</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Shifts per Day</span>
                          <span className="font-medium">{press.shifts}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Hours per Shift</span>
                          <span className="font-medium">8 hours</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Days per Week</span>
                          <span className="font-medium">5 days</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Net Available Time</span>
                          <span className="font-medium">112.5 hrs/week</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Demonstrated OEE</span>
                          <span className="font-medium">85%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold mb-4">Production Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Capacity Utilization</span>
                            <span className="font-medium">{((press.apw / press.mpw) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                              style={{ width: `${(press.apw / press.mpw) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Average SPM</p>
                          <p className="text-xl font-bold text-orange-600">24</p>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Strokes (50 weeks)</p>
                          <p className="text-xl font-bold text-gray-900">{(1032150).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {press.allocation > 50 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-lg font-semibold text-yellow-800 mb-2">Capacity Alert</h4>
                          <p className="text-yellow-700">
                            This press is operating at {press.allocation.toFixed(1)}% allocation. Consider:
                          </p>
                          <ul className="mt-2 space-y-1 text-yellow-700">
                            <li>• Redistributing workload to presses with lower allocation</li>
                            <li>• Adding additional shifts if demand continues</li>
                            <li>• Reviewing part routing for optimization opportunities</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}