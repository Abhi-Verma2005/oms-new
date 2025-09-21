"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AdminLayout } from '@/components/admin/admin-layout'
import { 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Bot, 
  Settings, 
  Route, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff
} from 'lucide-react'

interface NavigationItem {
  id: string
  name: string
  route: string
  description?: string
  isActive: boolean
}

interface AIChatbotConfig {
  systemPrompt: string
  navigationData: NavigationItem[]
}

function AIChatbotAdminContent() {
  const [config, setConfig] = useState<AIChatbotConfig>({
    systemPrompt: '',
    navigationData: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    route: '',
    description: ''
  })
  const [showPreview, setShowPreview] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/ai-chatbot/config')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
      setErrorMessage('Failed to load configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/admin/ai-chatbot/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: config.systemPrompt,
          navigationData: config.navigationData
        })
      })

      if (response.ok) {
        setSuccessMessage('Configuration saved successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setErrorMessage('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const addNavigationItem = async () => {
    if (!newItem.name || !newItem.route) {
      setErrorMessage('Name and route are required')
      return
    }

    setErrorMessage('')
    try {
      const response = await fetch('/api/admin/ai-chatbot/navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(prev => ({
          ...prev,
          navigationData: [...prev.navigationData, data.navigationItem]
        }))
        setNewItem({ name: '', route: '', description: '' })
        setSuccessMessage('Navigation item added successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage('Failed to add navigation item')
      }
    } catch (error) {
      console.error('Error adding navigation item:', error)
      setErrorMessage('Failed to add navigation item')
    }
  }

  const updateNavigationItem = async (item: NavigationItem) => {
    setErrorMessage('')
    try {
      const response = await fetch('/api/admin/ai-chatbot/navigation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(prev => ({
          ...prev,
          navigationData: prev.navigationData.map(nav => 
            nav.id === item.id ? data.navigationItem : nav
          )
        }))
        setEditingItem(null)
        setSuccessMessage('Navigation item updated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage('Failed to update navigation item')
      }
    } catch (error) {
      console.error('Error updating navigation item:', error)
      setErrorMessage('Failed to update navigation item')
    }
  }

  const deleteNavigationItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this navigation item?')) {
      return
    }

    setErrorMessage('')
    try {
      const response = await fetch(`/api/admin/ai-chatbot/navigation?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setConfig(prev => ({
          ...prev,
          navigationData: prev.navigationData.filter(nav => nav.id !== id)
        }))
        setSuccessMessage('Navigation item deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage('Failed to delete navigation item')
      }
    } catch (error) {
      console.error('Error deleting navigation item:', error)
      setErrorMessage('Failed to delete navigation item')
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header Section */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-violet-100 dark:bg-violet-900/20 rounded-lg">
              <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">AI Chatbot Configuration</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage system prompts and navigation routes for your AI assistant</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            onClick={saveConfig}
            disabled={isSaving}
            className="min-w-[140px] bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Configuration
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* System Prompt Configuration */}
        <div className="col-span-full xl:col-span-8">
          <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border-0">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">System Prompt</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Configure how the AI should behave and respond</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="Enter the system prompt for the AI chatbot..."
                className="min-h-[200px] mb-4 resize-none"
              />
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">System Prompt Guidelines</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This prompt instructs the AI on how to behave and respond to users. Include information about your application, 
                    available features, response tone, and any specific guidelines for user interactions.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="col-span-full xl:col-span-4">
          <div className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border-0">
              <div className="px-6 pt-6 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <Route className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Navigation Routes</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total configured routes</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {config.navigationData.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {config.navigationData.length === 0 ? 'No routes configured' : 'Routes available for AI'}
                </div>
              </div>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border-0">
              <div className="px-6 pt-6 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-violet-100 dark:bg-violet-900/20 rounded-lg">
                    <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">AI Status</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current configuration</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {config.systemPrompt ? 'System prompt configured' : 'No system prompt set'}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Navigation Routes Management */}
        <div className="col-span-full">
          <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border-0">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                  <Route className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Navigation Routes</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage routes that the AI can reference and navigate to</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              {/* Add New Route Form */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-4">Add New Route</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Page Name</label>
                    <Input
                      placeholder="e.g., Dashboard"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Route Path</label>
                    <Input
                      placeholder="e.g., /dashboard"
                      value={newItem.route}
                      onChange={(e) => setNewItem(prev => ({ ...prev, route: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Brief description"
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        className="flex-1"
                      />
                      <Button 
                        onClick={addNavigationItem} 
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Items List */}
              <div className="space-y-3">
                {config.navigationData.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-800 dark:text-gray-100">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.route}
                          </Badge>
                          {item.isActive && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Active
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNavigationItem(item.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {config.navigationData.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4">
                    <Bot className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No navigation routes configured</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Add routes above to help the AI understand your application structure and provide better navigation assistance.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-xl border-0">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Edit Navigation Item</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page Name</label>
                  <Input
                    placeholder="Page Name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Route Path</label>
                  <Input
                    placeholder="Route"
                    value={editingItem.route}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, route: e.target.value } : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <Input
                    placeholder="Description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => updateNavigationItem(editingItem)}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function AIChatbotAdminPage() {
  return (
    <AdminLayout>
      <AIChatbotAdminContent />
    </AdminLayout>
  )
}

