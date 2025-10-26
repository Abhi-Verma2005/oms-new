'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Loader2, X, Minimize2, Maximize2, CheckCircle, ExternalLink, Upload, FileText, Loader2 as Spinner, CheckCircle as Check, XCircle, Clock, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserContextForAI } from '@/stores/user-context-store'
import { useDropzone } from 'react-dropzone'
import { Streamdown } from 'streamdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatbotSidebarProps {
  isOpen: boolean
  onToggle: () => void
  userId?: string
}

export default function AIChatbotSidebar({ isOpen, onToggle, userId = 'anonymous' }: AIChatbotSidebarProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { getUserContextForAI } = useUserContextForAI()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`chat-messages-${userId}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [toolActions, setToolActions] = useState<any[]>([])
  const [showToolFeedback, setShowToolFeedback] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [documentStatuses, setDocumentStatuses] = useState<Map<string, string>>(new Map())
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Load documents on mount
  useEffect(() => {
    loadUserDocuments()
    return () => {
      // FIXED: Cleanup all intervals on unmount
      intervalRefs.current.forEach(interval => clearInterval(interval))
    }
  }, [userId])

  // Load user's documents
  const loadUserDocuments = async () => {
    try {
      const response = await fetch(`/api/user-documents?userId=${userId}`)
      const result = await response.json()
      
      if (result.success) {
        setUploadedDocuments(result.documents)
        
        // Auto-select completed documents
        const completedDocs = result.documents
          .filter((d: any) => d.processing_status === 'completed')
          .map((d: any) => d.id)
        setSelectedDocuments(completedDocs)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  // FIXED: Upload with proper error handling and progress tracking
  const handleDocumentUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    setUploadingFiles(fileArray.map(f => f.name))
    
    for (const file of fileArray) {
      try {
        // Validate file client-side
        if (file.size > 10 * 1024 * 1024) {
          const errorMsg: Message = {
            role: 'assistant',
            content: `❌ File "${file.name}" is too large (max 10MB)`
          }
          setMessages(prev => [...prev, errorMsg])
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', userId)
        
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
          // Add to documents list
          setUploadedDocuments(prev => [...prev, result.document])
          
          // Success message
          const successMsg: Message = {
            role: 'assistant',
            content: `📄 Uploading "${result.document.original_name}"... Processing will complete shortly.`
          }
          setMessages(prev => [...prev, successMsg])
          
          // Start polling for this document
          pollDocumentStatus(result.document.id)
          
        } else if (response.status === 409) {
          // Duplicate file
          const duplicateMsg: Message = {
            role: 'assistant',
            content: `ℹ️ "${file.name}" is already uploaded. Using existing document.`
          }
          setMessages(prev => [...prev, duplicateMsg])
          
        } else {
          throw new Error(result.error || 'Upload failed')
        }
        
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error)
        const errorMsg: Message = {
          role: 'assistant',
          content: `❌ Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        }
        setMessages(prev => [...prev, errorMsg])
      }
    }
    
    setUploadingFiles([])
  }

  // FIXED: Proper status polling with cleanup
  const pollDocumentStatus = (documentId: string) => {
    let pollCount = 0
    const maxPolls = 15 // 30 seconds max (2s interval)
    
    const interval = setInterval(async () => {
      pollCount++
      
      try {
        const response = await fetch(`/api/document-status/${documentId}`)
        const result = await response.json()
        
        if (result.success) {
          const status = result.document.processing_status
          
          // Update status map
          setDocumentStatuses(prev => new Map(prev).set(documentId, status))
          
          if (status === 'completed') {
            // Clear interval
            clearInterval(interval)
            intervalRefs.current.delete(documentId)
            
            // Reload documents
            loadUserDocuments()
            
            // Success message
            const msg: Message = {
              role: 'assistant',
              content: `✅ Document "${result.document.original_name}" is ready! I can now use its content to help you find publishers. (${result.document.chunk_count} sections indexed)`
            }
            setMessages(prev => [...prev, msg])
            
          } else if (status === 'failed') {
            // Clear interval
            clearInterval(interval)
            intervalRefs.current.delete(documentId)
            
            // Error message
            const msg: Message = {
              role: 'assistant',
              content: `❌ Failed to process "${result.document.original_name}": ${result.document.error_message || 'Unknown error'}`
            }
            setMessages(prev => [...prev, msg])
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
      
      // Stop after max polls
      if (pollCount >= maxPolls) {
        clearInterval(interval)
        intervalRefs.current.delete(documentId)
      }
    }, 2000)
    
    // Track interval for cleanup
    intervalRefs.current.set(documentId, interval)
  }

  // Toggle document selection
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  // Delete document
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/delete-document/${documentId}?userId=${userId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from state
        setUploadedDocuments(prev => prev.filter(d => d.id !== documentId))
        setSelectedDocuments(prev => prev.filter(id => id !== documentId))
        
        const msg: Message = {
          role: 'assistant',
          content: `🗑️ Document deleted successfully.`
        }
        setMessages(prev => [...prev, msg])
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // Get current filter state from URL
      const currentFilters: any = {}
      if (searchParams.get('daMin')) currentFilters.daMin = parseInt(searchParams.get('daMin')!)
      if (searchParams.get('daMax')) currentFilters.daMax = parseInt(searchParams.get('daMax')!)
      if (searchParams.get('drMin')) currentFilters.drMin = parseInt(searchParams.get('drMin')!)
      if (searchParams.get('drMax')) currentFilters.drMax = parseInt(searchParams.get('drMax')!)
      if (searchParams.get('spamMin')) currentFilters.spamMin = parseInt(searchParams.get('spamMin')!)
      if (searchParams.get('spamMax')) currentFilters.spamMax = parseInt(searchParams.get('spamMax')!)
      if (searchParams.get('priceMin')) currentFilters.priceMin = parseInt(searchParams.get('priceMin')!)
      if (searchParams.get('priceMax')) currentFilters.priceMax = parseInt(searchParams.get('priceMax')!)
      if (searchParams.get('paMin')) currentFilters.paMin = parseInt(searchParams.get('paMin')!)
      if (searchParams.get('paMax')) currentFilters.paMax = parseInt(searchParams.get('paMax')!)
      if (searchParams.get('niche')) currentFilters.niche = searchParams.get('niche')
      if (searchParams.get('country')) currentFilters.country = searchParams.get('country')
      if (searchParams.get('language')) currentFilters.language = searchParams.get('language')
      if (searchParams.get('trafficMin')) currentFilters.trafficMin = parseInt(searchParams.get('trafficMin')!)
      if (searchParams.get('backlinkNature')) currentFilters.backlinkNature = searchParams.get('backlinkNature')
      if (searchParams.get('availability') !== null) currentFilters.availability = searchParams.get('availability') === 'true'

      // Create streaming response
      const response = await fetch('/api/chat-streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId,
          currentFilters,
          selectedDocuments // Include selected documents
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      let toolResults: any[] = []

      if (reader) {
        // Add empty assistant message for streaming
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                
                // Handle content streaming
                if (parsed.content) {
                  assistantMessage += parsed.content
                  setMessages(prev => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage?.role === 'assistant') {
                      newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: assistantMessage
                      }
                    }
                    return newMessages
                  })
                }

                // Handle tool results
                if (parsed.toolResults) {
                  toolResults = parsed.toolResults
                  setToolActions(parsed.toolResults)
                  setShowToolFeedback(true)
                  
                  // Handle tool execution
                  for (const toolResult of parsed.toolResults) {
                    switch (toolResult.action) {
                      case 'filter_applied':
                        if (toolResult.url) {
                          console.log('🔍 Applying filters to URL:', toolResult.url)
                          
                          // Simply navigate to the new URL - this will trigger all the necessary updates
                          router.push(toolResult.url)
                          
                          console.log('✅ Filters applied to URL:', toolResult.url)
                          setTimeout(() => setShowToolFeedback(false), 2000)
                        }
                        break
                      case 'navigate':
                        if (toolResult.route) {
                          router.push(toolResult.route)
                          setTimeout(() => setShowToolFeedback(false), 2000)
                        }
                        break
                      case 'cart_updated':
                        console.log('🛒 Cart updated:', toolResult.message)
                        setTimeout(() => setShowToolFeedback(false), 3000)
                        break
                      case 'search_completed':
                        console.log('🔍 RAG Search completed:', toolResult.message)
                        if (toolResult.sources && toolResult.sources.length > 0) {
                          console.log('📚 Found documents:', toolResult.sources)
                        }
                        setTimeout(() => setShowToolFeedback(false), 3000)
                        break
                    }
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(`chat-messages-${userId}`, JSON.stringify(messages))
    }
  }, [messages, userId])

  const formatMessage = (message: any) => {
    if (typeof message.content === 'string') {
      let content = message.content
      
      // Remove tool call markers from display
      content = content.replace(/\[FILTER:[^\]]+\]/g, '')
      content = content.replace(/\[NAVIGATE:[^\]]+\]/g, '')
      content = content.replace(/\[ADD_TO_CART:[^\]]+\]/g, '')
      content = content.replace(/\[SEARCH:[^\]]+\]/g, '')
      
      // Clean up extra whitespace but preserve markdown formatting
      content = content.replace(/\n\s*\n/g, '\n\n')
      
      return content
    }
    return JSON.stringify(message.content, null, 2)
  }

  const clearChat = () => {
    setMessages([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`chat-messages-${userId}`)
    }
  }


  // Dropzone configuration
  const { getInputProps, open } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md']
    },
    onDrop: handleDocumentUpload,
    multiple: true,
    maxFiles: 5,
    noClick: true,
    noKeyboard: true
  })

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'filter':
        return '🔍'
      case 'navigate':
        return '🧭'
      case 'addToCart':
        return '🛒'
      case 'searchDocuments':
        return '📄'
            default:
        return '🤖'
    }
  }

  const handleToolAction = (toolName: string, result: any) => {
    console.log(`Tool ${toolName} executed:`, result)
    
    // Handle different tool actions
    switch (toolName) {
      case 'navigate':
        if (result.route) {
          window.location.href = result.route
        }
        break
      case 'filter':
        if (result.filters) {
          // Update URL with filters
          const url = new URL(window.location.href)
          Object.entries(result.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.set(key, String(value))
            }
          })
          window.history.pushState({}, '', url.toString())
        }
        break
      case 'addToCart':
        if (result.itemId) {
          // Trigger cart update event
          window.dispatchEvent(new CustomEvent('cart-updated', { 
            detail: { itemId: result.itemId, action: 'add' }
          }))
        }
        break
    }
  }

  return (
    <>
      {/* Tool Action Feedback */}
      {showToolFeedback && toolActions.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Actions Executed
            </div>
            {toolActions.map((action, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                {action.action === 'filter_applied' && <ExternalLink className="w-3 h-3" />}
                {action.action === 'navigate' && <ExternalLink className="w-3 h-3" />}
                {action.action === 'cart_updated' && <CheckCircle className="w-3 h-3 text-green-600" />}
                {action.action === 'search_completed' && <CheckCircle className="w-3 h-3 text-blue-600" />}
                {action.action === 'document_uploaded' && <FileText className="w-3 h-3 text-purple-600" />}
                <span>{action.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn(
        "h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
        isMinimized ? "w-16" : "w-96"
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isMinimized && (
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">AI Assistant</span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
        )}
                 <div className="flex gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                       size="icon"
                onClick={clearChat}
                       className="w-8 h-8"
                title="Clear chat"
              >
                       <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
                     size="icon"
                     onClick={() => setIsMinimized(!isMinimized)}
                     className="w-8 h-8"
                   >
                     {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                   </Button>
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={onToggle}
                     className="w-8 h-8"
                   >
                     <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
        {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Hello! How can I help you today?</p>
                  <p className="text-xs text-gray-400 mt-2">
                    I can help you filter websites, navigate pages, and manage your cart.
                  </p>
          </div>
        )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm">
                      <Streamdown isAnimating={isLoading}>
                        {formatMessage(message)}
                      </Streamdown>
                      </div>
                    </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
              {error && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
            </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    <div className="text-sm text-red-600">
                      Error: {error.message}
        </div>
            </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
              
          {/* Document Upload Section */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">📁 Your Documents</h4>
              <label 
                htmlFor="doc-upload" 
                className="cursor-pointer text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                Upload
              </label>
              <input
                type="file"
                id="doc-upload"
                className="hidden"
                onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                accept=".txt,.pdf,.docx,.doc,.csv,.json,.xlsx,.xls"
                multiple
              />
            </div>
            
            {uploadingFiles.length > 0 && (
              <div className="mb-3 space-y-1">
                {uploadingFiles.map(filename => (
                  <div key={filename} className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                    <Spinner className="w-3 h-3 animate-spin" />
                    <span className="truncate">Uploading {filename}...</span>
                  </div>
                ))}
              </div>
            )}
            
            {uploadedDocuments.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedDocuments.map(doc => {
                  const status = documentStatuses.get(doc.id) || doc.processing_status
                  const isCompleted = status === 'completed'
                  const isProcessing = status === 'processing'
                  const isFailed = status === 'failed'
                  
                  return (
                    <div 
                      key={doc.id} 
                      className={`flex items-center gap-2 p-2 rounded text-xs ${
                        isCompleted ? 'bg-white border border-gray-200' : 
                        isProcessing ? 'bg-blue-50 border border-blue-200' :
                        'bg-red-50 border border-red-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        disabled={!isCompleted}
                        className="w-3 h-3 cursor-pointer disabled:cursor-not-allowed"
                      />
                      
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {doc.original_name}
                        </p>
                        {isCompleted && doc.chunk_count && (
                          <p className="text-gray-500">
                            {doc.chunk_count} sections • {(doc.file_size / 1024).toFixed(0)}KB
                          </p>
                        )}
                        {isFailed && doc.error_message && (
                          <p className="text-red-600 truncate">
                            {doc.error_message}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isProcessing && <Spinner className="w-4 h-4 animate-spin text-blue-500" />}
                        {isCompleted && <Check className="w-4 h-4 text-green-500" />}
                        {isFailed && <XCircle className="w-4 h-4 text-red-500" />}
                        {status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                        
                        {isCompleted && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No documents uploaded yet</p>
                <p className="mt-1 text-gray-400">
                  Upload documents to get personalized recommendations
                </p>
              </div>
            )}
            
            {selectedDocuments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  ✓ {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message or upload a document..."
                  className="pr-12"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <input {...getInputProps()} className="hidden" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={open}
                    className="w-8 h-8 p-0"
                    title="Upload document"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            
            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadingFiles.map((filename, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Uploading {filename}...</span>
                  </div>
                ))}
              </div>
            )}
                    </div>
        </>
      )}

      {isMinimized && (
        <div className="flex-1 flex items-center justify-center">
                  <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(false)}
            className="w-12 h-12"
          >
            <Bot className="w-6 h-6 text-blue-600" />
                  </Button>
                </div>
      )}
              </div>
    </>
  )
}