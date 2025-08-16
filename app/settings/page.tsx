'use client'

import { useState } from 'react'
import { Settings, Database, Upload, Bell, Shield, Users, Mail, Globe } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage system configuration and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'general', name: 'General', icon: Settings },
              { id: 'database', name: 'Database', icon: Database },
              { id: 'import', name: 'Import Data', icon: Upload },
              { id: 'notifications', name: 'Notifications', icon: Bell },
              { id: 'security', name: 'Security', icon: Shield },
              { id: 'users', name: 'Users', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Toledo Tool & Die"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Zone
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>America/New_York (EST)</option>
                      <option>America/Chicago (CST)</option>
                      <option>America/Denver (MST)</option>
                      <option>America/Los_Angeles (PST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Shift Target
                    </label>
                    <input
                      type="number"
                      defaultValue="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Database Configuration</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Database className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Database Connected
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Supabase PostgreSQL - Last sync: Just now
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Database URL
                    </label>
                    <input
                      type="password"
                      defaultValue="••••••••••••••••••••"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-sync Interval
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>Every 30 seconds</option>
                      <option>Every minute</option>
                      <option>Every 5 minutes</option>
                      <option>Manual only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Data</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Excel files (.xlsx, .xls) up to 10MB
                  </p>
                  <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    Select Files
                  </button>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Imports</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Hits Tracking 2025.xlsx</span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Shift Update v22 8-15-25.xlsx</span>
                      <span className="text-xs text-gray-500">Yesterday</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive alerts via email</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-600">
                      <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Low Efficiency Alerts</p>
                      <p className="text-sm text-gray-500">Alert when efficiency drops below 80%</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-orange-600">
                      <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">AI Insights</p>
                      <p className="text-sm text-gray-500">Notify when new AI insights are available</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                      <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Two-Factor Authentication
                    </label>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      Configure 2FA
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Keys
                    </label>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      Manage API Keys
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
                <div className="mb-4">
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    Add New User
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Admin User</p>
                      <p className="text-sm text-gray-500">admin@toledotool.com</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Admin</span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Operator User</p>
                      <p className="text-sm text-gray-500">operator@toledotool.com</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Operator</span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
            Cancel
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}