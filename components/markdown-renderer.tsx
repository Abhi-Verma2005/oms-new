"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  variant?: 'default' | 'chatbot'
  theme?: 'light' | 'dark'
  isUserMessage?: boolean
}

export function MarkdownRenderer({ content, className, variant = 'default', theme, isUserMessage = false }: MarkdownRendererProps) {
  const isChatbot = variant === 'chatbot'
  const isLight = theme === 'light'
  
  if (!content) {
    return null
  }
  
  try {
    return (
      <div className={cn(
        "max-w-none",
        className
      )}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
          // Headings
          h1: ({ children, ...props }) => (
            <h1 className={cn(
              "text-xl font-bold mb-4 mt-6 first:mt-0",
              isChatbot 
                ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
                : "text-gray-900 dark:text-gray-100"
            )} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className={cn(
              "text-lg font-semibold mb-3 mt-5 first:mt-0",
              isChatbot 
                ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
                : "text-gray-900 dark:text-gray-100"
            )} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className={cn(
              "text-base font-semibold mb-2 mt-4 first:mt-0",
              isChatbot 
                ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
                : "text-gray-900 dark:text-gray-100"
            )} {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
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
          p: ({ children, ...props }) => (
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
          ul: ({ children, ...props }) => (
            <ul className={cn(
              "list-disc list-inside mb-3 space-y-1",
              isChatbot 
                ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
                : "text-gray-700 dark:text-gray-300"
            )} {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className={cn(
              "list-decimal list-inside mb-3 space-y-1",
              isChatbot 
                ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
                : "text-gray-700 dark:text-gray-300"
            )} {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className={cn(
              isChatbot 
                ? (isUserMessage ? "text-white" : (isLight ? "text-black" : "text-white"))
                : "text-gray-700 dark:text-gray-300"
            )} {...props}>
              {children}
            </li>
          ),

          // Code blocks
          code: ({ children, className, ...props }) => {
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
          pre: ({ children, ...props }) => (
            <div className="mb-4">
              {children}
            </div>
          ),

          // Blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote className={cn(
              "border-l-4 border-violet-500 pl-4 py-2 mb-4 italic",
              isChatbot 
                ? (isLight ? "bg-[#6A5ACD]/10 text-black" : "bg-violet-500/10 text-violet-100")
                : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
            )} {...props}>
              {children}
            </blockquote>
          ),

          // Links - render as plain text to prevent layout shifts
          a: ({ children, href, ...props }) => (
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
          table: ({ children, ...props }) => (
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
          thead: ({ children, ...props }) => (
            <thead className={cn(
              isChatbot ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-800"
            )} {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className={cn(
              "divide-y",
              isChatbot 
                ? "divide-gray-600" 
                : "divide-gray-200 dark:divide-gray-700"
            )} {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className={cn(
              isChatbot 
                ? "hover:bg-gray-700/50" 
                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
            )} {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className={cn(
              "px-4 py-2 text-left text-xs font-medium uppercase tracking-wider",
              isChatbot 
                ? "text-gray-300" 
                : "text-gray-500 dark:text-gray-400"
            )} {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
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
          hr: ({ ...props }) => (
            <hr className={cn(
              "my-6",
              isChatbot ? "border-gray-600" : "border-gray-200 dark:border-gray-700"
            )} {...props} />
          ),

          // Strong and emphasis
          strong: ({ children, ...props }) => (
            <strong className={cn(
              "font-semibold",
              isChatbot ? "text-white" : "text-gray-900 dark:text-gray-100"
            )} {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className={cn(
              "italic",
              isChatbot ? "text-white" : "text-gray-700 dark:text-gray-300"
            )} {...props}>
              {children}
            </em>
          ),

          // Strikethrough
          del: ({ children, ...props }) => (
            <del className={cn(
              "line-through",
              isChatbot ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
            )} {...props}>
              {children}
            </del>
          ),

          // Task lists
          input: ({ type, checked, ...props }) => {
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

          // Images
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg shadow-sm mb-4"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
    )
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return (
      <div className={cn(
        "text-sm",
        isChatbot ? "text-white" : "text-gray-700 dark:text-gray-300"
      )}>
        {content}
      </div>
    )
  }
}
