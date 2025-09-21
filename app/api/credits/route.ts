import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

function shouldReset(lastReset?: Date | null): boolean {
  if (!lastReset) return true
  const now = new Date()
  return now.toDateString() !== new Date(lastReset).toDateString()
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, dailyCredits: true, lastCreditReset: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (shouldReset(user.lastCreditReset)) {
    const updated = await prisma.user.update({ where: { id: user.id }, data: { dailyCredits: 50, lastCreditReset: new Date() }, select: { dailyCredits: true, lastCreditReset: true } })
    return NextResponse.json({ credits: updated.dailyCredits, lastReset: updated.lastCreditReset })
  }
  return NextResponse.json({ credits: user.dailyCredits, lastReset: user.lastCreditReset })
}

export async function POST() {
  // Spend 1 credit by default
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, dailyCredits: true, lastCreditReset: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const needsReset = shouldReset(user.lastCreditReset)
  const currentCredits = needsReset ? 50 : user.dailyCredits
  if (currentCredits <= 0) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      dailyCredits: currentCredits - 1,
      lastCreditReset: needsReset ? new Date() : user.lastCreditReset,
    },
    select: { dailyCredits: true, lastCreditReset: true },
  })

  return NextResponse.json({ credits: updated.dailyCredits, lastReset: updated.lastCreditReset })
}


