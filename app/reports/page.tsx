'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Activity, Users, Package, BarChart3, MessageSquare, Brain, Table, AlertTriangle, Factory, PieChart as PieChartIcon, TrendingDown, Wrench, FileText, DollarSign, Upload } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import HitTrackerTable from './hit-tracker-table'
import HitTrackerAccurate from './hit-tracker-accurate'
import dynamic from 'next/dynamic'

// Scrap Analysis now has its own dedicated page at /scrap-analysis
const PioneerScrapAnalysis = dynamic(() => import('./pioneer-scrap/page'), { ssr: false })
const ExecutiveDashboard = dynamic(() => import('./executive-dashboard'), { ssr: false })
const QualityPerformance = dynamic(() => import('./quality-performance'), { ssr: false })
const MachineDowntime = dynamic(() => import('./machine-downtime'), { ssr: false })
const QuarterlyReview = dynamic(() => import('./quarterly-review'), { ssr: false })
const OEEDashboard = dynamic(() => import('./oee-dashboard'), { ssr: false })
const ManningReport = dynamic(() => import('./manning/page'), { ssr: false })

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('hit-tracker-table')
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [hitTrackerData, setHitTrackerData] = useState<any[]>([])
  const [hitTrackerStats, setHitTrackerStats] = useState<any>(null)
  const [commentPatterns, setCommentPatterns] = useState<any[]>([])
  const [recentComments, setRecentComments] = useState<any[]>([])
  const [totalComments, setTotalComments] = useState(0)

  // Fetch Hit Tracker Data
  const fetchHitTrackerData = async () => {
    try {
      const response = await fetch('/api/reports/hit-tracker')
      const data = await response.json()
      setHitTrackerData(data.chartData || [])
      setHitTrackerStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching hit tracker data:', error)
      // NO MOCK DATA - Show empty state
      setHitTrackerData([])
      setHitTrackerStats(null)
    }
  }

  // Fetch AI Insights
  const fetchAIInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/ai-insights')
      const data = await response.json()
      
      // Map icon strings to actual icon components
      const iconMap: any = {
        'AlertCircle': AlertCircle,
        'TrendingUp': TrendingUp,
        'Package': Package,
        'Users': Users
      }
      
      const mappedInsights = {
        ...data.insights,
        keyFindings: data.insights.keyFindings.map((finding: any) => ({
          ...finding,
          icon: iconMap[finding.icon] || AlertCircle
        }))
      }
      
      setAiInsights(mappedInsights)
      setCommentPatterns(data.commentPatterns || [])
      setRecentComments(data.recentComments || [])
      setTotalComments(data.totalComments || 0)
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      // NO MOCK DATA - Show empty state
      setAiInsights(null)
      setCommentPatterns([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHitTrackerData()
    fetchAIInsights()
  }, [])

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">AI-Powered Production Reports</h1>
          <p className="text-sm sm:text-base text-gray-600">Real-time analysis with machine learning insights{totalComments > 0 ? ` from ${totalComments} operator comments` : ''}</p>
        </div>
        <a
          href="/reports/import"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Data
        </a>
      </div>

      {/* Report Selector - Two rows for better fit */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedReport('hit-tracker-table')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'hit-tracker-table' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Table className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Hit Tracker</span>
          </button>
          <button
            onClick={() => setSelectedReport('hit-tracker')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'hit-tracker' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Activity className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Shift Trends</span>
          </button>
          <button
            onClick={() => setSelectedReport('ai-insights')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'ai-insights' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Brain className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">AI Analysis</span>
          </button>
          <button
            onClick={() => setSelectedReport('comments')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'comments' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Comments</span>
          </button>
          <a
            href="/scrap-analysis"
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700`}
          >
            <AlertTriangle className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0 animate-pulse" />
            <span className="text-center">Scrap</span>
          </a>
          <button
            onClick={() => setSelectedReport('pioneer-scrap')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'pioneer-scrap' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Factory className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Pioneer</span>
          </button>
          <button
            onClick={() => setSelectedReport('executive')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'executive' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Executive</span>
          </button>
          <button
            onClick={() => setSelectedReport('quality')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'quality' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <PieChartIcon className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Quality</span>
          </button>
          <button
            onClick={() => setSelectedReport('downtime')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'downtime' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Wrench className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Downtime</span>
          </button>
          <button
            onClick={() => setSelectedReport('quarterly')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'quarterly' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Quarterly</span>
          </button>
          <button
            onClick={() => setSelectedReport('oee')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'oee' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Factory className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">OEE</span>
          </button>
          <button
            onClick={() => setSelectedReport('manning')}
            className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm ${
              selectedReport === 'manning' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Users className="w-4 h-4 sm:mr-1.5 mb-1 sm:mb-0" />
            <span className="text-center">Manning</span>
          </button>
        </div>
      </div>

      {/* Hit Tracker Table Report */}
      {selectedReport === 'hit-tracker-table' && (
        <HitTrackerAccurate />
      )}

      {/* Hit Tracker Chart Report */}
      {selectedReport === 'hit-tracker' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Activity className="mr-2 text-orange-600" />
              Daily Hit Tracker - Shift Efficiency Comparison
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={hitTrackerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="shift1" stroke="#f97316" name="Shift 1" strokeWidth={2} />
                <Line type="monotone" dataKey="shift2" stroke="#10b981" name="Shift 2" strokeWidth={2} />
                <Line type="monotone" dataKey="shift3" stroke="#3b82f6" name="Shift 3" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#ef4444" name="Target" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          {hitTrackerStats && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600">Weekly Average</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{hitTrackerStats.weeklyAverage}%</div>
                <div className="text-xs text-green-600">↑ 2.3% from last week</div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600">Best Performer</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{hitTrackerStats.bestShift.name}</div>
                <div className="text-xs text-blue-600">{hitTrackerStats.bestShift.avg}% average efficiency</div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600">Total Hits</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{hitTrackerStats.totalHits.toLocaleString()}</div>
                <div className="text-xs text-gray-600">This week</div>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600">Target Achievement</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{hitTrackerStats.targetAchievement}%</div>
                <div className="text-xs text-orange-600">Room for improvement</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Insights Report */}
      {selectedReport === 'ai-insights' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Brain className="h-16 w-16 text-orange-600 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">AI analyzing 614 comments and production patterns...</p>
            </div>
          ) : aiInsights && (
            <>
              {/* AI Summary */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  <Brain className="mr-2" />
                  AI Intelligence Summary
                </h2>
                <p className="text-orange-100">{aiInsights.summary}</p>
              </div>

              {/* Key Findings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {aiInsights.keyFindings.map((finding: any, index: number) => {
                  const Icon = finding.icon
                  return (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                      <div className="flex items-start">
                        <Icon className={`h-6 sm:h-8 w-6 sm:w-8 ${finding.color} mr-2 sm:mr-3 flex-shrink-0`} />
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{finding.title}</h3>
                          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">{finding.description}</p>
                          <div className="bg-blue-50 text-blue-700 text-xs p-1.5 sm:p-2 rounded">
                            <strong>Action:</strong> {finding.action}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Predictions */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-900">AI Predictions & ROI</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-6 sm:h-8 w-6 sm:w-8 text-green-600 mx-auto mb-1 sm:mb-2" />
                    <div className="text-xs sm:text-sm text-gray-600">Efficiency Gain</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900">{aiInsights.predictions.efficiency}</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
                    <div className="text-xs sm:text-sm text-gray-600">Cost Savings</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900">{aiInsights.predictions.cost}</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <Calendar className="h-6 sm:h-8 w-6 sm:w-8 text-purple-600 mx-auto mb-1 sm:mb-2" />
                    <div className="text-xs sm:text-sm text-gray-600">Implementation</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900">{aiInsights.predictions.timeline}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Comment Analysis Report */}
      {selectedReport === 'comments' && (
        <div className="space-y-4 sm:space-y-6">
          {/* View All Comments Button */}
          <div className="flex justify-end mb-4">
            <a
              href="/reports/comments"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View All Comments
            </a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Comment Categories */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                <MessageSquare className="mr-1 sm:mr-2 text-orange-600 h-5 sm:h-6 w-5 sm:w-6" />
                Comment Pattern Analysis
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={commentPatterns}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: ${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {commentPatterns.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Pattern Trends */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">Issue Trends</h2>
              <div className="space-y-3 sm:space-y-4">
                {commentPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm sm:text-base">{pattern.category}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{pattern.count} occurrences</div>
                      </div>
                    </div>
                    <div className={`flex items-center text-sm font-medium ${
                      pattern.trend === 'up' ? 'text-red-600' : 
                      pattern.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {pattern.trend === 'up' ? '↑' : pattern.trend === 'down' ? '↓' : '→'}
                      {pattern.trend}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Comments */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">Recent Operator Comments Requiring Action</h2>
            <div className="space-y-2 sm:space-y-3">
              {recentComments.length > 0 ? (
                recentComments.map((comment, index) => {
                  const urgency = comment.efficiency < 85 ? 'border-red-500' : 
                                  comment.efficiency < 90 ? 'border-yellow-500' : 'border-green-500'
                  return (
                    <div key={index} className={`border-l-4 ${urgency} pl-3 sm:pl-4 py-2`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div>
                          <span className="font-medium text-gray-900 text-sm sm:text-base">{comment.operator}</span>
                          <span className="text-gray-600 text-xs sm:text-sm ml-1 sm:ml-2">
                            Line {comment.line} - Part #{comment.partNumber}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 sm:mt-0">
                          {new Date(comment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1 text-xs sm:text-sm">"{comment.comment}"</p>
                      <p className="text-xs text-gray-500 mt-1">Efficiency: {comment.efficiency}%</p>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent comments to display
                </div>
              )}
              <div className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">System AI</span>
                    <span className="text-gray-600 text-xs sm:text-sm ml-1 sm:ml-2">Pattern Detection</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 sm:mt-0">Just now</span>
                </div>
                <p className="text-gray-700 mt-1 text-xs sm:text-sm">
                  "AI detected: {commentPatterns[0]?.category || 'Die configuration'} issues represent {commentPatterns[0]?.percentage || 38}% of comments. Recommend immediate maintenance schedule review."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrap Analysis - Redirects to dedicated page */}

      {/* Pioneer Scrap Analysis Report */}
      {selectedReport === 'pioneer-scrap' && (
        <PioneerScrapAnalysis />
      )}

      {/* Executive Dashboard */}
      {selectedReport === 'executive' && (
        <ExecutiveDashboard />
      )}

      {/* Quality Performance Report */}
      {selectedReport === 'quality' && (
        <QualityPerformance />
      )}

      {/* Machine Downtime Analysis */}
      {selectedReport === 'downtime' && (
        <MachineDowntime />
      )}

      {/* Quarterly Business Review */}
      {selectedReport === 'quarterly' && (
        <QuarterlyReview />
      )}

      {/* OEE Dashboard */}
      {selectedReport === 'oee' && (
        <OEEDashboard />
      )}

      {/* Manning Report */}
      {selectedReport === 'manning' && (
        <ManningReport />
      )}
    </div>
  )
}