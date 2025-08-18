'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ResizableChatSidebar from './ResizableChatSidebar'
import { ChevronLeft, Home, LayoutDashboard, FileText, BarChart3, Settings, LogOut, User, Bot, Sparkles, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser-client'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isChatCollapsed, setIsChatCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toledo-chat-collapsed')
      return saved === 'true'
    }
    return false
  })
  
  const [chatWidth, setChatWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toledo-chat-width')
      return saved ? parseInt(saved) : 380
    }
    return 380
  })

  // Check for user session
  useEffect(() => {
    const supabase = createClient()
    
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toledo-chat-collapsed', String(isChatCollapsed))
    }
  }, [isChatCollapsed])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toledo-chat-width', String(chatWidth))
    }
  }, [chatWidth])

  // If on login page, render without navbar and layout
  if (pathname === '/login') {
    return children
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-gray-100"
      style={{
        background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 40%, #9ca3af 60%, #d1d5db 100%)',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        minHeight: '100vh'
      }}
    >
      {/* Navigation Header */}
      <nav className="bg-slate-800 text-white shadow-lg sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo and Desktop Navigation */}
            <div className="flex items-center flex-1 justify-center md:justify-start">
              <img 
                src="/toledo-logo.png" 
                alt="Toledo Tool & Die" 
                className="h-8 sm:h-10 w-auto"
              />
              <div className="hidden md:flex items-baseline space-x-4 ml-8">
                <Link href="/" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <Home className="h-4 w-4 mr-1" /> Home
                </Link>
                <Link href="/dashboard" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                </Link>
                <Link href="/reports" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <BarChart3 className="h-4 w-4 mr-1" /> Reports
                </Link>
                <Link href="/scrap-analysis" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <BarChart3 className="h-4 w-4 mr-1" /> Scrap Analysis
                </Link>
                <Link href="/inventory-adjustments" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <BarChart3 className="h-4 w-4 mr-1" /> Inventory
                </Link>
                <Link href="/ai-reports" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors bg-gradient-to-r from-orange-600 to-orange-700">
                  <Sparkles className="h-4 w-4 mr-1 animate-pulse" /> AI Reports
                </Link>
                <Link href="/entry" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <FileText className="h-4 w-4 mr-1" /> Data Entry
                </Link>
                <Link href="/settings" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <Settings className="h-4 w-4 mr-1" /> Settings
                </Link>
              </div>
            </div>

            {/* User and AI Assistant */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center text-sm">
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden lg:inline">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium items-center transition-colors"
                >
                  <LogOut className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
                
                {/* AI Assistant Button */}
                <button
                  onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                  className="relative hover:bg-orange-600 hover:text-white px-2 sm:px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all group"
                  title="AI Production Assistant (⌘/)"
                >
                  <Bot className="h-5 w-5" />
                  <span className="hidden sm:inline ml-1">AI</span>
                  <Sparkles className="h-3 w-3 ml-1 text-yellow-400 animate-pulse" />
                  {!isChatCollapsed && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col space-y-2">
                <Link 
                  href="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <Home className="h-5 w-5 mr-2" /> Home
                </Link>
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <LayoutDashboard className="h-5 w-5 mr-2" /> Dashboard
                </Link>
                <Link 
                  href="/reports" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <BarChart3 className="h-5 w-5 mr-2" /> Reports
                </Link>
                <Link 
                  href="/scrap-analysis" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <BarChart3 className="h-5 w-5 mr-2" /> Scrap Analysis
                </Link>
                <Link 
                  href="/inventory-adjustments" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <BarChart3 className="h-5 w-5 mr-2" /> Inventory
                </Link>
                <Link 
                  href="/ai-reports" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <Sparkles className="h-5 w-5 mr-2 animate-pulse" /> AI Reports
                </Link>
                <Link 
                  href="/entry" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <FileText className="h-5 w-5 mr-2" /> Data Entry
                </Link>
                <Link 
                  href="/settings" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                >
                  <Settings className="h-5 w-5 mr-2" /> Settings
                </Link>
                {user && (
                  <>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="px-3 py-2 text-sm">
                        <User className="h-4 w-4 mr-2 inline" />
                        {user.email}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                    >
                      <LogOut className="h-5 w-5 mr-2" /> Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Main Content - adjusts width based on sidebar state */}
        <main 
          className="flex-1 transition-all duration-300 overflow-x-hidden overflow-y-auto"
          style={{ 
            marginRight: (user && !isChatCollapsed && !isMobile) ? chatWidth : 0,
          }}
        >
          {children}
        </main>
        
        {/* Chat Sidebar - Only show if user is authenticated */}
        {user && !isChatCollapsed && (
          <div 
            className="fixed right-0 top-16 bottom-0 transition-all duration-300 z-40"
            style={{ 
              width: isMobile ? '100%' : chatWidth,
            }}
          >
            <ResizableChatSidebar 
              isCollapsed={isChatCollapsed}
              onCollapsedChange={setIsChatCollapsed}
              width={isMobile ? window.innerWidth : chatWidth}
              onWidthChange={setChatWidth}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-700 text-white">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm">
            © 2025 Toledo Tool & Die | Powered by NEXUS Platform
          </div>
        </div>
      </footer>
    </div>
  )
}