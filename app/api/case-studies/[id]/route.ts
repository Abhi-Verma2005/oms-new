import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/case-studies/[id] - Get single case study
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: params.id },
      include: {
        monthlyData: true,
        keywordData: true,
        serpFeaturesList: true,
      }
    })

    if (!caseStudy) {
      return NextResponse.json(
        { error: 'Case study not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(caseStudy)
  } catch (error) {
    console.error('Error fetching case study:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case study' },
      { status: 500 }
    )
  }
}

// PUT /api/case-studies/[id] - Update case study
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const caseStudy = await prisma.caseStudy.update({
      where: { id: params.id },
      data: {
        clientName: body.clientName,
        industry: body.industry,
        campaignDuration: body.campaignDuration,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        isActive: body.isActive,
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
        serpFeatures: body.serpFeatures,
        aiOverview: body.aiOverview,
      },
      include: {
        monthlyData: true,
        keywordData: true,
        serpFeaturesList: true,
      }
    })

    return NextResponse.json(caseStudy)
  } catch (error) {
    console.error('Error updating case study:', error)
    return NextResponse.json(
      { error: 'Failed to update case study' },
      { status: 500 }
    )
  }
}

// DELETE /api/case-studies/[id] - Delete case study
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.caseStudy.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Case study deleted successfully' })
  } catch (error) {
    console.error('Error deleting case study:', error)
    return NextResponse.json(
      { error: 'Failed to delete case study' },
      { status: 500 }
    )
  }
}
