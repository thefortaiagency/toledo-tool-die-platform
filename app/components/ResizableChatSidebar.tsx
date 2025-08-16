'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  MessageCircle, Send, X, Loader2, Factory, ChevronLeft, ChevronRight, 
  GripVertical, Trash2, TrendingUp, AlertCircle, BarChart3
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  data?: any
}

// Simple function to strip markdown formatting
const stripMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
    .replace(/__(.*?)__/g, '$1')   // Remove __underline__
    .replace(/_(.*?)_/g, '$1')     // Remove _italic_
    .replace(/`(.*?)`/g, '$1')     // Remove `code`
    .replace(/#{1,6}\s/g, '')      // Remove # headers
}

export default function ResizableChatSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toledo-chat-collapsed')
      return saved === 'true'
    }
    return false
  })
  
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toledo-chat-width')
      return saved ? parseInt(saved) : 380
    }
    return 380
  })
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('toledo-chat-messages')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        } catch (e) {
          console.error('Failed to parse saved messages:', e)
        }
      }
    }
    return [
      {
        role: 'assistant',
        content: "👋 Hi! I'm your Toledo Tool & Die production assistant. I can help you with:\n\n• Current machine efficiency and performance\n• Hit tracker analysis and trends\n• Shift comparisons and recommendations\n• Die issues and maintenance alerts\n• Production targets and forecasts\n\nWhat would you like to know about your production floor?",
        timestamp: new Date()
      }
    ]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Save messages to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toledo-chat-messages', JSON.stringify(messages))
    }
  }, [messages])

  // Save collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toledo-chat-collapsed', String(isCollapsed))
    }
  }, [isCollapsed])

  // Save width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toledo-chat-width', String(width))
    }
  }, [width])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsCollapsed(!isCollapsed)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed])

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 320 && newWidth <= 600) {
      setWidth(newWidth)
    }
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10)
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        data: data.data
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    "What's the current efficiency for 600 Ton?",
    "Which shift is performing best today?",
    "Show me die issues from this week",
    "What machines need maintenance?"
  ]

  // Collapsed state - show toggle button
  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-orange-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-orange-700 transition-all"
          title="Open AI Assistant (⌘/)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div 
      className="fixed right-0 top-16 bottom-0 bg-white shadow-xl z-40 flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-orange-500/50 cursor-col-resize transition-all z-10 flex items-center justify-center"
      >
        <div className="w-4 h-8 rounded bg-gray-400/50 opacity-0 hover:opacity-100 flex items-center justify-center">
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Factory className="w-6 h-6" />
          <div>
            <h3 className="font-bold">Production Assistant</h3>
            <p className="text-xs text-orange-100">Toledo Tool & Die AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMessages([{
                role: 'assistant',
                content: "👋 Hi! I'm your Toledo Tool & Die production assistant. How can I help you today?",
                timestamp: new Date()
              }])
              localStorage.removeItem('toledo-chat-messages')
            }}
            className="p-1.5 hover:bg-orange-800/50 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-orange-800/50 rounded-lg transition-colors"
            title="Collapse (⌘/)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-1">
                  <Factory className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-semibold text-orange-600">AI Assistant</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{stripMarkdown(msg.content)}</div>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-orange-100' : 'text-gray-500'}`}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              <span className="text-gray-600">Analyzing production data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(question)
                  handleSend()
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about production metrics..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line • ⌘/ to toggle
        </p>
      </div>
    </div>
  )
}