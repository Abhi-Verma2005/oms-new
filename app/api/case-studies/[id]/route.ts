import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
      include: {
        monthlyData: {
          orderBy: { month: 'asc' }
        },
        keywordData: true,
        serpFeaturesList: true
      }
    })

    if (!caseStudy) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 })
    }

    return NextResponse.json(caseStudy)
  } catch (error) {
    console.error('Error fetching case study:', error)
    return NextResponse.json({ error: 'Failed to fetch case study' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const caseStudy = await prisma.caseStudy.update({
      where: { id },
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
        aiOverview: data.aiOverview
      }
    })

    return NextResponse.json(caseStudy)
  } catch (error) {
    console.error('Error updating case study:', error)
    return NextResponse.json({ error: 'Failed to update case study' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.caseStudy.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting case study:', error)
    return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 })
  }
}