'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingDown, TrendingUp, DollarSign, Package, BarChart3, Calendar, Factory, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import scrapData from '../../data/scrap-analysis-2025-complete.json'

interface ScrapSummary {
  totalScrapQty: number
  totalScrapCost: number
  plannedScrapQty: number
  plannedScrapCost: number
  unplannedScrapQty: number
  unplannedScrapCost: number
  plannedPercentage: number
  unplannedPercentage: number
  byCode: Record<string, {
    description: string
    quantity: number
    cost: number
    percentage: number
    isPlanned: boolean
  }>
  byMonth: Record<string, {
    totalQty: number
    totalCost: number
    plannedQty: number
    plannedCost: number
    unplannedQty: number
    unplannedCost: number
  }>
  byWorkcenterGroup: Record<string, {
    totalQty: number
    totalCost: number
    plannedQty: number
    unplannedQty: number
  }>
  byPart: Record<string, {
    name: string
    totalQty: number
    totalCost: number
    plannedQty: number
    unplannedQty: number
  }>
  topUnplannedCodes: Array<{
    code: string
    description: string
    quantity: number
    cost: number
    percentage: number
  }>
}

export default function ScrapAnalysisPage() {
  const [summary, setSummary] = useState<ScrapSummary | null>(null)

  useEffect(() => {
    // In production, this would fetch from an API
    setSummary(scrapData.summary as ScrapSummary)
  }, [])

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading scrap analysis...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value))
  }

  const potentialSavings = summary.unplannedScrapCost * 0.5

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Scrap Analysis Dashboard</h1>
        <p className="text-gray-600">Toledo Tool & Die - 2025 YTD Performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Scrap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalScrapQty)}</div>
            <p className="text-xs text-muted-foreground">pieces</p>
            <div className="text-lg font-semibold text-red-600 mt-1">
              {formatCurrency(summary.totalScrapCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Planned Scrap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.plannedPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{formatNumber(summary.plannedScrapQty)} pieces</p>
            <div className="text-lg font-semibold text-green-600 mt-1">
              {formatCurrency(summary.plannedScrapCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Unplanned Scrap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.unplannedPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{formatNumber(summary.unplannedScrapQty)} pieces</p>
            <div className="text-lg font-semibold text-red-600 mt-1">
              {formatCurrency(summary.unplannedScrapCost)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Potential Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(potentialSavings)}
            </div>
            <p className="text-xs text-green-700">If unplanned reduced by 50%</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Planned vs Unplanned Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Planned ({summary.plannedPercentage.toFixed(1)}%)</span>
                <span className="text-sm text-gray-600">{formatCurrency(summary.plannedScrapCost)}</span>
              </div>
              <Progress value={summary.plannedPercentage} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-red-600">Unplanned ({summary.unplannedPercentage.toFixed(1)}%)</span>
                <span className="text-sm text-red-600">{formatCurrency(summary.unplannedScrapCost)}</span>
              </div>
              <Progress value={summary.unplannedPercentage} className="h-3 bg-red-100" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="unplanned" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-16 bg-gray-100 rounded-lg p-2">
          <TabsTrigger 
            value="unplanned" 
            className="h-12 text-base font-semibold bg-white shadow-md border-2 border-red-200 hover:border-red-400 hover:bg-red-50 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:border-red-600 transition-all duration-200"
          >
            🚨 Top Issues
          </TabsTrigger>
          <TabsTrigger 
            value="monthly" 
            className="h-12 text-base font-semibold bg-white shadow-md border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 transition-all duration-200"
          >
            📅 Monthly Trend
          </TabsTrigger>
          <TabsTrigger 
            value="workcenter" 
            className="h-12 text-base font-semibold bg-white shadow-md border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-600 transition-all duration-200"
          >
            🏭 By Workcenter
          </TabsTrigger>
          <TabsTrigger 
            value="parts" 
            className="h-12 text-base font-semibold bg-white shadow-md border-2 border-green-200 hover:border-green-400 hover:bg-green-50 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:border-green-600 transition-all duration-200"
          >
            📦 By Part
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unplanned">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Top 10 Unplanned Scrap Reasons
              </CardTitle>
              <CardDescription>Focus areas for immediate improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.topUnplannedCodes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "destructive" : "secondary"} className="min-w-[2rem] justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-600">{formatNumber(item.quantity)} pieces</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{formatCurrency(item.cost)}</p>
                      <p className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Scrap Trend
              </CardTitle>
              <CardDescription>Track performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Total Cost</th>
                      <th className="text-right py-2">Planned</th>
                      <th className="text-right py-2">Unplanned</th>
                      <th className="text-right py-2">Unplanned %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summary.byMonth)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([month, data]) => {
                        const unplannedPct = data.totalCost > 0 ? (data.unplannedCost / data.totalCost * 100) : 0
                        return (
                          <tr key={month} className="border-b hover:bg-gray-50">
                            <td className="py-3">{month}</td>
                            <td className="text-right font-semibold">{formatCurrency(data.totalCost)}</td>
                            <td className="text-right text-green-600">{formatCurrency(data.plannedCost)}</td>
                            <td className="text-right text-red-600">{formatCurrency(data.unplannedCost)}</td>
                            <td className="text-right">
                              <Badge variant={unplannedPct > 50 ? "destructive" : "secondary"}>
                                {unplannedPct.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workcenter">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Scrap by Workcenter Group
              </CardTitle>
              <CardDescription>Identify problem areas in production</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byWorkcenterGroup)
                  .sort(([, a], [, b]) => b.totalCost - a.totalCost)
                  .slice(0, 10)
                  .map(([group, data]) => {
                    const unplannedPct = data.totalQty > 0 ? (data.unplannedQty / data.totalQty * 100) : 0
                    return (
                      <div key={group} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium">{group}</p>
                          <p className="text-sm text-gray-600">{formatNumber(data.totalQty)} pieces total</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(data.totalCost)}</p>
                          <Badge variant={unplannedPct > 60 ? "destructive" : unplannedPct > 40 ? "secondary" : "outline"}>
                            {unplannedPct.toFixed(1)}% unplanned
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top 10 Parts by Scrap Cost
              </CardTitle>
              <CardDescription>Parts with highest scrap impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byPart)
                  .sort(([, a], [, b]) => b.totalCost - a.totalCost)
                  .slice(0, 10)
                  .map(([part, data], index) => {
                    const unplannedPct = data.totalQty > 0 ? (data.unplannedQty / data.totalQty * 100) : 0
                    return (
                      <div key={part} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="min-w-[2rem] justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <Link 
                              href={`/scrap-analysis/part/${encodeURIComponent(part)}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 group transition-colors"
                            >
                              {part}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <p className="text-sm text-gray-600">{data.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(data.totalCost)}</p>
                          <Badge variant={unplannedPct > 60 ? "destructive" : unplannedPct > 40 ? "secondary" : "outline"}>
                            {unplannedPct.toFixed(1)}% unplanned
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Summary */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Financial Impact Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Average Monthly Scrap Cost</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalScrapCost / 8)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Monthly Unplanned</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.unplannedScrapCost / 8)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Projected Annual Savings (50% reduction)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(potentialSavings)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}