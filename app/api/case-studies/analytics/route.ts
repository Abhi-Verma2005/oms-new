import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get all case studies with their data
    const caseStudies = await prisma.caseStudy.findMany({
      include: {
        monthlyData: {
          orderBy: { month: 'asc' }
        },
        keywordData: true,
        serpFeaturesList: true
      }
    })

    // Calculate analytics
    const totalTrafficGrowth = caseStudies.reduce((sum, study) => sum + study.trafficGrowth, 0)
    const totalKeywords = caseStudies.reduce((sum, study) => sum + study.keywordsRanked, 0)
    const totalBacklinks = caseStudies.reduce((sum, study) => sum + study.backlinksPerMonth, 0)
    const activeCampaigns = caseStudies.filter(study => study.isActive).length

    // Industry breakdown
    const industryStats = caseStudies.reduce((acc, study) => {
      if (!acc[study.industry]) {
        acc[study.industry] = {
          count: 0,
          totalGrowth: 0,
          totalKeywords: 0
        }
      }
      acc[study.industry].count++
      acc[study.industry].totalGrowth += study.trafficGrowth
      acc[study.industry].totalKeywords += study.keywordsRanked
      return acc
    }, {} as Record<string, { count: number; totalGrowth: number; totalKeywords: number }>)

    // SERP Features breakdown
    const serpFeaturesStats = caseStudies.reduce((acc, study) => {
      if (study.serpFeatures) {
        acc.featuredSnippets = (acc.featuredSnippets || 0) + 1
      }
      if (study.aiOverview) {
        acc.aiOverview = (acc.aiOverview || 0) + 1
      }
      acc.regularRankings = (acc.regularRankings || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Monthly traffic data for all case studies
    const monthlyTrafficData = caseStudies.map(study => ({
      client: study.clientName,
      data: study.monthlyData.map(month => ({
        month: month.month,
        traffic: month.traffic
      }))
    }))

    // Keyword ranking data
    const keywordRankingData = caseStudies.map(study => ({
      client: study.clientName,
      keywords: study.keywordData.map(keyword => ({
        keyword: keyword.keyword,
        ranks: {
          jan2025: keyword.jan2025,
          feb2025: keyword.feb2025,
          mar2025: keyword.mar2025,
          apr2025: keyword.apr2025,
          may2025: keyword.may2025,
          jun2025: keyword.jun2025,
          jul2025: keyword.jul2025
        }
      }))
    }))

    return NextResponse.json({
      summary: {
        totalCaseStudies: caseStudies.length,
        activeCampaigns,
        totalTrafficGrowth,
        totalKeywords,
        totalBacklinks,
        averageGrowth: totalTrafficGrowth / caseStudies.length
      },
      industryStats,
      serpFeaturesStats,
      monthlyTrafficData,
      keywordRankingData,
      caseStudies: caseStudies.map(study => ({
        id: study.id,
        clientName: study.clientName,
        industry: study.industry,
        trafficGrowth: study.trafficGrowth,
        keywordsRanked: study.keywordsRanked,
        backlinksPerMonth: study.backlinksPerMonth,
        isActive: study.isActive
      }))
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
