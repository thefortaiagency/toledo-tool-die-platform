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

interface ResizableChatSidebarProps {
  isCollapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  width: number
  onWidthChange: (width: number) => void
  isMobile?: boolean
}

export default function ResizableChatSidebar({ 
  isCollapsed,
  onCollapsedChange,
  width,
  onWidthChange,
  isMobile = false
}: ResizableChatSidebarProps) {
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
        onCollapsedChange(!isCollapsed)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed, onCollapsedChange])

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 320 && newWidth <= 600) {
      onWidthChange(newWidth)
    }
  }, [isResizing, onWidthChange])

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

  // Dynamic suggestions based on context
  const getSuggestions = (lastMessageContent?: string) => {
    const lastMessage = lastMessageContent || messages[messages.length - 1]?.content?.toLowerCase() || ''
    
    // Context-aware suggestions
    if (lastMessage.includes('efficiency') || lastMessage.includes('performance')) {
      return [
        "Compare efficiency across all machines",
        "Show me today's performance trends",
        "What's causing efficiency drops?",
        "How can we improve efficiency?",
        "Which machine has best efficiency?",
        "Show efficiency by shift"
      ]
    }
    
    if (lastMessage.includes('shift') || lastMessage.includes('operator')) {
      return [
        "Which operators are performing best?",
        "Compare all shifts this week",
        "Show shift change impact on production",
        "Who needs additional training?",
        "Best shift for each machine",
        "Operator efficiency rankings"
      ]
    }
    
    if (lastMessage.includes('die') || lastMessage.includes('maintenance')) {
      return [
        "What dies need replacement?",
        "Show maintenance schedule",
        "Which machines have most downtime?",
        "Predict next maintenance needs",
        "Die change frequency analysis",
        "Maintenance cost breakdown"
      ]
    }
    
    if (lastMessage.includes('scrap') || lastMessage.includes('quality')) {
      return [
        "What's our scrap rate trend?",
        "Which parts have highest scrap?",
        "Root cause of quality issues",
        "Compare scrap rates by shift",
        "Quality improvement suggestions",
        "Scrap cost analysis"
      ]
    }

    if (lastMessage.includes('production') || lastMessage.includes('target')) {
      return [
        "Are we meeting production targets?",
        "Show target vs actual by machine",
        "Weekly production summary",
        "Which machines are behind target?",
        "Production forecast for this week",
        "Target achievement by shift"
      ]
    }
    
    // Default suggestions
    return [
      "What's the current efficiency for 600 Ton?",
      "Which shift is performing best today?",
      "Show me die issues from this week",
      "What machines need maintenance?",
      "Compare this week to last week",
      "Show production targets vs actual"
    ]
  }

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input
    if (!messageToSend.trim() || loading) return

    let userMessage: Message | null = null
    
    // Only add message if not already added (when using custom message)
    if (!customMessage) {
      userMessage = {
        role: 'user',
        content: messageToSend,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage!])
      setInput('')
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
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

  const handleSuggestionClick = (suggestion: string) => {
    const userMessage: Message = {
      role: 'user',
      content: suggestion,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    handleSend(suggestion)
  }

  // Collapsed state - return null, button will be in main layout
  if (isCollapsed) {
    return null
  }

  return (
    <div 
      className="h-full bg-white flex flex-col relative border-l border-gray-200"
      style={{ width: `${width}px`, flexShrink: 0 }}
    >
      {/* Resize Handle - Hide on mobile */}
      {!isMobile && (
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-orange-500/50 cursor-col-resize transition-all z-10 flex items-center justify-center"
        >
          <div className="w-4 h-8 rounded bg-gray-400/50 opacity-0 hover:opacity-100 flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      )}

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
            onClick={() => onCollapsedChange(true)}
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
          <div key={idx}>
            <div
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
            
            {/* Show suggestions after assistant messages */}
            {msg.role === 'assistant' && idx === messages.length - 1 && !loading && (
              <div className="mt-3 pl-4">
                <p className="text-xs text-gray-500 mb-2">Related questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {getSuggestions(msg.content).slice(0, 4).map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs bg-white hover:bg-orange-50 text-gray-600 hover:text-orange-700 px-2.5 py-1.5 rounded-md transition-all border border-gray-200 hover:border-orange-300 hover:shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

      {/* Quick Questions - Show at bottom when it's the first message */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2 border-t pt-3">
          <p className="text-xs text-gray-500 mb-2">Quick questions to get started:</p>
          <div className="flex flex-wrap gap-1.5">
            {getSuggestions().map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(question)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200 hover:border-orange-300"
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
            onClick={() => handleSend()}
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