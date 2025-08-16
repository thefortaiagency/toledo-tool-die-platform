'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, Filter, AlertCircle, TrendingUp, Package, 
  Calendar, Clock, Search, ChevronDown, X, AlertTriangle,
  CheckCircle, Factory, Wrench, Settings, Box, Layers
} from 'lucide-react'

interface Comment {
  id: string
  date: string
  machine: string
  machine_id: string
  shift: number
  operator: string
  comment: string
  categories: string[]
  priority: 'high' | 'medium' | 'low'
  efficiency: number
  downtime: number
  hits: number
  part_number: string
}

interface Statistics {
  totalComments: number
  categories: Array<{
    category: string
    count: number
    percentage: number
  }>
  priorities: {
    high: number
    medium: number
    low: number
  }
  machines: Record<string, number>
}

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  'Die/Tooling Issue': Wrench,
  'Material Issue': Box,
  'Setup/Changeover': Settings,
  'Maintenance Required': AlertTriangle,
  'Quality Issue': AlertCircle,
  'Machine Issue': Factory,
  'Critical Performance': TrendingUp,
  'Below Target': TrendingUp,
  'Exceeding Target': CheckCircle,
  'Significant Downtime': Clock,
  'Uncategorized': MessageSquare
}

// Color mapping for categories
const categoryColors: Record<string, string> = {
  'Die/Tooling Issue': 'bg-blue-100 text-blue-800 border-blue-200',
  'Material Issue': 'bg-purple-100 text-purple-800 border-purple-200',
  'Setup/Changeover': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Maintenance Required': 'bg-red-100 text-red-800 border-red-200',
  'Quality Issue': 'bg-orange-100 text-orange-800 border-orange-200',
  'Machine Issue': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Critical Performance': 'bg-red-100 text-red-800 border-red-200',
  'Below Target': 'bg-amber-100 text-amber-800 border-amber-200',
  'Exceeding Target': 'bg-green-100 text-green-800 border-green-200',
  'Significant Downtime': 'bg-gray-100 text-gray-800 border-gray-200',
  'Uncategorized': 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [filteredComments, setFilteredComments] = useState<Comment[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalComments: 0,
    categories: [],
    priorities: { high: 0, medium: 0, low: 0 },
    machines: {}
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedMachine, setSelectedMachine] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })

  // Fetch comments from API
  const fetchComments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedPriority !== 'all') params.append('priority', selectedPriority)
      if (selectedMachine !== 'all') params.append('machine', selectedMachine)
      if (dateRange.from) params.append('from', dateRange.from)
      if (dateRange.to) params.append('to', dateRange.to)

      const response = await fetch(`/api/reports/comments?${params}`)
      const data = await response.json()
      
      setComments(data.comments || [])
      setFilteredComments(data.comments || [])
      setStatistics(data.statistics || {
        totalComments: 0,
        categories: [],
        priorities: { high: 0, medium: 0, low: 0 },
        machines: {}
      })
    } catch (error) {
      console.error('Error fetching comments:', error)
      setComments([])
      setFilteredComments([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [selectedCategory, selectedPriority, selectedMachine, dateRange])

  // Local search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = comments.filter(comment =>
        comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.part_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredComments(filtered)
    } else {
      setFilteredComments(comments)
    }
  }, [searchTerm, comments])

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('all')
    setSelectedPriority('all')
    setSelectedMachine('all')
    setSearchTerm('')
    setDateRange({ from: '', to: '' })
  }

  // Priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white border-red-700 font-semibold'
      case 'medium': return 'bg-yellow-500 text-white border-yellow-600'
      case 'low': return 'bg-green-600 text-white border-green-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Operator Comments Analysis</h1>
        <p className="text-gray-600">
          View all operator comments with AI-powered categorization and insights
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalComments}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.priorities.high}</div>
            <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {statistics.categories[0]?.category || 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.categories[0]?.count || 0} occurrences ({statistics.categories[0]?.percentage || 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(statistics.machines).length}</div>
            <p className="text-xs text-gray-500 mt-1">With comments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search comments, operators, machines, or part numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Categories</option>
                  {statistics.categories.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High ({statistics.priorities.high})</option>
                  <option value="medium">Medium ({statistics.priorities.medium})</option>
                  <option value="low">Low ({statistics.priorities.low})</option>
                </select>
              </div>

              {/* Machine Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Machine</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Machines</option>
                  {Object.entries(statistics.machines).map(([machine, count]) => (
                    <option key={machine} value={machine}>
                      {machine} ({count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(selectedCategory !== 'all' || selectedPriority !== 'all' || selectedMachine !== 'all' || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="px-3 py-1">
                  Category: {selectedCategory}
                  <X 
                    className="h-3 w-3 ml-2 cursor-pointer" 
                    onClick={() => setSelectedCategory('all')}
                  />
                </Badge>
              )}
              {selectedPriority !== 'all' && (
                <Badge variant="secondary" className="px-3 py-1">
                  Priority: {selectedPriority}
                  <X 
                    className="h-3 w-3 ml-2 cursor-pointer" 
                    onClick={() => setSelectedPriority('all')}
                  />
                </Badge>
              )}
              {selectedMachine !== 'all' && (
                <Badge variant="secondary" className="px-3 py-1">
                  Machine: {selectedMachine}
                  <X 
                    className="h-3 w-3 ml-2 cursor-pointer" 
                    onClick={() => setSelectedMachine('all')}
                  />
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="px-3 py-1">
                  Search: "{searchTerm}"
                  <X 
                    className="h-3 w-3 ml-2 cursor-pointer" 
                    onClick={() => setSearchTerm('')}
                  />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Category Distribution</CardTitle>
          <CardDescription>AI-detected patterns in operator comments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {statistics.categories.slice(0, 9).map(cat => {
              const Icon = categoryIcons[cat.category] || MessageSquare
              return (
                <div 
                  key={cat.category}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedCategory === cat.category ? 'ring-2 ring-orange-500' : ''
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === cat.category ? 'all' : cat.category
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="font-medium text-sm">{cat.category}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {cat.count}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{cat.percentage}% of total</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Comments ({filteredComments.length} {filteredComments.length !== comments.length && `of ${comments.length}`})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="text-gray-600 mt-4">Loading comments...</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No comments found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Comment Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{comment.operator}</span>
                        <Badge variant="outline" className="text-xs">
                          {comment.machine}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Shift {comment.shift}
                        </Badge>
                        {comment.part_number !== 'N/A' && (
                          <Badge variant="outline" className="text-xs">
                            Part #{comment.part_number}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(comment.date).toLocaleDateString()}
                        </span>
                        <span>Efficiency: {comment.efficiency}%</span>
                        {comment.downtime > 0 && (
                          <span>Downtime: {comment.downtime} min</span>
                        )}
                      </div>
                    </div>
                    <Badge className={getPriorityColor(comment.priority)}>
                      {comment.priority.charAt(0).toUpperCase() + comment.priority.slice(1)} Priority
                    </Badge>
                  </div>

                  {/* Comment Text */}
                  <div className="mb-3">
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {comment.categories.map((category, idx) => {
                      const Icon = categoryIcons[category] || MessageSquare
                      return (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={categoryColors[category] || 'bg-gray-100'}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {category}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}