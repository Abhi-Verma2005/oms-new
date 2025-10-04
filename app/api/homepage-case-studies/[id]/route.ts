import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, subtitle, imageSrc, category, stats, link, displayOrder, isActive } = body

    const caseStudy = await prisma.homepageCaseStudy.update({
      where: { id: params.id },
      data: {
        title,
        subtitle,
        imageSrc,
        category,
        stats,
        link,
        displayOrder,
        isActive
      }
    })

    return NextResponse.json(caseStudy)
  } catch (error) {
    console.error('Error updating homepage case study:', error)
    return NextResponse.json({ error: 'Failed to update case study' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.homepageCaseStudy.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting homepage case study:', error)
    return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 })
  }
}
