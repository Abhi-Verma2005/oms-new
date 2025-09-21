"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function DebugEnvPage() {
  const [envStatus, setEnvStatus] = useState<any>(null)
  const [geminiStatus, setGeminiStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkEnvironment = async () => {
    setIsLoading(true)
    try {
      // Check Gemini API
      const geminiResponse = await fetch('/api/test-gemini')
      const geminiData = await geminiResponse.json()
      setGeminiStatus(geminiData)

      // Check environment variables (client-side)
      setEnvStatus({
        hasGeminiKey: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        geminiKeyLength: process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length || 0,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set'
      })
    } catch (error) {
      console.error('Error checking environment:', error)
      setGeminiStatus({ error: 'Failed to check Gemini API' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'missing_key':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'connection_failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Environment Debug
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Check AI Chatbot configuration and environment variables
          </p>
        </div>

        <div className="space-y-6">
          {/* Environment Variables */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Environment Variables
            </h2>
            {envStatus ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {envStatus.hasGeminiKey ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-gray-900 dark:text-white">
                    NEXT_PUBLIC_GEMINI_API_KEY: {envStatus.hasGeminiKey ? 'Set' : 'Not set'}
                  </span>
                </div>
                {envStatus.hasGeminiKey && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                    Key length: {envStatus.geminiKeyLength} characters
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-900 dark:text-white">
                    NEXTAUTH_URL: {envStatus.nextAuthUrl}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
          </Card>

          {/* Gemini API Status */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Gemini API Status
            </h2>
            {geminiStatus ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(geminiStatus.status)}
                  <span className="text-gray-900 dark:text-white">
                    Status: {geminiStatus.status || 'Unknown'}
                  </span>
                </div>
                {geminiStatus.message && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                    {geminiStatus.message}
                  </div>
                )}
                {geminiStatus.error && (
                  <div className="text-sm text-red-600 dark:text-red-400 ml-8">
                    Error: {geminiStatus.error}
                  </div>
                )}
                {geminiStatus.details && (
                  <div className="text-sm text-red-600 dark:text-red-400 ml-8">
                    Details: {geminiStatus.details}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={checkEnvironment} disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Refresh Status'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/test-chatbot', '_blank')}
            >
              Test Chatbot
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/admin/ai-chatbot', '_blank')}
            >
              Admin Panel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

