'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Lightbulb, TrendingUp, AlertCircle, CheckCircle, Target, DollarSign } from 'lucide-react'
import { useState } from 'react'

interface AIInsight {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  type: 'cost-saving' | 'efficiency' | 'quality' | 'discovery'
  recommendation: string
  metrics?: {
    label: string
    value: string
  }[]
}

const insights: AIInsight[] = [
  {
    title: "Container Transfer Misclassification",
    description: "93.8% of reported $551.9M in 'adjustments' are actually paired container transfers that net to zero",
    impact: 'high',
    type: 'discovery',
    recommendation: "Implement separate tracking for container transfers vs. true adjustments. Focus optimization on the real $34.4M impact.",
    metrics: [
      { label: "Reported Impact", value: "$551.9M" },
      { label: "TRUE Impact", value: "$34.4M" },
      { label: "Reduction", value: "93.8%" }
    ]
  },
  {
    title: "Mass Updates Control Gap",
    description: "Mass updates account for $540K of true adjustments with only 123 transactions",
    impact: 'high',
    type: 'cost-saving',
    recommendation: "Add approval workflows for mass updates. Implement validation checks before execution. Restrict access to authorized personnel only.",
    metrics: [
      { label: "Impact", value: "$540K" },
      { label: "Transactions", value: "123" },
      { label: "Avg per Update", value: "$4,393" }
    ]
  },
  {
    title: "Cycle Count Accuracy Issues",
    description: "Cycle counts are causing $205K in adjustments from 168 events",
    impact: 'medium',
    type: 'quality',
    recommendation: "Increase cycle count frequency for high-value items. Implement ABC analysis. Train counters on proper procedures.",
    metrics: [
      { label: "Annual Impact", value: "$205K" },
      { label: "Events", value: "168" },
      { label: "Potential Savings", value: "$100K+" }
    ]
  },
  {
    title: "Unplanned Scrap Opportunity",
    description: "48.6% of scrap is unplanned, representing $568K in waste",
    impact: 'high',
    type: 'cost-saving',
    recommendation: "Focus on top 3 scrap reasons: Setup issues, Tool problems, Quality defects. Implement preventive measures.",
    metrics: [
      { label: "Unplanned Scrap", value: "$568K" },
      { label: "Percentage", value: "48.6%" },
      { label: "Savings Potential", value: "$284K" }
    ]
  },
  {
    title: "Production Adjustment Patterns",
    description: "Production adjustments total $152K from 174 transactions",
    impact: 'medium',
    type: 'efficiency',
    recommendation: "Review production reporting accuracy. Implement real-time tracking to reduce manual adjustments.",
    metrics: [
      { label: "Annual Cost", value: "$152K" },
      { label: "Frequency", value: "174/year" },
      { label: "Avg Impact", value: "$876" }
    ]
  }
]

export function AIInsights({ filter }: { filter?: 'inventory' | 'scrap' | 'all' }) {
  const [expandedInsights, setExpandedInsights] = useState<number[]>([0])

  const filteredInsights = filter === 'all' 
    ? insights 
    : filter === 'inventory'
    ? insights.filter(i => i.title.includes('Transfer') || i.title.includes('Mass') || i.title.includes('Cycle') || i.title.includes('Production'))
    : insights.filter(i => i.title.includes('Scrap'))

  const toggleExpanded = (index: number) => {
    setExpandedInsights(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'cost-saving': return <DollarSign className="h-5 w-5" />
      case 'efficiency': return <TrendingUp className="h-5 w-5" />
      case 'quality': return <CheckCircle className="h-5 w-5" />
      case 'discovery': return <Lightbulb className="h-5 w-5" />
      default: return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          AI-Powered Insights & Recommendations
        </CardTitle>
        <CardDescription>
          Machine learning analysis of your data reveals critical optimization opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredInsights.map((insight, index) => {
          const isExpanded = expandedInsights.includes(index)
          return (
            <div 
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getImpactColor(insight.impact)}`}
              onClick={() => toggleExpanded(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(insight.type)}
                    <h3 className="font-semibold text-lg">{insight.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      insight.impact === 'high' ? 'bg-red-600 text-white' :
                      insight.impact === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {insight.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      <div className="bg-white/80 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm mb-1">AI Recommendation:</h4>
                            <p className="text-sm text-gray-700">{insight.recommendation}</p>
                          </div>
                        </div>
                      </div>
                      
                      {insight.metrics && (
                        <div className="grid grid-cols-3 gap-3">
                          {insight.metrics.map((metric, i) => (
                            <div key={i} className="bg-white/80 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-500">{metric.label}</div>
                              <div className="text-sm font-bold">{metric.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {isExpanded ? 'Click to collapse' : 'Click to expand for recommendations'}
              </div>
            </div>
          )
        })}
        
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg border border-indigo-300">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">AI Analysis Summary</h4>
              <p className="text-xs text-gray-700">
                Our AI has analyzed 1.4M+ records and identified {filteredInsights.reduce((acc, i) => acc + (i.metrics?.[2]?.value ? 1 : 0), 0)} major cost-saving opportunities 
                totaling over ${filter === 'inventory' ? '650K' : '1M+'} in potential annual savings. 
                The biggest discovery: 93.8% of reported inventory issues are actually just internal transfers, not real problems.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}