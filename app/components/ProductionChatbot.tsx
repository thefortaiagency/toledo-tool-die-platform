'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Loader2, Factory, TrendingUp, AlertCircle, HelpCircle, BarChart3 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  data?: any
}

export default function ProductionChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your Toledo Tool & Die production assistant. I can help you with:\n\n• Current machine efficiency and performance\n• Hit tracker analysis and trends\n• Shift comparisons and recommendations\n• Die issues and maintenance alerts\n• Production targets and forecasts\n\nWhat would you like to know about your production floor?",
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
          history: messages.slice(-10) // Send last 10 messages for context
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
    "What machines need maintenance?",
    "Compare this week to last week"
  ]

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-600 text-white rounded-full p-4 shadow-lg hover:bg-orange-700 transition-all duration-300 z-40 flex items-center space-x-2"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:inline">Production Assistant</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Factory className="w-6 h-6" />
              <div>
                <h3 className="font-bold">Production Assistant</h3>
                <p className="text-xs text-orange-100">Toledo Tool & Die AI</p>
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
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.data && (
                    <div className="mt-2 p-2 bg-white/10 rounded text-xs">
                      <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                    </div>
                  )}
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
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  )
}