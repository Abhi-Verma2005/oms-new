'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Send, ArrowUp, Bot, User, Loader2, X, Minimize2, Maximize2, CheckCircle, ExternalLink, Upload, FileText, Loader2 as Spinner, CheckCircle as Check, XCircle, Clock, Trash2,
  Scissors, Paperclip, BookOpen, Filter, Plus, Mic, Brain, Telescope, Monitor, Presentation, BookmarkCheck,
  Search, Settings, Gift, Heart, HelpCircle, Mail, ChevronDown, Check as CheckIcon
} from 'lucide-react'
import Tooltip from '@/components/tooltip'
import { cn } from '@/lib/utils'
import { useUserContextForAI } from '@/stores/user-context-store'
import { useProjectStore } from '@/stores/project-store'
import { useFilterStore } from '@/stores/filter-store'
import { useCart } from '@/contexts/cart-context'
import { useDropzone } from 'react-dropzone'
import { Streamdown } from 'streamdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CartInlineSummary from '@/components/cart-inline-summary'

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
  const { getUserContextForAI } = useUserContextForAI()
  const { selectedProjectId } = useProjectStore()
  const { getCurrentState, updateFromAI } = useFilterStore()
  const { getTotalItems } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [messages, setMessages] = useState<Message[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isBackgroundPending, setIsBackgroundPending] = useState(false)
  const lastSubmitTsRef = useRef(0)
  const [error, setError] = useState<Error | null>(null)
  const [toolActions, setToolActions] = useState<any[]>([])
  const [showToolFeedback, setShowToolFeedback] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [documentStatuses, setDocumentStatuses] = useState<Map<string, string>>(new Map())
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [documentSearch, setDocumentSearch] = useState('')
  const [deletingDocument, setDeletingDocument] = useState<{ id: string; name: string } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Change inputRef to support textarea
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Truncate long filenames to prevent horizontal scroll
  const truncateFilename = (filename: string, maxLength: number = 25) => {
    if (filename.length <= maxLength) return filename
    
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1) {
      // No extension, just truncate
      return `${filename.substring(0, maxLength - 3)}...`
    }
    
    const extension = filename.substring(lastDotIndex)
    const nameWithoutExt = filename.substring(0, lastDotIndex)
    const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 3)
    return `${truncated}...${extension}`
  }

  // Load documents on mount
  useEffect(() => {
    loadUserDocuments()
    return () => {
      // FIXED: Cleanup all intervals on unmount
      intervalRefs.current.forEach(interval => clearInterval(interval))
    }
  }, [userId])

  // Load messages from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`chat-messages-${userId}`)
      if (saved) {
        try {
          const parsedMessages = JSON.parse(saved)
          setMessages(parsedMessages)
        } catch (error) {
          console.error('Failed to parse saved messages:', error)
        }
      }
    }
  }, [userId])

  // Load user's documents
  const loadUserDocuments = async () => {
    try {
      const response = await fetch(`/api/user-documents?userId=${userId}`)
      const result = await response.json()
      
      if (result.success) {
        setUploadedDocuments(result.documents)
        // Don't auto-select any documents - user will choose via "Add Context"
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
          // Add to documents list immediately
          const newDoc = {
            ...result.document,
            processing_status: 'processing'
          }
          setUploadedDocuments(prev => [...prev, newDoc])
          
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

  // Select all completed documents
  const selectAllDocuments = () => {
    const completedDocs = uploadedDocuments
      .filter(d => d.processing_status === 'completed')
      .map(d => d.id)
    setSelectedDocuments(completedDocs)
  }

  // Remove all selected documents
  const removeAllDocuments = () => {
    setSelectedDocuments([])
  }

  // Delete document
  const handleDeleteClick = (documentId: string) => {
    const doc = uploadedDocuments.find(d => d.id === documentId)
    if (!doc) return
    
    setDeletingDocument({ id: documentId, name: doc.original_name })
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDocument || isDeleting) return
    
    setIsDeleting(true)
    const currentDoc = deletingDocument
    
    try {
      const response = await fetch(`/api/delete-document/${currentDoc.id}?userId=${userId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      // Close dialog
      setShowDeleteDialog(false)
      
      if (result.success) {
        // Remove from state
        setUploadedDocuments(prev => prev.filter(d => d.id !== currentDoc.id))
        setSelectedDocuments(prev => prev.filter(id => id !== currentDoc.id))
        
        const msg: Message = {
          role: 'assistant',
          content: `🗑️ "${currentDoc.name}" deleted successfully.`
        }
        setMessages(prev => [...prev, msg])
      } else {
        // Show error message
        const msg: Message = {
          role: 'assistant',
          content: `❌ Failed to delete "${currentDoc.name}". Please try again.`
        }
        setMessages(prev => [...prev, msg])
      }
    } catch (error) {
      console.error('Delete failed:', error)
      setShowDeleteDialog(false)
      const msg: Message = {
        role: 'assistant',
        content: `❌ Failed to delete "${currentDoc.name}". Please try again.`
      }
      setMessages(prev => [...prev, msg])
    } finally {
      setIsDeleting(false)
      setDeletingDocument(null)
    }
  }
  
  const handleDeleteCancel = () => {
    if (isDeleting) return
    setShowDeleteDialog(false)
    setDeletingDocument(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const { filters: currentFilters, searchQuery, currentRowsVisible } = getCurrentState()
      const cartItemCount = getTotalItems()

      const response = await fetch('/api/chat-streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId,
          currentFilters,
          searchQuery,
          selectedDocuments,
          currentRowsVisible,
          cartItemCount
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      if (reader) {
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'stage1_complete') {
                // Stop loader and enable textarea after Stage 1
                setIsLoading(false)
                continue
              }

              if (parsed.type === 'background_started') {
                setIsBackgroundPending(true)
                continue
              }

              if (parsed.type === 'background_result') {
                if (parsed.toolResults) {
                  setToolActions(parsed.toolResults)
                  setShowToolFeedback(true)
                  for (const toolResult of parsed.toolResults) {
                    switch (toolResult.action) {
                      case 'filter_applied':
                        if (toolResult.filters) {
                          if (typeof (window as any).setAIFilterFlag === 'function') {
                            ;(window as any).setAIFilterFlag()
                          }
                          
                          // Update filters in Zustand store first
                          updateFromAI(toolResult.filters)
                          
                          // Also persist to localStorage keys that publishers page reads from
                          // This ensures filters persist even after redirect
                          try {
                            const storeState = useFilterStore.getState()
                            const filterPayload = { filters: toolResult.filters, q: '' }
                            
                            if (storeState.selectedProjectId) {
                              localStorage.setItem(`oms:last-filters:${storeState.selectedProjectId}`, JSON.stringify(filterPayload))
                            } else {
                              localStorage.setItem('oms:last-filters:individual', JSON.stringify(filterPayload))
                            }
                          } catch (error) {
                            console.warn('Failed to persist filters to localStorage:', error)
                          }
                          
                          // Check if we're not on /publishers and redirect if needed
                          const currentPath = (pathname || window.location.pathname).replace(/\/$/, '') // Remove trailing slash
                          if (currentPath !== '/publishers') {
                            // Small delay to ensure persistence completes before redirect
                            setTimeout(() => {
                              router.push('/publishers')
                            }, 100)
                          }
                          
                          setTimeout(() => setShowToolFeedback(false), 3000)
                        }
                        break
                      case 'navigate':
                        if (toolResult.route) {
                          router.push(toolResult.route)
                          setTimeout(() => setShowToolFeedback(false), 2000)
                        }
                        break
                      case 'cart_updated':
                      case 'search_completed':
                        setTimeout(() => setShowToolFeedback(false), 3000)
                        break
                    }
                  }
                }
                continue
              }

              if (parsed.type === 'background_error') {
                // Non-fatal for conversation UX
                console.warn('Background error:', parsed.error)
                continue
              }

              if (parsed.type === 'background_complete' || parsed.type === 'background_complete_noop') {
                setIsBackgroundPending(false)
                continue
              }

              // Content streaming from Stage 1
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
            } catch (_) {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation?.()
    const now = Date.now()
    if (now - lastSubmitTsRef.current < 400) {
      return
    }
    lastSubmitTsRef.current = now
    if (!input.trim()) return
    // Allow submission even during streaming/background processing
    // The message will be sent when current stream completes
    
    const text = input
    setInput('')

    // Allow submitting even when streaming - message will be queued and sent
    await sendMessage(text)
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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
          setInput(prev => prev + (prev ? ' ' : '') + transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error('Failed to start recognition:', error)
        setIsListening(false)
      }
    }
  }

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
          <div className="rounded-lg shadow-lg p-4 space-y-2" style={{ backgroundColor: '#1A202C', borderColor: '#2d3748' }}>
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Actions Executed
            </div>
            {toolActions.map((action, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                {action.action === 'filter_applied' && <ExternalLink className="w-3 h-3" />}
                {action.action === 'navigate' && <ExternalLink className="w-3 h-3" />}
                {action.action === 'cart_updated' && <CheckCircle className="w-3 h-3 text-green-500" />}
                {action.action === 'search_completed' && <CheckCircle className="w-3 h-3 text-blue-500" />}
                {action.action === 'document_uploaded' && <FileText className="w-3 h-3 text-purple-500" />}
                <span>{action.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div 
        className={cn(
          "h-full border-l flex flex-col transition-all duration-300 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/60",
          isMinimized ? "w-16" : "w-full max-w-4xl mx-auto pt-16"
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-gray-200 dark:border-gray-700/60">
        <div className="flex gap-2">
          {!isMinimized && isMounted && messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="w-6 h-6 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              title="Clear chat"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={onToggle}
            className="w-6 h-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div ref={scrollAreaRef} className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 ? (
                      <div className="space-y-6">
                {/* Greeting */}
                <div className="flex items-start gap-3">
                  <svg
                    className="fill-purple-500 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    width={32}
                    height={32}
                  >
                    <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                  </svg>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Hi,</h2>
                    <p className="text-xl text-gray-600 dark:text-white/90">How can I assist you today?</p>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="fill-purple-400"
                          xmlns="http://www.w3.org/2000/svg"
                          width={20}
                          height={20}
                          viewBox="0 0 32 32"
                        >
                          <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                        </svg>
                      </div>
                    )}
                  
                  <div
                    className={`max-w-[80%] ${
                      message.role === 'user'
                        ? 'text-white rounded-2xl px-4 py-3 bg-violet-600'
                        : 'text-gray-800 dark:text-gray-100 px-4'
                    }`}
                  >
                    <div className="text-sm">
                      <Streamdown isAnimating={isLoading}>
                        {formatMessage(message)}
                      </Streamdown>
                      </div>
                    </div>

                  {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 dark:bg-gray-700/60">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
            </div>
          ))}
          
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="fill-purple-400"
                        xmlns="http://www.w3.org/2000/svg"
                        width={20}
                        height={20}
                        viewBox="0 0 32 32"
                      >
                        <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
                      </svg>
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-gray-200 dark:bg-gray-700/50">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
          
              {error && (
                <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <X className="w-4 h-4 text-red-500" />
            </div>
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3">
                      <div className="text-sm text-red-600 dark:text-red-500">
                      Error: {error.message}
        </div>
            </div>
                        </div>
                      )}
              </div>
            )}
          </div>
                  
          {/* Input Area */}
          <div className="border rounded-lg border-gray-200 dark:border-gray-700/60 m-4 mt-0">
            <form onSubmit={handleSubmit}>
              <div className="p-1">
                {/* Add Context Button (always visible) and Selected Items inline */}
                <div className="mb-1 flex items-start gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex items-center border rounded-md text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:border-purple-500 bg-gray-100/70 dark:bg-gray-700/40 border-gray-200 dark:border-gray-700/60 transition-all duration-200",
                          selectedDocuments.length > 0 
                            ? "justify-center w-7 h-7 p-0 gap-0"
                            : "justify-start gap-2 h-7 px-2.5"
                        )}
                      >
                        <Plus className="w-3 h-3" />
                        <span
                          className={cn(
                            "overflow-hidden whitespace-nowrap transition-all duration-200",
                            selectedDocuments.length > 0
                              ? "max-w-0 opacity-0 ml-0"
                              : "max-w-[100px] opacity-100 ml-1"
                          )}
                        >
                          Add Context
                        </span>
                        <span className="sr-only">Add Context</span>
                      </button>
                    </DropdownMenuTrigger>
                    {/* Help tooltip to the right of Add Context (hidden when compact + icon) */}
                    {selectedDocuments.length === 0 && (
                      <div className="self-center">
                        <Tooltip 
                          className="ml-0" 
                          size="sm" 
                          bg="dark" 
                          position="right"
                          triggerClassName="ml-0"
                          iconClassName="w-4 h-4"
                        >
                          <div className="text-xs leading-relaxed text-gray-200 max-w-[240px] whitespace-normal break-words">
                            <div className="font-semibold mb-1">Using Add Context</div>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Upload PDFs, TXT, DOCX, CSV, or XLSX.</li>
                              <li>Select completed items to include in your next question.</li>
                              <li>Use Select All / Remove All to manage quickly.</li>
                            </ul>
                          </div>
                        </Tooltip>
                      </div>
                    )}
                    <DropdownMenuContent className="w-[300px] max-w-[92vw] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-md shadow-sm p-2 overflow-x-hidden">
                      <div className="space-y-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.multiple = true
                            input.accept = '.txt,.pdf,.docx,.doc,.csv,.json,.xlsx,.xls'
                            input.onchange = (ev: any) => {
                              if (ev.target.files) {
                                handleDocumentUpload(ev.target.files)
                              }
                            }
                            input.click()
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                          disabled={isLoading}
                        >
                          <Upload className="w-4 h-4" /> Upload
                        </button>

                        <Input
                          type="text"
                          placeholder="Search documents..."
                          value={documentSearch}
                          onChange={(e) => setDocumentSearch(e.target.value)}
                          className="h-8 text-sm bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />

                        {uploadedDocuments.filter(d => d.processing_status === 'completed').length > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                selectAllDocuments()
                              }}
                              className="hover:text-purple-600 dark:hover:text-purple-400"
                            >
                              Select All
                            </button>
                            <span className="mx-1">·</span>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                removeAllDocuments()
                              }}
                              className="hover:text-gray-800 dark:hover:text-gray-200"
                            >
                              Remove All
                            </button>
                          </div>
                        )}

                        <div className="max-h-56 overflow-y-auto overflow-x-hidden rounded-md">
                          {uploadedDocuments.length > 0 ? (
                            uploadedDocuments
                              .filter(doc => !documentSearch || doc.original_name.toLowerCase().includes(documentSearch.toLowerCase()))
                              .map(doc => {
                              const status = documentStatuses.get(doc.id) || doc.processing_status
                              const isCompleted = status === 'completed'
                              const isSelected = selectedDocuments.includes(doc.id)
                              const isFailed = status === 'failed'
                              const isProcessing = status === 'processing'
                              
                              return (
                                <div
                                  key={doc.id}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2.5 py-2 text-sm bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                    isSelected && "bg-gray-50 dark:bg-gray-800/50",
                                    !isCompleted && "opacity-60"
                                  )}
                                >
                                  <button
                                    className={cn(
                                      "flex-1 text-left flex items-center gap-2 min-w-0",
                                      !isCompleted && "cursor-not-allowed"
                                    )}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      if (isCompleted) toggleDocumentSelection(doc.id)
                                    }}
                                    disabled={!isCompleted}
                                  >
                                    <span className={cn(
                                      "inline-flex items-center justify-center w-4 h-4 rounded-full border",
                                      isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300 dark:border-gray-600"
                                    )}>
                                      <CheckIcon className={cn("w-3 h-3 text-white", isSelected ? "opacity-100" : "opacity-0")} />
                                    </span>
                                    <FileText className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                    <span className="truncate text-sm text-gray-700 dark:text-gray-300 min-w-0 flex-1" title={doc.original_name}>
                                      {truncateFilename(doc.original_name, 20)}
                                    </span>
                                    {isProcessing && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0 text-gray-500" />}
                                    {isFailed && <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeleteClick(doc.id)
                                    }}
                                    className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1"
                                    title="Delete document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )
                            })
                          ) : (
                            <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              No documents uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Selected Documents (inline to the right) */}
                  <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
                    <div className="flex gap-1">
                      {selectedDocuments.map(docId => {
                        const doc = uploadedDocuments.find(d => d.id === docId)
                        if (!doc) return null
                        return (
                          <div 
                            key={docId}
                            className="flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs flex-shrink-0 bg-gray-100/70 dark:bg-gray-700/40 border-gray-200 dark:border-gray-700/60"
                          >
                            <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap" title={doc.original_name}>
                              {truncateFilename(doc.original_name, 20)}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleDocumentSelection(docId)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Cart summary (above input) */}
                <CartInlineSummary />

                {/* Text input */}
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Start a conversation..."
                  className="px-3 py-2 focus:ring-0 resize-none bg-white dark:bg-gray-900 border-none text-gray-800 placeholder:text-gray-400 dark:text-white"
                  style={{ minHeight: '48px', maxHeight: '140px', height: 'auto', boxShadow: 'none' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.stopPropagation()
                      if ((e as any).repeat) return
                      // Allow submitting even during streaming - will queue the message
                      handleSubmit(e)
                    }
                  }}
                />

                {/* Actions below input */}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleListening}
                    className={cn(
                      "h-7 w-7 p-0 bg-transparent border-0 hover:bg-transparent",
                      isListening ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-300"
                    )}
                    disabled={isLoading || isBackgroundPending}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="h-7 w-7 p-0 text-white bg-violet-600 hover:bg-violet-700 rounded-full disabled:opacity-50"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </div>
              </div>

            </form>
            
            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
              <div className="px-2 pb-2 space-y-1">
                {uploadingFiles.map((filename, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
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
            <svg
              className="fill-purple-400"
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 32 32"
            >
              <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
            </svg>
                  </Button>
                </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingDocument && (
            <div className="py-2">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <FileText className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={deletingDocument.name}>
                  {deletingDocument.name}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                All associated data and search results will be permanently removed.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </div>
    </>
  )
}