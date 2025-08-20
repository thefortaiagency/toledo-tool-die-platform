'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ClipboardList, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Filter,
  Search,
  Download,
  Plus,
  ChevronRight,
  AlertCircle,
  Activity,
  FileText,
  BarChart3
} from 'lucide-react'
import EnhancedPDCAProject from '../components/EnhancedPDCAProject'

interface PDCAProject {
  id: string
  projectId: string
  projectName: string
  projectType: string
  targetMetric: string
  currentValue: number
  targetValue: number
  unit: string
  projectManager: string
  sponsor: string
  startDate: string
  targetEndDate: string
  actualEndDate?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  riskLevel: 'low' | 'medium' | 'high'
  businessImpact: string
  totalActions: number
  completedActions: number
  inProgressActions: number
  totalMilestones: number
  completedMilestones: number
  overallProgress: number
  lastUpdateDate: string
}

export default function CorrectiveActionsPage() {
  const [projects, setProjects] = useState<PDCAProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [selectedProject, setSelectedProject] = useState<PDCAProject | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pdca-projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data || [])
      } else {
        // If no projects exist yet, show empty state
        setProjects([])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (project: PDCAProject) => {
    const today = new Date()
    const targetDate = new Date(project.targetEndDate)
    const daysUntilDue = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Completed projects
    if (project.status === 'completed') {
      return { color: 'green', badge: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    // Cancelled or on hold
    if (project.status === 'cancelled' || project.status === 'on_hold') {
      return { color: 'gray', badge: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }
    
    // Active projects - check progress vs timeline
    if (project.status === 'active') {
      // Overdue
      if (daysUntilDue < 0) {
        return { color: 'red', badge: 'bg-red-100 text-red-800', icon: AlertTriangle }
      }
      
      // Due soon (within 7 days)
      if (daysUntilDue <= 7) {
        return { color: 'yellow', badge: 'bg-yellow-100 text-yellow-800', icon: Clock }
      }
      
      // Check if progress is on track
      const startDate = new Date(project.startDate)
      const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const expectedProgress = (daysElapsed / totalDays) * 100
      
      if (project.overallProgress < expectedProgress - 20) {
        // Behind schedule
        return { color: 'yellow', badge: 'bg-yellow-100 text-yellow-800', icon: Clock }
      }
      
      // On track
      return { color: 'green', badge: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    // Planning phase
    return { color: 'blue', badge: 'bg-blue-100 text-blue-800', icon: Activity }
  }

  const getProjectTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'scrap_reduction': 'Scrap Reduction',
      'downtime_reduction': 'Downtime Reduction',
      'quality_improvement': 'Quality Improvement',
      'cost_reduction': 'Cost Reduction',
      'safety_improvement': 'Safety Improvement',
      'efficiency_improvement': 'Efficiency Improvement',
      'other': 'Other'
    }
    return typeMap[type] || type
  }

  const getProjectTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'scrap_reduction': AlertTriangle,
      'downtime_reduction': Clock,
      'quality_improvement': CheckCircle,
      'cost_reduction': TrendingUp,
      'safety_improvement': AlertCircle,
      'efficiency_improvement': Activity,
      'other': FileText
    }
    const Icon = iconMap[type] || FileText
    return <Icon className="h-4 w-4" />
  }

  const filteredProjects = projects.filter(project => {
    if (selectedStatus !== 'all' && project.status !== selectedStatus) return false
    if (selectedType !== 'all' && project.projectType !== selectedType) return false
    if (searchTerm && !project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !project.projectId.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    planning: projects.filter(p => p.status === 'planning').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
    overdue: projects.filter(p => {
      const targetDate = new Date(p.targetEndDate)
      return p.status === 'active' && targetDate < new Date()
    }).length
  }

  const averageProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.overallProgress, 0) / projects.length)
    : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Corrective Actions Tracker</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Centralized PDCA project management and tracking
            </p>
          </div>
          <Button
            onClick={() => setShowNewProject(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Projects</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.planning}</p>
                <p className="text-xs text-gray-600">Planning</p>
              </div>
              <ClipboardList className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-xs text-gray-600">Overdue</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{averageProgress}%</p>
                <p className="text-xs text-gray-600">Avg Progress</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-3 py-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="scrap_reduction">Scrap Reduction</option>
              <option value="downtime_reduction">Downtime Reduction</option>
              <option value="quality_improvement">Quality Improvement</option>
              <option value="cost_reduction">Cost Reduction</option>
              <option value="safety_improvement">Safety Improvement</option>
              <option value="efficiency_improvement">Efficiency Improvement</option>
            </select>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Corrective Actions</CardTitle>
          <CardDescription>
            All PDCA projects initiated from various performance gaps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No corrective actions found</p>
              <p className="text-sm text-gray-500 mt-2">
                Projects will appear here when PDCA actions are initiated from performance reports
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Project ID</th>
                    <th className="text-left py-3 px-2">Project Name</th>
                    <th className="text-left py-3 px-2">Type</th>
                    <th className="text-left py-3 px-2">Manager</th>
                    <th className="text-left py-3 px-2">Target Date</th>
                    <th className="text-left py-3 px-2">Progress</th>
                    <th className="text-left py-3 px-2">Actions</th>
                    <th className="text-left py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => {
                    const statusInfo = getStatusColor(project)
                    const StatusIcon = statusInfo.icon
                    const daysUntilDue = Math.ceil(
                      (new Date(project.targetEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    
                    return (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${statusInfo.color}-500`} />
                            <StatusIcon className={`h-4 w-4 text-${statusInfo.color}-600`} />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-sm">{project.projectId}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{project.projectName}</p>
                            <p className="text-xs text-gray-600">
                              Target: {project.targetValue} {project.unit} (Current: {project.currentValue})
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {getProjectTypeIcon(project.projectType)}
                            <span className="text-sm">{getProjectTypeLabel(project.projectType)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{project.projectManager}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-sm">{new Date(project.targetEndDate).toLocaleDateString()}</p>
                            {project.status === 'active' && (
                              <p className={`text-xs ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Progress value={project.overallProgress} className="w-20 h-2" />
                              <span className="text-sm font-medium">{project.overallProgress}%</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {project.completedActions}/{project.totalActions} actions
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={statusInfo.badge} variant="secondary">
                            {project.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedProject(project)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details Modal */}
      {selectedProject && (
        <EnhancedPDCAProject
          title={selectedProject.projectName}
          targetMetric={selectedProject.targetMetric}
          currentValue={selectedProject.currentValue}
          targetValue={selectedProject.targetValue}
          unit={selectedProject.unit}
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          projectId={selectedProject.projectId}
        />
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <EnhancedPDCAProject
          title="New Corrective Action Project"
          targetMetric=""
          currentValue={0}
          targetValue={0}
          unit=""
          isOpen={true}
          onClose={() => {
            setShowNewProject(false)
            fetchProjects() // Refresh the list
          }}
        />
      )}
    </div>
  )
}