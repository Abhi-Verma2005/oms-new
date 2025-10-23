"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface ProgressiveMarkdownRendererProps {
  content: string
  className?: string
  variant?: 'default' | 'chatbot'
  theme?: 'light' | 'dark'
  isUserMessage?: boolean
  isStreaming?: boolean
}

// Progressive markdown renderer that handles incomplete syntax gracefully
export function ProgressiveMarkdownRenderer({
  content,
  className,
  variant = 'default',
  theme,
  isUserMessage = false,
  isStreaming = false
}: ProgressiveMarkdownRendererProps) {
  const isChatbot = variant === 'chatbot'
  const isLight = theme === 'light'
  
  // State for progressive rendering
  const [renderedContent, setRenderedContent] = useState('')
  const [lastCompleteIndex, setLastCompleteIndex] = useState(0)

  // Function to split content into complete and incomplete parts
  const splitContentForProgressiveRendering = useCallback((text: string) => {
    if (!isStreaming || !text) {
      return { complete: text, incomplete: '' }
    }

    // For streaming, we need to be more lenient with markdown parsing
    // Instead of trying to split into complete/incomplete, we'll parse the entire content
    // and let ReactMarkdown handle partial syntax gracefully
    
    // Find the last reasonable break point (sentence, paragraph, or line)
    let lastBreakPoint = 0
    
    // Look for natural break points that are safe to render
    const breakPatterns = [
      // End of sentences followed by space or newline
      /([.!?]\s+)/g,
      // End of paragraphs (double newline)
      /(\n\n)/g,
      // End of lines
      /(\n)/g,
      // End of words (space)
      /(\s+)/g,
    ]

    for (const pattern of breakPatterns) {
      const matches = [...text.matchAll(pattern)]
      for (const match of matches) {
        const endIndex = match.index! + match[0].length
        if (endIndex > lastBreakPoint && endIndex < text.length - 10) { // Leave at least 10 chars for incomplete
          lastBreakPoint = endIndex
        }
      }
    }

    // If we found a good break point, use it
    if (lastBreakPoint > 0) {
      return {
        complete: text.substring(0, lastBreakPoint),
        incomplete: text.substring(lastBreakPoint)
      }
    }
    
    // If no good break point found, render everything as complete
    // This ensures markdown is processed even if incomplete
    return { complete: text, incomplete: '' }
  }, [isStreaming])

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

    // Code blocks
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

    // Links
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

    // Tables
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
  }), [isChatbot, isUserMessage, isLight])

  // Update rendered content when streaming
  useEffect(() => {
    console.log('🔄 [ProgressiveMarkdown] useEffect triggered:', {
      contentLength: content.length,
      isStreaming,
      hasContent: !!content
    })
    
    if (!isStreaming) {
      setRenderedContent(content)
      console.log('🔄 [ProgressiveMarkdown] Not streaming, setting content directly')
      return
    }

    const { complete, incomplete } = splitContentForProgressiveRendering(content)
    
    // For streaming, we want to render markdown even if it's incomplete
    // ReactMarkdown can handle partial syntax gracefully
    let finalContent = complete
    
    if (incomplete) {
      // Instead of wrapping incomplete content in HTML, append it directly
      // This allows ReactMarkdown to process it as part of the markdown
      finalContent += incomplete
    }
    
    setRenderedContent(finalContent)
    
    // Debug logging
    if (content.length > 0) {
      console.log('🔄 [ProgressiveMarkdown] Content updated:', {
        totalLength: content.length,
        completeLength: complete.length,
        incompleteLength: incomplete.length,
        isStreaming,
        finalContentLength: finalContent.length
      })
    }
  }, [content, isStreaming, splitContentForProgressiveRendering])

  if (!renderedContent && !content) {
    return null
  }
  
  try {
    return (
      <div className={cn(
        "max-w-none",
        className,
        isStreaming && "streaming-content"
      )}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={components}
        >
          {renderedContent || content}
        </ReactMarkdown>
      </div>
    )
  } catch (error) {
    console.error('Progressive markdown rendering error:', error)
    return (
      <div className={cn(
        "text-sm",
        isChatbot ? "text-white" : "text-gray-700 dark:text-gray-300"
      )}>
        {renderedContent || content}
      </div>
    )
  }
}
