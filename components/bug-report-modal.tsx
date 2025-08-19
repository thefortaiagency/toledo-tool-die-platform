'use client'

import { useState } from 'react'
import { X, Bug, Lightbulb, AlertTriangle, Info, Send, Loader2 } from 'lucide-react'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [formData, setFormData] = useState({
    type: 'bug',
    title: '',
    description: '',
    priority: 'medium',
    userEmail: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Get additional context
      const browserInfo = `${navigator.userAgent} | Screen: ${screen.width}x${screen.height} | Language: ${navigator.language}`
      const currentUrl = window.location.href

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          browserInfo,
          currentUrl
        })
      })

      const result = await response.json()

      if (result.success) {
        setSubmitStatus({ 
          type: 'success', 
          message: result.message 
        })
        // Reset form
        setFormData({
          type: 'bug',
          title: '',
          description: '',
          priority: 'medium',
          userEmail: ''
        })
        // Close modal after success
        setTimeout(() => {
          onClose()
          setSubmitStatus(null)
        }, 2000)
      } else {
        setSubmitStatus({ 
          type: 'error', 
          message: result.error || 'Failed to submit report' 
        })
      }
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'Network error. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />
      case 'feature': return <Lightbulb className="h-4 w-4" />
      case 'improvement': return <AlertTriangle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(formData.type)}
              <h2 className="text-xl font-bold">
                {formData.type === 'bug' ? 'Report a Bug' : 
                 formData.type === 'feature' ? 'Request a Feature' :
                 formData.type === 'improvement' ? 'Suggest Improvement' : 
                 'Submit Feedback'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-slate-200 mt-2 text-sm">
            Help us improve the Toledo Tool & Die platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of feedback is this?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'bug', label: 'Bug Report', icon: Bug, color: 'red' },
                { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'blue' },
                { value: 'improvement', label: 'Improvement', icon: AlertTriangle, color: 'yellow' },
                { value: 'other', label: 'Other', icon: Info, color: 'gray' }
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: value })}
                  className={`p-3 border-2 rounded-lg flex items-center gap-2 transition-colors ${
                    formData.type === value
                      ? color === 'red' ? 'border-red-500 bg-red-50 text-red-700' :
                        color === 'blue' ? 'border-blue-500 bg-blue-50 text-blue-700' :
                        color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' :
                        'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="low">🟢 Low - Minor issue or nice-to-have</option>
              <option value="medium">🔵 Medium - Affects some functionality</option>
              <option value="high">🟡 High - Blocks important tasks</option>
              <option value="critical">🔴 Critical - System broken or major data loss</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue or request"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                formData.type === 'bug' 
                  ? "Steps to reproduce:\n1. Go to...\n2. Click on...\n3. See error...\n\nExpected: What should happen\nActual: What actually happened"
                  : formData.type === 'feature'
                  ? "Describe the feature you'd like to see:\n- What problem would it solve?\n- How should it work?\n- Any specific requirements?"
                  : "Describe your suggestion in detail..."
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-vertical min-h-[100px]"
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email (optional)
            </label>
            <input
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              placeholder="your.email@company.com - for follow-up questions"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll only use this to ask clarifying questions about your report
            </p>
          </div>

          {/* Status Message */}
          {submitStatus && (
            <div className={`p-4 rounded-lg ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {submitStatus.message}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.description}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}