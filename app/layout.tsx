import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Home, LayoutDashboard, FileText, BarChart3, Settings, Factory } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Toledo Tool & Die - Production Metrics Platform',
  description: 'Advanced manufacturing metrics and production tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation Header */}
          <nav className="bg-slate-800 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <img 
                    src="/toledo-logo.png" 
                    alt="Toledo Tool & Die" 
                    className="h-10 w-auto"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="flex items-baseline space-x-4">
                    <Link href="/" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                      <Home className="h-4 w-4 mr-1" /> Home
                    </Link>
                    <Link href="/dashboard" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                      <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                    </Link>
                    <Link href="/entry" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                      <FileText className="h-4 w-4 mr-1" /> Data Entry
                    </Link>
                    <Link href="/reports" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                      <BarChart3 className="h-4 w-4 mr-1" /> Reports
                    </Link>
                    <Link href="/settings" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                      <Settings className="h-4 w-4 mr-1" /> Settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          
          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="bg-slate-700 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="text-center text-sm">
                © 2025 Toledo Tool & Die | Powered by NEXUS Platform
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
