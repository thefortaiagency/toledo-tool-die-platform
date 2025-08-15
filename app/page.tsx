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
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard" className="block">
            <div className="h-full bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dashboard</h3>
                <LayoutDashboard className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-gray-600">View real-time production metrics and efficiency reports</p>
            </div>
          </Link>
          
          <Link href="/entry" className="block">
            <div className="h-full bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Entry</h3>
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-gray-600">Submit shift reports and production data</p>
            </div>
          </Link>
          
          <Link href="/reports" className="block">
            <div className="h-full bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-gray-600">Generate and export detailed production reports</p>
            </div>
          </Link>

          <Link href="/settings" className="block">
            <div className="h-full bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
                <Package className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-gray-600">Import Excel files and manage system settings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <Activity className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Real-Time Monitoring</h3>
              <p className="text-gray-600">Track production metrics as they happen with live dashboard updates</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Efficiency Analysis</h3>
              <p className="text-gray-600">Monitor machine efficiency and identify improvement opportunities</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <BarChart3 className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Advanced Analytics</h3>
              <p className="text-gray-600">Comprehensive reporting with trend analysis and predictions</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <Package className="h-10 w-10 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Part Tracking</h3>
              <p className="text-gray-600">Track production by part number with quality metrics</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <Users className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Shift Management</h3>
              <p className="text-gray-600">Monitor shift performance and manning status</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <Factory className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Machine Intelligence</h3>
              <p className="text-gray-600">AI-powered insights for predictive maintenance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">6</div>
              <div className="text-gray-600">Production Lines</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <div className="text-gray-600">Shifts Daily</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">100+</div>
              <div className="text-gray-600">Parts Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600">Real-Time Data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
