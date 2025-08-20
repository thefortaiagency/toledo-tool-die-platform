'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Input } from '../../components/ui/input'
import { 
  ClipboardList, 
  Target, 
  CheckCircle, 
  RotateCcw, 
  Calendar, 
  User, 
  AlertTriangle,
  Plus,
  Edit,
  Save,
  X,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  MessageSquare,
  Paperclip,
  BarChart3,
  Flag,
  Archive,
  CheckSquare
} from 'lucide-react'

interface PDCAItem {
  id: string
  phase: 'plan' | 'do' | 'check' | 'act'
  title: string
  description: string
  assignee: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'critical'
  actualStartDate?: string
  actualEndDate?: string
  progress?: number
  estimatedHours?: number
  actualHours?: number
  cost?: number
  notes?: string
  attachments?: string[]
}

interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  actualDate?: string
  status: 'pending' | 'completed' | 'overdue'
  criteriaList: string[]
  completionNotes?: string
}

interface ProjectDetails {
  projectId: string
  projectName: string
  projectManager: string
  sponsor: string
  startDate: string
  targetEndDate: string
  estimatedBudget: number
  actualBudget: number
  riskLevel: 'low' | 'medium' | 'high'
  businessImpact: string
  successCriteria: string[]
  stakeholders: string[]
  roi: number
  resources: string[]
}

interface ProgressUpdate {
  id: string
  date: string
  author: string
  summary: string
  achievements: string[]
  challenges: string[]
  nextSteps: string[]
  overallProgress: number
  budget: number
  risks: string[]
}

interface EnhancedPDCAProjectProps {
  title: string
  targetMetric: string
  currentValue: number
  targetValue: number
  unit: string
  isOpen: boolean
  onClose: () => void
  kpiType?: string
  scrapReason?: string
}

export default function EnhancedPDCAProject({
  title,
  targetMetric,
  currentValue,
  targetValue,
  unit,
  isOpen,
  onClose,
  kpiType,
  scrapReason
}: EnhancedPDCAProjectProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'pdca' | 'milestones' | 'progress'>('overview')
  
  // Project state
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    projectId: `PROJ-${Date.now()}`,
    projectName: `${title} Improvement Project`,
    projectManager: 'Operations Manager',
    sponsor: 'Plant Manager',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedBudget: 10000,
    actualBudget: 0,
    riskLevel: currentValue < targetValue * 0.7 ? 'high' : currentValue < targetValue * 0.9 ? 'medium' : 'low',
    businessImpact: `Improve ${targetMetric} from ${currentValue} to ${targetValue} ${unit}`,
    successCriteria: [
      `Achieve target ${targetMetric} of ${targetValue} ${unit}`,
      'Implement sustainable process improvements',
      'Complete project within timeline',
      'Stay within budget constraints',
      'Achieve positive ROI within 12 months'
    ],
    stakeholders: ['Quality Manager', 'Production Supervisor', 'Operations Manager', 'Plant Manager', 'Maintenance Lead'],
    roi: 150, // Expected ROI percentage
    resources: ['Production team', 'Quality team', 'Maintenance support', 'Engineering consultation']
  })

  const [pdcaItems, setPdcaItems] = useState<PDCAItem[]>([
    {
      id: '1',
      phase: 'plan',
      title: 'Root Cause Analysis',
      description: 'Conduct detailed root cause analysis using 5-Why and fishbone diagram methodology',
      assignee: 'Quality Manager',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'high',
      estimatedHours: 16,
      cost: 800,
      progress: 0
    },
    {
      id: '2',
      phase: 'plan',
      title: 'Improvement Plan Development',
      description: 'Develop comprehensive improvement plan with specific actions and timelines',
      assignee: 'Operations Manager',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'high',
      estimatedHours: 12,
      cost: 600,
      progress: 0
    },
    {
      id: '3',
      phase: 'do',
      title: 'Process Changes Implementation',
      description: 'Execute planned process improvements and modifications',
      assignee: 'Production Supervisor',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'critical',
      estimatedHours: 40,
      cost: 3000,
      progress: 0
    },
    {
      id: '4',
      phase: 'do',
      title: 'Training & Communication',
      description: 'Train staff on new procedures and communicate changes to all stakeholders',
      assignee: 'Training Coordinator',
      dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'medium',
      estimatedHours: 24,
      cost: 1200,
      progress: 0
    },
    {
      id: '5',
      phase: 'check',
      title: 'Performance Monitoring',
      description: 'Monitor key metrics daily and collect performance data',
      assignee: 'Quality Technician',
      dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'high',
      estimatedHours: 20,
      cost: 1000,
      progress: 0
    },
    {
      id: '6',
      phase: 'check',
      title: 'Results Analysis',
      description: 'Analyze performance data and compare against targets',
      assignee: 'Quality Manager',
      dueDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'medium',
      estimatedHours: 8,
      cost: 400,
      progress: 0
    },
    {
      id: '7',
      phase: 'act',
      title: 'Process Standardization',
      description: 'Update procedures, work instructions, and documentation',
      assignee: 'Process Engineer',
      dueDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'medium',
      estimatedHours: 16,
      cost: 800,
      progress: 0
    },
    {
      id: '8',
      phase: 'act',
      title: 'Lessons Learned Documentation',
      description: 'Document lessons learned and best practices for future projects',
      assignee: 'Project Manager',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: 'low',
      estimatedHours: 6,
      cost: 300,
      progress: 0
    }
  ])

  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: 'Project Planning Complete',
      description: 'All planning activities completed and approved',
      targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      criteriaList: [
        'Root cause analysis completed',
        'Improvement plan approved',
        'Resources allocated',
        'Budget approved',
        'Team assigned'
      ]
    },
    {
      id: '2',
      title: 'Implementation Phase Complete',
      description: 'All planned improvements implemented and staff trained',
      targetDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      criteriaList: [
        'Process changes implemented',
        'Staff training completed',
        'New procedures documented',
        'Initial testing successful'
      ]
    },
    {
      id: '3',
      title: 'Performance Validation',
      description: 'Target performance achieved and validated',
      targetDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      criteriaList: [
        'Target metrics achieved',
        'Performance sustained for 2 weeks',
        'Statistical validation complete',
        'Stakeholder sign-off received'
      ]
    },
    {
      id: '4',
      title: 'Project Closure',
      description: 'Project formally closed with documentation complete',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      criteriaList: [
        'All deliverables completed',
        'Lessons learned documented',
        'Final report submitted',
        'Project archived',
        'Team recognition completed'
      ]
    }
  ])

  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      author: 'Project Manager',
      summary: 'Project initiated to address performance gap requiring immediate attention',
      achievements: [
        'Project charter approved',
        'Initial team meeting held',
        'PDCA framework established',
        'Project scope defined'
      ],
      challenges: [
        'Resource availability constraints',
        'Need for stakeholder alignment',
        'Potential scheduling conflicts'
      ],
      nextSteps: [
        'Begin detailed root cause analysis',
        'Schedule stakeholder meetings',
        'Finalize resource allocation',
        'Establish communication plan'
      ],
      overallProgress: 5,
      budget: 500,
      risks: [
        'Resource conflicts with other projects',
        'Potential resistance to change'
      ]
    }
  ])

  if (!isOpen) return null

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'plan': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'do': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'check': return 'bg-green-100 text-green-800 border-green-200'
      case 'act': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  const calculateOverallProgress = () => {
    if (pdcaItems.length === 0) return 0
    const totalProgress = pdcaItems.reduce((sum, item) => sum + (item.progress || 0), 0)
    return Math.round(totalProgress / pdcaItems.length)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Project Management System</h2>
                <p className="text-orange-100 mt-1">{title}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-lg">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{projectDetails.projectId}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-lg">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">{calculateOverallProgress()}% Complete</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-gray-50">
          <nav className="px-6 flex space-x-8">
            {[
              { key: 'overview', label: 'Project Overview', icon: FileText },
              { key: 'pdca', label: 'PDCA Actions', icon: ClipboardList },
              { key: 'milestones', label: 'Milestones', icon: Flag },
              { key: 'progress', label: 'Progress Updates', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Performance Gap Banner - Always visible */}
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Critical Performance Gap Requiring Action</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-red-700 font-medium text-sm">Current Value</p>
                <p className="text-2xl font-bold text-red-600">{currentValue} {unit}</p>
              </div>
              <div>
                <p className="text-green-700 font-medium text-sm">Target Value</p>
                <p className="text-2xl font-bold text-green-600">{targetValue} {unit}</p>
              </div>
              <div>
                <p className="text-orange-700 font-medium text-sm">Gap to Close</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.abs(targetValue - currentValue).toFixed(1)} {unit}
                </p>
              </div>
              <div>
                <p className="text-purple-700 font-medium text-sm">Estimated Impact</p>
                <p className="text-2xl font-bold text-purple-600">${((targetValue - currentValue) * 100).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {kpiType && (
                <Badge className="bg-blue-100 text-blue-800">KPI: {kpiType}</Badge>
              )}
              {scrapReason && (
                <Badge className="bg-red-100 text-red-800">Scrap: {scrapReason}</Badge>
              )}
              <Badge className={getRiskColor(projectDetails.riskLevel)}>
                Risk Level: {projectDetails.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Project Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Project Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-600" />
                        Project Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Project Manager</label>
                          <Input 
                            value={projectDetails.projectManager}
                            onChange={(e) => setProjectDetails({...projectDetails, projectManager: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Sponsor</label>
                          <Input 
                            value={projectDetails.sponsor}
                            onChange={(e) => setProjectDetails({...projectDetails, sponsor: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Start Date</label>
                          <Input 
                            type="date"
                            value={projectDetails.startDate}
                            onChange={(e) => setProjectDetails({...projectDetails, startDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Target End Date</label>
                          <Input 
                            type="date"
                            value={projectDetails.targetEndDate}
                            onChange={(e) => setProjectDetails({...projectDetails, targetEndDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Estimated Budget</label>
                          <Input 
                            type="number"
                            value={projectDetails.estimatedBudget}
                            onChange={(e) => setProjectDetails({...projectDetails, estimatedBudget: Number(e.target.value)})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Expected ROI (%)</label>
                          <Input 
                            type="number"
                            value={projectDetails.roi}
                            onChange={(e) => setProjectDetails({...projectDetails, roi: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Business Impact</label>
                        <Textarea 
                          value={projectDetails.businessImpact}
                          onChange={(e) => setProjectDetails({...projectDetails, businessImpact: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Success Criteria & Stakeholders */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-green-600" />
                        Success Criteria & Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Success Criteria</label>
                        <div className="space-y-2">
                          {projectDetails.successCriteria.map((criteria, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{criteria}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Key Stakeholders</label>
                        <div className="flex flex-wrap gap-2">
                          {projectDetails.stakeholders.map((stakeholder, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800">
                              <User className="w-3 h-3 mr-1" />
                              {stakeholder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Project Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Project Metrics Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-blue-600">{calculateOverallProgress()}%</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Overall Progress</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-green-600">
                              {pdcaItems.filter(item => item.status === 'completed').length}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Tasks Completed</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-orange-600">
                              ${projectDetails.actualBudget.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Actual Spend</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-purple-600">
                              {Math.round((Date.now() - new Date(projectDetails.startDate).getTime()) / (24 * 60 * 60 * 1000))}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Days Elapsed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PDCA Actions Tab */}
            {activeTab === 'pdca' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">PDCA Action Items</h3>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action Item
                  </Button>
                </div>

                {/* PDCA Phase Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { phase: 'plan', label: 'Plan', color: 'blue', icon: ClipboardList },
                    { phase: 'do', label: 'Do', color: 'orange', icon: Target },
                    { phase: 'check', label: 'Check', color: 'green', icon: CheckCircle },
                    { phase: 'act', label: 'Act', color: 'purple', icon: RotateCcw }
                  ].map(({ phase, label, color, icon: Icon }) => {
                    const phaseItems = pdcaItems.filter(item => item.phase === phase)
                    const completed = phaseItems.filter(item => item.status === 'completed').length
                    return (
                      <div key={phase} className={`p-4 rounded-lg border-2 bg-${color}-50 border-${color}-200`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-5 h-5 text-${color}-600`} />
                          <h4 className={`font-semibold text-${color}-800`}>{label}</h4>
                        </div>
                        <div className={`text-2xl font-bold text-${color}-600`}>
                          {completed}/{phaseItems.length}
                        </div>
                        <p className={`text-sm text-${color}-700`}>Items Completed</p>
                      </div>
                    )
                  })}
                </div>

                {/* PDCA Items List */}
                <div className="space-y-4">
                  {pdcaItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPhaseColor(item.phase)}>
                                {item.phase.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge className={item.priority === 'critical' ? 'bg-red-100 text-red-800' : 
                                               item.priority === 'high' ? 'bg-orange-100 text-orange-800' : 
                                               'bg-gray-100 text-gray-800'}>
                                {item.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                            <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{item.assignee}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{item.dueDate}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{item.estimatedHours}h est.</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">${item.cost}</span>
                              </div>
                            </div>
                            {item.progress !== undefined && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700">Progress</span>
                                  <span className="text-sm text-gray-600">{item.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Tab */}
            {activeTab === 'milestones' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Project Milestones</h3>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>

                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <Card key={milestone.id} className="relative">
                      {/* Timeline connector */}
                      {index < milestones.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-300 z-0" />
                      )}
                      
                      <CardContent className="p-6 relative">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                            milestone.status === 'completed' ? 'bg-green-100 border-4 border-green-500' :
                            milestone.status === 'overdue' ? 'bg-red-100 border-4 border-red-500' :
                            'bg-gray-100 border-4 border-gray-300'
                          }`}>
                            {milestone.status === 'completed' ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <Flag className={`w-6 h-6 ${
                                milestone.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
                              }`} />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-lg text-gray-900">{milestone.title}</h4>
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{milestone.description}</p>
                            
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Target: {milestone.targetDate}</span>
                              </div>
                              {milestone.actualDate && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-green-600">Completed: {milestone.actualDate}</span>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Completion Criteria:</h5>
                              <div className="space-y-1">
                                {milestone.criteriaList.map((criteria, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center">
                                      {milestone.status === 'completed' && (
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-600">{criteria}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Updates Tab */}
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Progress Updates</h3>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Progress Update
                  </Button>
                </div>

                <div className="space-y-6">
                  {progressUpdates.map((update) => (
                    <Card key={update.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                            {update.date} - {update.author}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-800">
                              {update.overallProgress}% Complete
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              ${update.budget.toLocaleString()} Spent
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                          <p className="text-gray-600">{update.summary}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h5 className="font-medium text-green-700 mb-2">✅ Achievements</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {update.achievements.map((achievement, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  {achievement}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-red-700 mb-2">⚠️ Challenges</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {update.challenges.map((challenge, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  {challenge}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-blue-700 mb-2">🎯 Next Steps</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {update.nextSteps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        {update.risks.length > 0 && (
                          <div>
                            <h5 className="font-medium text-orange-700 mb-2">🚨 Current Risks</h5>
                            <div className="flex flex-wrap gap-2">
                              {update.risks.map((risk, idx) => (
                                <Badge key={idx} className="bg-orange-100 text-orange-800">
                                  {risk}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}