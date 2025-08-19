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
  X
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
}

interface PDCAActionPlanProps {
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

export default function PDCAActionPlan({
  title,
  targetMetric,
  currentValue,
  targetValue,
  unit,
  isOpen,
  onClose,
  kpiType,
  scrapReason
}: PDCAActionPlanProps) {
  const [pdcaItems, setPdcaItems] = useState<PDCAItem[]>([
    // Example PDCA items based on common issues
    {
      id: '1',
      phase: 'plan',
      title: 'Root Cause Analysis',
      description: 'Conduct detailed root cause analysis using 5-Why methodology to identify underlying issues',
      assignee: 'Quality Manager',
      dueDate: '2025-08-25',
      status: 'pending',
      priority: 'high'
    },
    {
      id: '2',
      phase: 'plan',
      title: 'Set Improvement Target',
      description: `Establish SMART goal to achieve ${targetValue} ${unit} within 30 days`,
      assignee: 'Operations Manager',
      dueDate: '2025-08-22',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: '3',
      phase: 'do',
      title: 'Implement Corrective Actions',
      description: 'Execute planned improvements based on root cause analysis findings',
      assignee: 'Production Supervisor',
      dueDate: '2025-09-01',
      status: 'pending',
      priority: 'high'
    },
    {
      id: '4',
      phase: 'check',
      title: 'Monitor Progress',
      description: 'Track performance metrics daily and document progress toward target',
      assignee: 'Quality Technician',
      dueDate: '2025-09-15',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: '5',
      phase: 'act',
      title: 'Standardize Process',
      description: 'Update procedures and train staff to maintain improvements',
      assignee: 'Training Coordinator',
      dueDate: '2025-09-30',
      status: 'pending',
      priority: 'medium'
    }
  ])

  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Partial<PDCAItem>>({})
  const [showAddForm, setShowAddForm] = useState(false)

  if (!isOpen) return null

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'plan': return <ClipboardList className="h-4 w-4" />
      case 'do': return <Target className="h-4 w-4" />
      case 'check': return <CheckCircle className="h-4 w-4" />
      case 'act': return <RotateCcw className="h-4 w-4" />
      default: return null
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'plan': return 'bg-blue-100 text-blue-800'
      case 'do': return 'bg-orange-100 text-orange-800'
      case 'check': return 'bg-green-100 text-green-800'
      case 'act': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const variance = ((currentValue - targetValue) / targetValue) * 100
  const isOverTarget = currentValue > targetValue

  const addNewItem = () => {
    if (newItem.title && newItem.description && newItem.phase) {
      const item: PDCAItem = {
        id: Date.now().toString(),
        phase: newItem.phase as 'plan' | 'do' | 'check' | 'act',
        title: newItem.title,
        description: newItem.description,
        assignee: newItem.assignee || 'TBD',
        dueDate: newItem.dueDate || '',
        status: 'pending',
        priority: newItem.priority as 'low' | 'medium' | 'high' | 'critical' || 'medium'
      }
      setPdcaItems([...pdcaItems, item])
      setNewItem({})
      setShowAddForm(false)
    }
  }

  const updateItemStatus = (id: string, status: PDCAItem['status']) => {
    setPdcaItems(pdcaItems.map(item => 
      item.id === id ? { ...item, status } : item
    ))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PDCA Action Plan</h2>
            <p className="text-sm text-gray-600 mt-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Performance Gap */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Performance Gap Identified</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Current Value</p>
                <p className="text-xl font-bold text-red-600">{currentValue.toFixed(1)} {unit}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Target Value</p>
                <p className="text-xl font-bold text-green-600">{targetValue.toFixed(1)} {unit}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Variance</p>
                <p className={`text-xl font-bold ${isOverTarget ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverTarget ? '+' : ''}{variance.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-sm text-red-700 mt-2">
              <strong>Registrar Requirement:</strong> Action items required for all metrics missing target performance.
            </p>
          </div>

          {/* PDCA Phases */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {['plan', 'do', 'check', 'act'].map((phase) => (
              <Card key={phase} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getPhaseIcon(phase)}
                    <span className="capitalize">{phase}</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {phase === 'plan' && 'Identify problems and plan solutions'}
                    {phase === 'do' && 'Implement the planned actions'}
                    {phase === 'check' && 'Monitor and evaluate results'}
                    {phase === 'act' && 'Standardize successful improvements'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pdcaItems
                      .filter(item => item.phase === phase)
                      .map((item) => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <div className="flex gap-1">
                              <Badge className={getPriorityColor(item.priority)} variant="secondary">
                                {item.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{item.assignee}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{item.dueDate}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Badge className={getStatusColor(item.status)} variant="secondary">
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="mt-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemStatus(item.id, 'in_progress')}
                              className="text-xs py-1 px-2 h-6"
                            >
                              Start
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemStatus(item.id, 'completed')}
                              className="text-xs py-1 px-2 h-6"
                            >
                              Complete
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add New Action Item */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Action Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showAddForm ? (
                <Button onClick={() => setShowAddForm(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action Item
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        value={newItem.title || ''}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="Action item title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">PDCA Phase</label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={newItem.phase || ''}
                        onChange={(e) => setNewItem({ ...newItem, phase: e.target.value as any })}
                      >
                        <option value="">Select Phase</option>
                        <option value="plan">Plan</option>
                        <option value="do">Do</option>
                        <option value="check">Check</option>
                        <option value="act">Act</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={newItem.description || ''}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Detailed description of the action item"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Assignee</label>
                      <Input
                        value={newItem.assignee || ''}
                        onChange={(e) => setNewItem({ ...newItem, assignee: e.target.value })}
                        placeholder="Responsible person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Due Date</label>
                      <Input
                        type="date"
                        value={newItem.dueDate || ''}
                        onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={newItem.priority || 'medium'}
                        onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as any })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addNewItem} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save Action Item
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false)
                        setNewItem({})
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">PDCA Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {pdcaItems.filter(item => item.phase === 'plan').length}
                  </p>
                  <p className="text-sm text-blue-700">Plan Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {pdcaItems.filter(item => item.phase === 'do').length}
                  </p>
                  <p className="text-sm text-orange-700">Do Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {pdcaItems.filter(item => item.phase === 'check').length}
                  </p>
                  <p className="text-sm text-green-700">Check Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {pdcaItems.filter(item => item.phase === 'act').length}
                  </p>
                  <p className="text-sm text-purple-700">Act Items</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-blue-700">
                  <strong>Total Actions:</strong> {pdcaItems.length} items • 
                  <strong> Completed:</strong> {pdcaItems.filter(item => item.status === 'completed').length} • 
                  <strong> In Progress:</strong> {pdcaItems.filter(item => item.status === 'in_progress').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}