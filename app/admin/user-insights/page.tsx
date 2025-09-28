"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  BarChart3,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface UserInsight {
  id: string
  userId: string
  user: {
    name: string
    email: string
  }
  profile: {
    companyName: string
    industry: string
    role: string
    experience: string
  } | null
  aiInsights: {
    personalityTraits: string[]
    conversationTone: string
    topicInterests: string[]
    painPoints: string[]
    confidenceScore: number
    lastAnalysisAt: string
    aiMetadata: Record<string, any>
  } | null
  recentInteractions: number
  lastInteraction: string
}

export default function UserInsightsPage() {
  const [insights, setInsights] = useState<UserInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [sortBy, setSortBy] = useState('lastInteraction')

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/user-insights')
      const data = await response.json()
      setInsights(data.insights || [])
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = 
      insight.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.profile?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.profile?.industry?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = 
      filterBy === 'all' ||
      (filterBy === 'hasProfile' && insight.profile) ||
      (filterBy === 'hasAIInsights' && insight.aiInsights) ||
      (filterBy === 'highConfidence' && insight.aiInsights?.confidenceScore && insight.aiInsights.confidenceScore > 0.7) ||
      (filterBy === 'recentActivity' && insight.recentInteractions > 5)

    return matchesSearch && matchesFilter
  })

  const sortedInsights = filteredInsights.sort((a, b) => {
    switch (sortBy) {
      case 'lastInteraction':
        return new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
      case 'confidence':
        return (b.aiInsights?.confidenceScore || 0) - (a.aiInsights?.confidenceScore || 0)
      case 'interactions':
        return b.recentInteractions - a.recentInteractions
      case 'name':
        return a.user.name.localeCompare(b.user.name)
      default:
        return 0
    }
  })

  const exportInsights = () => {
    const csvData = sortedInsights.map(insight => ({
      name: insight.user.name,
      email: insight.user.email,
      company: insight.profile?.companyName || '',
      industry: insight.profile?.industry || '',
      role: insight.profile?.role || '',
      experience: insight.profile?.experience || '',
      personalityTraits: insight.aiInsights?.personalityTraits?.join(', ') || '',
      conversationTone: insight.aiInsights?.conversationTone || '',
      topicInterests: insight.aiInsights?.topicInterests?.join(', ') || '',
      painPoints: insight.aiInsights?.painPoints?.join(', ') || '',
      confidenceScore: insight.aiInsights?.confidenceScore || '',
      lastAnalysis: insight.aiInsights?.lastAnalysisAt || '',
      recentInteractions: insight.recentInteractions,
      lastInteraction: insight.lastInteraction
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user-insights.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Insights Dashboard</h1>
          <p className="text-muted-foreground">
            AI-generated insights and user behavior analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInsights} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportInsights}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, companies, industries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="hasProfile">Has Profile</SelectItem>
            <SelectItem value="hasAIInsights">Has AI Insights</SelectItem>
            <SelectItem value="highConfidence">High Confidence</SelectItem>
            <SelectItem value="recentActivity">Recent Activity</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastInteraction">Last Interaction</SelectItem>
            <SelectItem value="confidence">Confidence Score</SelectItem>
            <SelectItem value="interactions">Interaction Count</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">With AI Insights</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.aiInsights).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Interactions</p>
                <p className="text-2xl font-bold">
                  {Math.round(insights.reduce((acc, i) => acc + i.recentInteractions, 0) / insights.length) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    (insights
                      .filter(i => i.aiInsights?.confidenceScore)
                      .reduce((acc, i) => acc + (i.aiInsights?.confidenceScore || 0), 0) /
                    insights.filter(i => i.aiInsights?.confidenceScore).length) * 100
                  ) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Insights List */}
      <div className="grid gap-4">
        {sortedInsights.map((insight) => (
          <Card key={insight.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{insight.user.name}</h3>
                    <Badge variant="outline">{insight.user.email}</Badge>
                    {insight.aiInsights?.confidenceScore && (
                      <Badge 
                        variant={insight.aiInsights.confidenceScore > 0.7 ? "default" : "secondary"}
                      >
                        {Math.round(insight.aiInsights.confidenceScore * 100)}% confidence
                      </Badge>
                    )}
                  </div>

                  {insight.profile && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground">
                        {insight.profile.companyName} • {insight.profile.industry} • {insight.profile.role}
                      </p>
                    </div>
                  )}

                  <Tabs defaultValue="insights" className="w-full">
                    <TabsList>
                      <TabsTrigger value="insights">AI Insights</TabsTrigger>
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="insights" className="mt-4">
                      {insight.aiInsights ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Personality Traits</h4>
                            <div className="flex flex-wrap gap-1">
                              {insight.aiInsights.personalityTraits?.map((trait, i) => (
                                <Badge key={i} variant="secondary">{trait}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Topic Interests</h4>
                            <div className="flex flex-wrap gap-1">
                              {insight.aiInsights.topicInterests?.map((interest, i) => (
                                <Badge key={i} variant="outline">{interest}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Pain Points</h4>
                            <div className="flex flex-wrap gap-1">
                              {insight.aiInsights.painPoints?.map((pain, i) => (
                                <Badge key={i} variant="destructive">{pain}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Communication</h4>
                            <p className="text-sm text-muted-foreground">
                              Tone: {insight.aiInsights.conversationTone}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No AI insights available</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="metadata" className="mt-4">
                      {insight.aiInsights?.aiMetadata && Object.keys(insight.aiInsights.aiMetadata).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(insight.aiInsights.aiMetadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key}:</span>
                              <span className="text-muted-foreground">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No metadata available</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="activity" className="mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Recent Interactions:</span>
                          <span>{insight.recentInteractions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Last Interaction:</span>
                          <span>{new Date(insight.lastInteraction).toLocaleDateString()}</span>
                        </div>
                        {insight.aiInsights?.lastAnalysisAt && (
                          <div className="flex justify-between">
                            <span className="font-medium">Last AI Analysis:</span>
                            <span>{new Date(insight.aiInsights.lastAnalysisAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedInsights.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No insights found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
}

