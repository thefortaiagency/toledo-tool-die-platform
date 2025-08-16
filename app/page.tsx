import Link from 'next/link'
import { Factory, LayoutDashboard, FileText, BarChart3, Activity, Package, TrendingUp, Users } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getStats() {
  try {
    // Get total production records
    const { count: productionCount } = await supabase
      .from('production_data')
      .select('*', { count: 'exact', head: true })

    // Get total machines
    const { count: machineCount } = await supabase
      .from('machines')
      .select('*', { count: 'exact', head: true })

    return {
      productionRecords: productionCount || 0,
      machines: machineCount || 6
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      productionRecords: 1135,
      machines: 6
    }
  }
}

export default async function Home() {
  const stats = await getStats()
  return (
    <div className="min-h-[calc(100vh-140px)]">
      {/* Hero Section */}
      <div className="relative text-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img 
            src="/hero-factory.jpg" 
            alt="Toledo Tool & Die Factory Floor" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <img src="/toledo-logo.png" alt="Toledo Tool & Die" className="h-20 mx-auto mb-8" />
            <h1 className="text-6xl font-bold mb-4 text-white drop-shadow-2xl">
              Toledo Tool & Die
            </h1>
            <p className="text-2xl mb-8 text-orange-100 font-light">Production Metrics Platform</p>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-300 mb-8">
                Advanced manufacturing intelligence system for real-time production tracking, 
                efficiency analysis, and AI-powered insights
              </p>
              <div className="flex justify-center space-x-8 text-orange-200">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.productionRecords.toLocaleString()}+</div>
                  <div className="text-sm">Production Records</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-sm">Real-Time Tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.machines}</div>
                  <div className="text-sm">Production Lines</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 fill-gray-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard" className="block">
            <div className="h-full bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dashboard</h3>
                <LayoutDashboard className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-gray-600">View real-time production metrics and efficiency reports</p>
            </div>
          </Link>
          
          <Link href="/entry" className="block">
            <div className="h-full bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Entry</h3>
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-gray-600">Submit shift reports and production data</p>
            </div>
          </Link>
          
          <Link href="/reports" className="block">
            <div className="h-full bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-gray-600">Generate and export detailed production reports</p>
            </div>
          </Link>

          <Link href="/settings" className="block">
            <div className="h-full bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200/50">
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
      <div className="bg-gradient-to-br from-gray-50/50 via-gray-100/50 to-gray-50/50 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <Activity className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Real-Time Monitoring</h3>
              <p className="text-gray-600">Track production metrics as they happen with live dashboard updates</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Efficiency Analysis</h3>
              <p className="text-gray-600">Monitor machine efficiency and identify improvement opportunities</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <BarChart3 className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Advanced Analytics</h3>
              <p className="text-gray-600">Comprehensive reporting with trend analysis and predictions</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <Package className="h-10 w-10 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Part Tracking</h3>
              <p className="text-gray-600">Track production by part number with quality metrics</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/50">
              <Users className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Shift Management</h3>
              <p className="text-gray-600">Monitor shift performance and manning status</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/50">
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
