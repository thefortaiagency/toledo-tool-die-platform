'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingDown, TrendingUp, DollarSign, Package, AlertCircle, Calendar, BarChart3 } from 'lucide-react'
import scrapData from '../../../../data/scrap-analysis-2025-complete.json'

export default function PartScrapDetailPage() {
  const params = useParams()
  const router = useRouter()
  const partNumber = decodeURIComponent(params.partNumber as string)
  
  const [partData, setPartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, this would fetch detailed scrap history from an API
    const summary = scrapData.summary as any
    const part = summary.byPart[partNumber]
    
    if (part) {
      // Mock additional detail data that would come from the database
      setPartData({
        ...part,
        partNumber,
        scrapHistory: [
          {
            date: '2025-08-15',
            shiftId: 'Day',
            machineId: 'Press-600',
            scrapQty: 12,
            scrapCode: 'D001',
            scrapReason: 'Die wear',
            scrapCost: 240,
            operatorId: 'OP-123'
          },
          {
            date: '2025-08-14',
            shiftId: 'Night',
            machineId: 'Press-600',
            scrapQty: 8,
            scrapCode: 'M002',
            scrapReason: 'Material defect',
            scrapCost: 160,
            operatorId: 'OP-456'
          },
          {
            date: '2025-08-13',
            shiftId: 'Day',
            machineId: 'Press-1200',
            scrapQty: 15,
            scrapCode: 'D001',
            scrapReason: 'Die wear',
            scrapCost: 300,
            operatorId: 'OP-789'
          }
        ],
        monthlyTrend: [
          { month: 'Jan 2025', scrapQty: 145, scrapCost: 2900 },
          { month: 'Feb 2025', scrapQty: 167, scrapCost: 3340 },
          { month: 'Mar 2025', scrapQty: 134, scrapCost: 2680 },
          { month: 'Apr 2025', scrapQty: 189, scrapCost: 3780 },
          { month: 'May 2025', scrapQty: 156, scrapCost: 3120 },
          { month: 'Jun 2025', scrapQty: 143, scrapCost: 2860 },
          { month: 'Jul 2025', scrapQty: 178, scrapCost: 3560 },
          { month: 'Aug 2025', scrapQty: 124, scrapCost: 2480 }
        ],
        topScrapReasons: [
          { reason: 'Die wear', qty: 345, cost: 6900, percentage: 35.2 },
          { reason: 'Material defect', qty: 234, cost: 4680, percentage: 23.9 },
          { reason: 'Setup issue', qty: 167, cost: 3340, percentage: 17.0 },
          { reason: 'Operator error', qty: 134, cost: 2680, percentage: 13.7 },
          { reason: 'Machine malfunction', qty: 98, cost: 1960, percentage: 10.0 }
        ]
      })
    }
    setLoading(false)
  }, [partNumber])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading scrap details...</p>
        </div>
      </div>
    )
  }

  if (!partData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Part Not Found</h1>
          <p className="text-gray-600 mb-4">No scrap data found for part number: {partNumber}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const unplannedPct = partData.totalQty > 0 ? (partData.unplannedQty / partData.totalQty * 100) : 0

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button 
          onClick={() => router.back()}
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scrap Analysis
        </Button>
        
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">Part Scrap Detail: {partNumber}</h1>
          <p className="text-gray-300">{partData.name}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Scrap</p>
                  <p className="text-2xl font-bold">{formatNumber(partData.totalQty)}</p>
                </div>
                <Package className="h-8 w-8 text-orange-400" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(partData.totalCost)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Planned Scrap</p>
                  <p className="text-2xl font-bold">{formatNumber(partData.plannedQty)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Unplanned %</p>
                  <p className="text-2xl font-bold">{unplannedPct.toFixed(1)}%</p>
                </div>
                <TrendingDown className={`h-8 w-8 ${unplannedPct > 50 ? 'text-red-400' : 'text-yellow-400'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scrap History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Scrap History
            </CardTitle>
            <CardDescription>Last 10 scrap events for this part</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partData.scrapHistory.map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.date}</Badge>
                      <Badge variant="secondary">{event.shiftId}</Badge>
                    </div>
                    <p className="font-medium mt-1">{event.scrapReason}</p>
                    <p className="text-sm text-gray-600">Machine: {event.machineId} | Operator: {event.operatorId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(event.scrapCost)}</p>
                    <p className="text-sm text-gray-600">{event.scrapQty} pieces</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Scrap Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Scrap Reasons
            </CardTitle>
            <CardDescription>Most common causes for this part</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partData.topScrapReasons.map((reason: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant={index < 2 ? "destructive" : "secondary"} className="min-w-[2rem] justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{reason.reason}</p>
                      <p className="text-sm text-gray-600">{formatNumber(reason.qty)} pieces</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{formatCurrency(reason.cost)}</p>
                    <p className="text-sm text-gray-600">{reason.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Monthly Scrap Trend
            </CardTitle>
            <CardDescription>Scrap performance over time for this part</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Month</th>
                    <th className="text-right py-2">Scrap Qty</th>
                    <th className="text-right py-2">Scrap Cost</th>
                    <th className="text-right py-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {partData.monthlyTrend.map((month: any, index: number) => {
                    const prevMonth = index > 0 ? partData.monthlyTrend[index - 1] : null
                    const trend = prevMonth ? ((month.scrapCost - prevMonth.scrapCost) / prevMonth.scrapCost * 100) : 0
                    
                    return (
                      <tr key={month.month} className="border-b hover:bg-gray-50">
                        <td className="py-3">{month.month}</td>
                        <td className="text-right">{formatNumber(month.scrapQty)}</td>
                        <td className="text-right font-semibold">{formatCurrency(month.scrapCost)}</td>
                        <td className="text-right">
                          {prevMonth && (
                            <Badge variant={trend > 0 ? "destructive" : trend < 0 ? "default" : "secondary"}>
                              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card className="mt-6 bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {unplannedPct > 50 && (
              <p className="flex items-center gap-2">
                • <strong>High Priority:</strong> Unplanned scrap is {unplannedPct.toFixed(1)}% - investigate root causes
              </p>
            )}
            <p className="flex items-center gap-2">
              • Review die maintenance schedule to reduce wear-related scrap
            </p>
            <p className="flex items-center gap-2">
              • Implement additional operator training for this part number
            </p>
            <p className="flex items-center gap-2">
              • Consider setup optimization to reduce changeover scrap
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}