import Link from 'next/link'
import { Factory, LayoutDashboard, FileText, BarChart3, Activity, Package, TrendingUp, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-140px)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <img src="/toledo-logo.png" alt="Toledo Tool & Die" className="h-20 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-4">Toledo Tool & Die</h1>
            <p className="text-xl mb-8 text-gray-300">Production Metrics Platform</p>
            <p className="text-lg max-w-3xl mx-auto text-gray-400">
              Advanced manufacturing intelligence system for real-time production tracking, 
              efficiency analysis, and AI-powered insights
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-slate-600 p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
                <LayoutDashboard className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-300">View real-time production metrics and efficiency reports</p>
            </div>
          </Link>
          
          <Link href="/entry" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-slate-600 p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Entry</h3>
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-300">Submit shift reports and production data</p>
            </div>
          </Link>
          
          <Link href="/reports" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-slate-600 p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reports</h3>
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-300">Generate and export detailed production reports</p>
            </div>
          </Link>

          <Link href="/settings" className="block">
            <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-slate-600 p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
                <Package className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-gray-600 dark:text-gray-300">Import Excel files and manage system settings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-slate-100 dark:bg-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-shadow">
              <Activity className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Real-Time Monitoring</h3>
              <p className="text-gray-600 dark:text-gray-300">Track production metrics as they happen with live dashboard updates</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-shadow">
              <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Efficiency Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">Monitor machine efficiency and identify improvement opportunities</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-shadow">
              <BarChart3 className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Advanced Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">Comprehensive reporting with trend analysis and predictions</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-shadow">
              <Package className="h-10 w-10 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Part Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">Track production by part number with quality metrics</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-shadow">
              <Users className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Shift Management</h3>
              <p className="text-gray-600 dark:text-gray-300">Monitor shift performance and manning status</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-shadow">
              <Factory className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Machine Intelligence</h3>
              <p className="text-gray-600 dark:text-gray-300">AI-powered insights for predictive maintenance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">6</div>
              <div className="text-gray-600 dark:text-gray-400">Production Lines</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">3</div>
              <div className="text-gray-600 dark:text-gray-400">Shifts Daily</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">100+</div>
              <div className="text-gray-600 dark:text-gray-400">Parts Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">Real-Time Data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
