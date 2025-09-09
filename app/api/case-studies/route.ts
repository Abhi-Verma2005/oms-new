import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      include: {
        monthlyData: {
          orderBy: { month: 'asc' }
        },
        keywordData: true,
        serpFeaturesList: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(caseStudies)
  } catch (error) {
    console.error('Error fetching case studies:', error)
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const caseStudy = await prisma.caseStudy.create({
      data: {
        clientName: data.clientName,
        industry: data.industry,
        campaignDuration: data.campaignDuration,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
        trafficGrowth: parseFloat(data.trafficGrowth),
        initialTraffic: parseFloat(data.initialTraffic),
        finalTraffic: parseFloat(data.finalTraffic),
        keywordsRanked: parseInt(data.keywordsRanked),
        backlinksPerMonth: parseInt(data.backlinksPerMonth),
        domainRatingStart: data.domainRatingStart ? parseInt(data.domainRatingStart) : null,
        domainRatingEnd: data.domainRatingEnd ? parseInt(data.domainRatingEnd) : null,
        objective: data.objective,
        challenge: data.challenge,
        solution: data.solution,
        finalOutcomes: data.finalOutcomes,
        serpFeatures: data.serpFeatures,
        aiOverview: data.aiOverview,
        createdBy: data.createdBy
      }
    })

    return NextResponse.json(caseStudy)
  } catch (error) {
    console.error('Error creating case study:', error)
    return NextResponse.json({ error: 'Failed to create case study' }, { status: 500 })
  }
}