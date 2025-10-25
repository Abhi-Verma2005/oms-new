'use client'

import { useState, useEffect } from 'react'
import AIChatMinimal from '@/components/ai-chat-minimal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TestAIChatPage() {
  const [userId, setUserId] = useState<string>('')
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Get a test user ID
    fetch('/api/test-user')
      .then(res => res.json())
      .then(data => {
        if (data.userId) {
          setUserId(data.userId)
        }
      })
      .catch(error => {
        console.error('Failed to get test user:', error)
        // Fallback to a hardcoded user ID for testing
        setUserId('test-user-123')
      })
  }, [])

  const runTest = async (testName: string, testData: any) => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      console.log(`🧪 Running test: ${testName}`)
      
      const response = await fetch('/api/chat-minimal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: testData.messages,
          userId: userId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const duration = Date.now() - startTime
      
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'success',
        duration,
        timestamp: new Date().toISOString()
      }])
      
      console.log(`✅ Test passed: ${testName} (${duration}ms)`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'error',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      }])
      
      console.error(`❌ Test failed: ${testName}`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const testCases = [
    {
      name: 'Basic Chat',
      messages: [
        { role: 'user', content: 'Hello! How are you?' }
      ]
    },
    {
      name: 'Document Search',
      messages: [
        { role: 'user', content: 'Search for documents about artificial intelligence' }
      ]
    },
    {
      name: 'Cart Management',
      messages: [
        { role: 'user', content: 'Add product "laptop-123" to my cart with quantity 2' }
      ]
    },
    {
      name: 'Navigation',
      messages: [
        { role: 'user', content: 'Navigate to the products page' }
      ]
    },
    {
      name: 'Filter Application',
      messages: [
        { role: 'user', content: 'Apply filters: category=electronics, price<500' }
      ]
    }
  ]

  const runAllTests = async () => {
    setIsLoading(true)
    setTestResults([])
    
    for (const testCase of testCases) {
      await runTest(testCase.name, testCase)
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-6 h-6" />
              AI Chat System Test Suite
            </CardTitle>
            <p className="text-gray-600">
              Test the minimal AI chat system with real functionality
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Test Controls */}
            <div className="flex gap-4">
              <Button 
                onClick={runAllTests} 
                disabled={isLoading || !userId}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Run All Tests
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setTestResults([])}
                disabled={isLoading}
              >
                Clear Results
              </Button>
            </div>

            {/* Individual Test Cases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testCases.map((testCase, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{testCase.name}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTest(testCase.name, testCase)}
                      disabled={isLoading || !userId}
                    >
                      Run
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {testCase.messages[0].content}
                  </p>
                </Card>
              ))}
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div>
                <h3 className="font-medium mb-4">Test Results</h3>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.name}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.duration}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="text-sm text-gray-600">
              <p><strong>Test User ID:</strong> {userId || 'Loading...'}</p>
              <p><strong>Total Tests:</strong> {testResults.length}</p>
              <p><strong>Passed:</strong> {testResults.filter(r => r.status === 'success').length}</p>
              <p><strong>Failed:</strong> {testResults.filter(r => r.status === 'error').length}</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Component */}
        {userId && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Live AI Chat</CardTitle>
                <p className="text-gray-600">
                  Test the AI chat component in real-time
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                  <AIChatMinimal userId={userId} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

