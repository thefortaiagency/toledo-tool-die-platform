'use client'

import YTDRunningTotals from '../../components/YTDRunningTotals'

export default function YTDTotalsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">YTD Running Totals</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Year-to-date production performance by machine and shift
        </p>
      </div>

      <YTDRunningTotals />
    </div>
  )
}