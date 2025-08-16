'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Loader2, Factory, TrendingUp, AlertCircle, HelpCircle, BarChart3, AlertTriangle, Shield, ClipboardList, Activity, Users, Settings } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  data?: any
  links?: string[]
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

// Convert markdown links to HTML
const renderContent = (content: string) => {
  // Replace markdown links [text](url) with HTML links
  const withLinks = content.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-orange-600 hover:text-orange-700 underline">$1</a>'
  )
  
  // Strip other markdown but keep the HTML links
  const stripped = withLinks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
    .replace(/#{1,6}\s/g, '')
  
  return stripped
}

interface ProductionChatbotProps {
  isNavbar?: boolean
}

export default function ProductionChatbot({ isNavbar = false }: ProductionChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Hi! I'm your Toledo Tool & Die AI assistant powered by GPT-4.

Ask me anything about your production data.`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input
    if (!messageToSend.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
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
          message: messageToSend,
          history: messages.slice(-10) // Send last 10 messages for context
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        data: data.data,
        links: data.links
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check if the service is configured correctly.',
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

  // Enhanced suggestion cards with new features
  const suggestionCards = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Current Efficiency",
      subtitle: "Real-time machine performance",
      query: "What's the current efficiency for all machines?",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Manning Report",
      subtitle: "Attendance & coverage",
      query: "Show me manning and attendance data for all shifts",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "Safety Concerns",
      subtitle: "Critical safety issues",
      query: "Show me recent safety concerns that need attention",
      color: "bg-gradient-to-br from-red-500 to-red-600"
    },
    {
      icon: <ClipboardList className="w-5 h-5" />,
      title: "Operator Performance",
      subtitle: "Top performers & hours",
      query: "Who are the top operators by efficiency and hours worked?",
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Die Issues",
      subtitle: "Tooling problems analysis",
      query: "Analyze die tooling problems from this week",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: "AI Insights",
      subtitle: "Predictive analytics",
      query: "Show me AI-generated insights and predictions",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    }
  ]

  // Quick questions for first-time users
  const quickQuestions = [
    "What machines are below target?",
    "Show manning coverage by shift",
    "Who worked the most hours this week?",
    "What's the attendance rate?",
    "Which shift needs more operators?"
  ]

  return (
    <>
      {/* Chat Button */}
      {isNavbar ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors hover:bg-orange-700"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          <span>AI Assistant</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-orange-600 text-white rounded-full p-4 shadow-lg hover:bg-orange-700 transition-all duration-300 z-40 flex items-center space-x-2"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="hidden md:inline">Production Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed top-20 right-4 w-[480px] h-[700px] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Factory className="w-6 h-6" />
              <div>
                <h3 className="font-bold">AI Production Assistant</h3>
                <p className="text-xs text-orange-100">Toledo Tool & Die - Enhanced with Issue Tracking</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-orange-800/50 rounded-lg p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
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
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                  />
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
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Cards - Show when conversation is just starting */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500 mb-2 font-semibold">Popular Queries:</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {suggestionCards.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(card.query)}
                    className={`${card.color} text-white rounded-lg p-3 text-left hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="mt-0.5">{card.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{card.title}</div>
                        <div className="text-xs opacity-90">{card.subtitle}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Quick Questions */}
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(question)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
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
                placeholder="Ask about production, safety, issues..."
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
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Press Enter to send • Shift+Enter for new line
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Enhanced with safety tracking</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}