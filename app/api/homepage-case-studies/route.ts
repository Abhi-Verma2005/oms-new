import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const caseStudies = await prisma.homepageCaseStudy.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    })

    // Ensure we always return an array
    return NextResponse.json(Array.isArray(caseStudies) ? caseStudies : [])
  } catch (error) {
    console.error('Error fetching homepage case studies:', error)
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, subtitle, imageSrc, category, stats, link, displayOrder } = body

    const caseStudy = await prisma.homepageCaseStudy.create({
      data: {
        title,
        subtitle,
        imageSrc,
        category,
        stats,
        link,
        displayOrder: displayOrder || 0,
        isActive: true
      }
    })

    return NextResponse.json(caseStudy)
  } catch (error) {
    console.error('Error creating homepage case study:', error)
    return NextResponse.json({ error: 'Failed to create case study' }, { status: 500 })
  }
}
