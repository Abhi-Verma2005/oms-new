"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface StreamingMarkdownRendererProps {
  content: string
  className?: string
  variant?: 'default' | 'chatbot'
  theme?: 'light' | 'dark'
  isUserMessage?: boolean
  isStreaming?: boolean
}

// Performance-optimized markdown renderer for streaming content
export function StreamingMarkdownRenderer({
  content,
  className,
  variant = 'default',
  theme,
  isUserMessage = false,
  isStreaming = false
}: StreamingMarkdownRendererProps) {
  const isChatbot = variant === 'chatbot'
  const isLight = theme === 'light'

  // Refs for managing streaming state
  const contentBufferRef = useRef('')
  const lastRenderedRef = useRef('')
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // State for incremental rendering
  const [displayContent, setDisplayContent] = useState(content)
  const [isRendering, setIsRendering] = useState(false)
  
  // Memoize the components to prevent recreation on every render
  const components = useMemo(() => ({
    // Headings
    h1: ({ children, ...props }: any) => (
      <h1 className={cn(
        "text-xl font-bold mb-4 mt-6 first:mt-0",
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-900 dark:text-gray-100"
      )} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className={cn(
        "text-lg font-semibold mb-3 mt-5 first:mt-0",
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-900 dark:text-gray-100"
      )} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className={cn(
        "text-base font-semibold mb-2 mt-4 first:mt-0",
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-900 dark:text-gray-100"
      )} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className={cn(
        "text-sm font-semibold mb-2 mt-3 first:mt-0",
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-900 dark:text-gray-100"
      )} {...props}>
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children, ...props }: any) => (
      <p className={cn(
        "mb-3 leading-relaxed",
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-700 dark:text-gray-300"
      )} {...props}>
        {children}
      </p>
    ),

    // Lists
    ul: ({ children, ...props }: any) => (
      <ul className={cn(
        "list-disc list-inside mb-3 space-y-1",
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-700 dark:text-gray-300"
      )} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className={cn(
        "list-decimal list-inside mb-3 space-y-1",
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-700 dark:text-gray-300"
      )} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className={cn(
        isChatbot 
          ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
          : "text-gray-700 dark:text-gray-300"
      )} {...props}>
        {children}
      </li>
    ),

    // Code blocks - optimized for streaming
    code: ({ children, className, ...props }: any) => {
      const isInline = !className?.includes('language-')
      if (isInline) {
        return (
          <code 
            className={cn(
              "px-1.5 py-0.5 rounded text-sm font-mono",
              isChatbot 
                ? "bg-violet-500/20 text-violet-100" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            )} 
            {...props}
          >
            {children}
          </code>
        )
      }
      return (
        <code className={cn(
          "block p-4 rounded-lg overflow-x-auto mb-4 text-sm font-mono",
          isChatbot 
            ? "bg-gray-800/50 text-gray-100 border border-gray-700" 
            : "bg-gray-900 dark:bg-gray-800 text-gray-100"
        )} {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }: any) => (
      <div className="mb-4">
        {children}
      </div>
    ),

    // Blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote className={cn(
        "border-l-4 border-violet-500 pl-4 py-2 mb-4 italic",
        isChatbot 
          ? (isLight ? "bg-[#6A5ACD]/10 text-black" : "bg-violet-500/10 text-violet-100")
          : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
      )} {...props}>
        {children}
      </blockquote>
    ),

    // Links - render as plain text to prevent layout shifts during streaming
    a: ({ children, href, ...props }: any) => (
      <span 
        className={cn(
          isChatbot 
            ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
            : "text-gray-700 dark:text-gray-300"
        )}
        {...props}
      >
        {children}
      </span>
    ),

    // Tables - optimized for streaming
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto mb-4">
        <table className={cn(
          "min-w-full border rounded-lg",
          isChatbot 
            ? "border-gray-600" 
            : "border-gray-200 dark:border-gray-700"
        )} {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className={cn(
        isChatbot ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-800"
      )} {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody className={cn(
        "divide-y",
        isChatbot 
          ? "divide-gray-600" 
          : "divide-gray-200 dark:divide-gray-700"
      )} {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: any) => (
      <tr className={cn(
        isChatbot 
          ? "hover:bg-gray-700/50" 
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      )} {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: any) => (
      <th className={cn(
        "px-4 py-2 text-left text-xs font-medium uppercase tracking-wider",
        isChatbot 
          ? "text-gray-300" 
          : "text-gray-500 dark:text-gray-400"
      )} {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className={cn(
        "px-4 py-2 text-sm",
        isChatbot 
          ? "text-white" 
          : "text-gray-900 dark:text-gray-100"
      )} {...props}>
        {children}
      </td>
    ),

    // Horizontal rule
    hr: ({ ...props }: any) => (
      <hr className={cn(
        "my-6",
        isChatbot ? "border-gray-600" : "border-gray-200 dark:border-gray-700"
      )} {...props} />
    ),

    // Strong and emphasis
    strong: ({ children, ...props }: any) => (
      <strong className={cn(
        "font-semibold",
        isChatbot ? "text-white" : "text-gray-900 dark:text-gray-100"
      )} {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className={cn(
        "italic",
        isChatbot ? "text-white" : "text-gray-700 dark:text-gray-300"
      )} {...props}>
        {children}
      </em>
    ),

    // Strikethrough
    del: ({ children, ...props }: any) => (
      <del className={cn(
        "line-through",
        isChatbot ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
      )} {...props}>
        {children}
      </del>
    ),

    // Task lists
    input: ({ type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className={cn(
              "mr-2 rounded focus:ring-violet-500",
              isChatbot 
                ? "border-gray-500 text-violet-400" 
                : "border-gray-300 dark:border-gray-600 text-violet-600"
            )}
            {...props}
          />
        )
      }
      return <input type={type} {...props} />
    },

    // Images - optimized for streaming
    img: ({ src, alt, ...props }: any) => (
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg shadow-sm mb-4"
        loading="lazy" // Lazy load images during streaming
        {...props}
      />
    ),
  }), [isChatbot, isUserMessage, isLight])
  
  // Function to parse partial markdown content
  const parsePartialMarkdown = useCallback((content: string) => {
    if (!content) return content

    // For streaming, we want to be more conservative with "fixing" markdown
    // Let ReactMarkdown handle partial syntax naturally
    let parsed = content

    // Only fix truly broken syntax that would cause rendering issues
    // Fix incomplete code blocks (only if they're clearly incomplete)
    const codeBlockCount = (parsed.match(/```/g) || []).length
    if (codeBlockCount % 2 === 1 && parsed.endsWith('```')) {
      // Only add closing backticks if the last line is just ```
      parsed += '\n```'
    }

    // Don't "fix" incomplete bold/italic or other formatting during streaming
    // as this can interfere with the natural rendering process
    // ReactMarkdown is robust enough to handle partial syntax

    return parsed
  }, [])

  // Incremental parsing function for streaming content
  const parseIncrementalContent = useCallback((newContent: string) => {
    if (!isStreaming) {
      setDisplayContent(newContent)
      return
    }

    // For streaming, update immediately without debouncing to ensure real-time rendering
    contentBufferRef.current = newContent
    
    // For streaming, we want to render the content as-is to preserve markdown formatting
    // Only apply minimal parsing to avoid breaking partial syntax
    const parsedContent = parsePartialMarkdown(newContent)
    setDisplayContent(parsedContent)
    
    // Debug logging for streaming
    if (newContent.length > 0) {
      console.log('🔄 [StreamingMarkdown] Content updated:', {
        length: newContent.length,
        isStreaming,
        hasMarkdown: /[#*`\[\]]/.test(newContent),
        contentPreview: newContent.substring(0, 50) + '...'
      })
    }
  }, [isStreaming, parsePartialMarkdown])

  // Handle content updates
  useEffect(() => {
    parseIncrementalContent(content)
  }, [content, parseIncrementalContent])

  // Force re-render during streaming to ensure markdown updates
  useEffect(() => {
    if (isStreaming && content) {
      // Force immediate update during streaming
      const parsedContent = parsePartialMarkdown(content)
      setDisplayContent(parsedContent)
      
      // Debug logging
      if (content.length > 0) {
        console.log('🔄 [StreamingMarkdown] Content updated:', {
          length: content.length,
          hasMarkdown: /[#*`\[\]]/.test(content),
          isStreaming
        })
      }
    }
  }, [content, isStreaming, parsePartialMarkdown])

  // Listen for custom markdown update events during streaming
  useEffect(() => {
    if (!isStreaming) return

    const handleMarkdownUpdate = (event: CustomEvent) => {
      const { content: newContent } = event.detail
      if (newContent && newContent !== content) {
        const parsedContent = parsePartialMarkdown(newContent)
        setDisplayContent(parsedContent)
        console.log('🔄 [StreamingMarkdown] Custom event update:', newContent.length)
      }
    }

    window.addEventListener('markdown-update', handleMarkdownUpdate as EventListener)
    return () => window.removeEventListener('markdown-update', handleMarkdownUpdate as EventListener)
  }, [isStreaming, content, parsePartialMarkdown])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [])
  
  // Early return after all hooks
  if (!displayContent && !content) {
    return null
  }
  
  try {
    return (
      <div className={cn(
        "max-w-none",
        className,
        isStreaming && "streaming-content", // Add class for streaming state
        isRendering && "rendering-content" // Add class for rendering state
      )}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={components}
        >
          {displayContent || content}
        </ReactMarkdown>
      </div>
    )
  } catch (error) {
    console.error('Streaming markdown rendering error:', error)
    return (
      <div className={cn(
        "text-sm",
        isChatbot ? "text-white" : "text-gray-700 dark:text-gray-300"
      )}>
        {displayContent || content}
      </div>
    )
  }
}
