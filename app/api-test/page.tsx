'use client'

import { useState, useEffect } from 'react'

export default function ApiTestPage() {
  const [hitTrackerData, setHitTrackerData] = useState<any>(null)
  const [aiInsightsData, setAiInsightsData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Test Hit Tracker API
        const hitResponse = await fetch('/api/reports/hit-tracker')
        if (!hitResponse.ok) {
          throw new Error(`Hit Tracker API failed: ${hitResponse.status}`)
        }
        const hitData = await hitResponse.json()
        setHitTrackerData(hitData)

        // Test AI Insights API
        const aiResponse = await fetch('/api/reports/ai-insights')
        if (!aiResponse.ok) {
          throw new Error(`AI Insights API failed: ${aiResponse.status}`)
        }
        const aiData = await aiResponse.json()
        setAiInsightsData(aiData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {hitTrackerData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Hit Tracker API Response:</h2>
          <div className="bg-gray-100 p-4 rounded overflow-x-auto">
            <pre className="text-sm">{JSON.stringify(hitTrackerData, null, 2).slice(0, 500)}...</pre>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Chart data points: {hitTrackerData.chartData?.length || 0}
          </p>
          <p className="text-sm text-gray-600">
            Date range: {hitTrackerData.chartData?.[0]?.date} to {hitTrackerData.chartData?.[hitTrackerData.chartData.length - 1]?.date}
          </p>
        </div>
      )}

      {aiInsightsData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">AI Insights API Response:</h2>
          <div className="bg-gray-100 p-4 rounded overflow-x-auto">
            <pre className="text-sm">{JSON.stringify(aiInsightsData, null, 2).slice(0, 500)}...</pre>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Key findings: {aiInsightsData.insights?.keyFindings?.length || 0}
          </p>
          <p className="text-sm text-gray-600">
            Total comments analyzed: {aiInsightsData.totalComments || 0}
          </p>
        </div>
      )}
    </div>
  )
}