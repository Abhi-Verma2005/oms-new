"use client"

import React from 'react'
import { UserContextPanel } from '@/components/user-context-panel'
import { useUserContextStore } from '@/stores/user-context-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, User, Activity } from 'lucide-react'

export default function TestUserContextPage() {
  const {
    company,
    professional,
    preferences,
    aiInsights,
    updates,
    getContextSummary,
    hasRecentUpdates,
    needsUpdate
  } = useUserContextStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Context System Test
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test and demonstrate the AI-powered user context management system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Context Panel */}
          <div>
            <UserContextPanel />
          </div>

          {/* System Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current state of the user context system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Context Loaded</span>
                  <Badge variant={company.name ? "default" : "secondary"}>
                    {company.name ? "Yes" : "No"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Needs Update</span>
                  <Badge variant={needsUpdate() ? "destructive" : "default"}>
                    {needsUpdate() ? "Yes" : "No"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Recent Updates</span>
                  <Badge variant={hasRecentUpdates() ? "default" : "secondary"}>
                    {hasRecentUpdates() ? "Yes" : "No"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Total Updates</span>
                  <Badge variant="outline">
                    {updates.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Context Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Context Summary
                </CardTitle>
                <CardDescription>
                  Current user context information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getContextSummary() || 'No context available'}
                </p>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  AI-generated insights about the user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights.learningStyle && (
                  <div>
                    <span className="text-sm font-medium">Learning Style: </span>
                    <Badge variant="outline">{aiInsights.learningStyle}</Badge>
                  </div>
                )}

                {Object.keys(aiInsights.expertiseLevel || {}).length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Expertise Areas:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(aiInsights.expertiseLevel || {}).map(([topic, level]) => (
                        <Badge key={topic} variant="secondary">
                          {topic}: {Math.round((level as number) * 100)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {aiInsights.personalityTraits && aiInsights.personalityTraits.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Personality Traits:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {aiInsights.personalityTraits.map((trait, index) => (
                        <Badge key={index} variant="outline">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(aiInsights.expertiseLevel || {}).length === 0 && 
                 (!aiInsights.personalityTraits || aiInsights.personalityTraits.length === 0) && (
                  <p className="text-sm text-gray-500">
                    No AI insights available yet. Interact with the AI chatbot to generate insights.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Test Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Test Actions</CardTitle>
                <CardDescription>
                  Test the user context system functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Simulate logging an interaction
                    fetch('/api/user-context/interactions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        interactionType: 'OTHER',
                        content: 'Test interaction from context panel',
                        context: { source: 'test_page' }
                      })
                    }).catch(console.error)
                  }}
                >
                  Log Test Interaction
                </Button>

                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Trigger AI analysis
                    fetch('/api/user-context/analyze', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        interactions: [{
                          type: 'TEST',
                          content: 'Test analysis trigger',
                          timestamp: new Date().toISOString()
                        }]
                      })
                    }).catch(console.error)
                  }}
                >
                  Trigger AI Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

