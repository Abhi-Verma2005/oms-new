import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client not available in reset password API')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    try {
      // Verify the reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
        userId: string
        email: string
      }

      // Find the user
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
      if (!user) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 10)

      // Update the user's password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash }
      })

      return NextResponse.json({ 
        message: 'Password has been reset successfully. You can now log in with your new password.' 
      })
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
