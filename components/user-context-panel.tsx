"use client"

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUserContextStore } from '@/stores/user-context-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Save, Brain, User, Building2, Target, Settings } from 'lucide-react'

export function UserContextPanel() {
  const { data: session } = useSession()
  const {
    company,
    professional,
    preferences,
    aiInsights,
    isLoading,
    isUpdating,
    error,
    lastUpdated,
    updates,
    isAnalyzing,
    lastAnalysis,
    updateContext,
    fetchUserContext,
    analyzeUserContext,
    getContextSummary
  } = useUserContextStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)

  if (!session?.user) {
    return null
  }

  const handleUpdateField = async (field: string, value: any) => {
    try {
      await updateContext({ [field]: value })
      setEditingField(null)
    } catch (error) {
      console.error('Failed to update context:', error)
    }
  }

  const handleAnalyze = async () => {
    try {
      await analyzeUserContext()
    } catch (error) {
      console.error('Failed to analyze context:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Context
            </CardTitle>
            <CardDescription>
              AI-powered user profile and preferences
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUserContext()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <Brain className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Context Summary</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getContextSummary() || 'No context available'}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Company Information */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4" />
            Company Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              {editingField === 'company.name' ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    id="company-name"
                    value={company.name || ''}
                    onChange={(e) => company.name = e.target.value}
                    placeholder="Enter company name"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdateField('company', company)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setEditingField('company.name')}
                >
                  {company.name || 'Click to set'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              {editingField === 'company.industry' ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    id="industry"
                    value={company.industry || ''}
                    onChange={(e) => company.industry = e.target.value}
                    placeholder="Enter industry"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdateField('company', company)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setEditingField('company.industry')}
                >
                  {company.industry || 'Click to set'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              {editingField === 'company.role' ? (
                <div className="flex gap-2 mt-1">
                  <Input
                    id="role"
                    value={company.role || ''}
                    onChange={(e) => company.role = e.target.value}
                    placeholder="Enter role"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdateField('company', company)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setEditingField('company.role')}
                >
                  {company.role || 'Click to set'}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="company-size">Company Size</Label>
              {editingField === 'company.size' ? (
                <div className="flex gap-2 mt-1">
                  <Select
                    value={company.size || ''}
                    onValueChange={(value) => company.size = value as any}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="small">Small (1-50)</SelectItem>
                      <SelectItem value="medium">Medium (51-200)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateField('company', company)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setEditingField('company.size')}
                >
                  {company.size || 'Click to set'}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Professional Context */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Target className="h-4 w-4" />
            Professional Context
          </h4>
          <div className="space-y-4">
            <div>
              <Label>Experience Level</Label>
              <Select
                value={professional.experience || ''}
                onValueChange={(value) => handleUpdateField('professional', { ...professional, experience: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Primary Goals</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {professional.primaryGoals?.map((goal, index) => (
                  <Badge key={index} variant="secondary">
                    {goal}
                  </Badge>
                ))}
                {(!professional.primaryGoals || professional.primaryGoals.length === 0) && (
                  <span className="text-sm text-gray-500">No goals set</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* AI Insights */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4" />
            AI Insights
          </h4>
          <div className="space-y-4">
            {aiInsights.learningStyle && (
              <div>
                <Label>Learning Style</Label>
                <Badge variant="outline" className="mt-1">
                  {aiInsights.learningStyle}
                </Badge>
              </div>
            )}

            {Object.keys(aiInsights.expertiseLevel || {}).length > 0 && (
              <div>
                <Label>Expertise Areas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(aiInsights.expertiseLevel || {}).map(([topic, level]) => (
                    <Badge key={topic} variant="outline">
                      {topic}: {Math.round((level as number) * 100)}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {aiInsights.personalityTraits && aiInsights.personalityTraits.length > 0 && (
              <div>
                <Label>Personality Traits</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {aiInsights.personalityTraits.map((trait, index) => (
                    <Badge key={index} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {lastAnalysis && (
              <p className="text-xs text-gray-500">
                Last analyzed: {new Date(lastAnalysis).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Recent Updates */}
        {isExpanded && updates.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Recent Updates</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {updates.slice(-10).reverse().map((update, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{update.type}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {update.field && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {update.field}: {JSON.stringify(update.newValue)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      </CardContent>
    </Card>
  )
}

