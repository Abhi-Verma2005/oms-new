import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/case-studies - Get all case studies
export async function GET() {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      include: {
        monthlyData: true,
        keywordData: true,
        serpFeaturesList: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(caseStudies)
  } catch (error) {
    console.error('Error fetching case studies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case studies' },
      { status: 500 }
    )
  }
}

// POST /api/case-studies - Create new case study
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const caseStudy = await prisma.caseStudy.create({
      data: {
        clientName: body.clientName,
        industry: body.industry,
        campaignDuration: body.campaignDuration,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        isActive: body.isActive ?? true,
        trafficGrowth: parseFloat(body.trafficGrowth),
        initialTraffic: parseFloat(body.initialTraffic),
        finalTraffic: parseFloat(body.finalTraffic),
        keywordsRanked: parseInt(body.keywordsRanked),
        backlinksPerMonth: parseInt(body.backlinksPerMonth),
        domainRatingStart: body.domainRatingStart ? parseInt(body.domainRatingStart) : null,
        domainRatingEnd: body.domainRatingEnd ? parseInt(body.domainRatingEnd) : null,
        objective: body.objective,
        challenge: body.challenge,
        solution: body.solution,
        finalOutcomes: body.finalOutcomes,
        serpFeatures: body.serpFeatures ?? false,
        aiOverview: body.aiOverview ?? false,
        createdBy: body.createdBy,
      },
      include: {
        monthlyData: true,
        keywordData: true,
        serpFeaturesList: true,
      }
    })

    return NextResponse.json(caseStudy, { status: 201 })
  } catch (error) {
    console.error('Error creating case study:', error)
    return NextResponse.json(
      { error: 'Failed to create case study' },
      { status: 500 }
    )
  }
}
