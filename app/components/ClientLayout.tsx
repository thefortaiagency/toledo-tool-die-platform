'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ResizableChatSidebar from './ResizableChatSidebar'
import { ChevronLeft, Home, LayoutDashboard, FileText, BarChart3, Settings, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser-client'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #fafafa 0%, #f3f4f6 40%, #e5e7eb 60%, #f3f4f6 100%)',
      }}
    >
      {/* Navigation Header */}
      <nav className="bg-slate-800 text-white shadow-lg sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center space-x-8">
              <img 
                src="/toledo-logo.png" 
                alt="Toledo Tool & Die" 
                className="h-10 w-auto"
              />
              <div className="hidden md:flex items-baseline space-x-4">
                <Link href="/" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <Home className="h-4 w-4 mr-1" /> Home
                </Link>
                <Link href="/dashboard" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                </Link>
                <Link href="/reports" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <BarChart3 className="h-4 w-4 mr-1" /> Reports
                </Link>
                <Link href="/entry" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <FileText className="h-4 w-4 mr-1" /> Data Entry
                </Link>
                <Link href="/settings" className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                  <Settings className="h-4 w-4 mr-1" /> Settings
                </Link>
              </div>
              {user && (
                <div className="flex items-center space-x-4 ml-8">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-1" />
                    <span className="hidden lg:inline">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="hover:bg-orange-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-1" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 relative">
        {/* Main Content - adjusts width based on sidebar state */}
        <main 
          className="flex-1 transition-all duration-300"
          style={{ 
            marginRight: (user && !isChatCollapsed) ? chatWidth : 0,
          }}
        >
          {children}
        </main>
        
        {/* Chat Sidebar - Only show if user is authenticated */}
        {user && (
          <>
            <div 
              className="fixed right-0 top-16 bottom-0 transition-all duration-300"
              style={{ 
                width: isChatCollapsed ? 0 : chatWidth,
              }}
            >
              <ResizableChatSidebar 
                isCollapsed={isChatCollapsed}
                onCollapsedChange={setIsChatCollapsed}
                width={chatWidth}
                onWidthChange={setChatWidth}
              />
            </div>
            
            {/* Floating toggle button when collapsed */}
            {isChatCollapsed && (
              <button
                onClick={() => setIsChatCollapsed(false)}
                className="fixed right-0 top-1/2 -translate-y-1/2 bg-orange-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-orange-700 transition-all z-40"
                title="Open AI Assistant (⌘/)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </>
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