import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client not available in forgot password API')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        message: 'If an account with that email exists, we sent you a password reset link.' 
      })
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' } // Token expires in 1 hour
    )

    // Create reset link
    const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

    // Send password reset email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>You requested to reset your password. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p style="color: #999; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </p>
          </div>
        `,
        text: `
          Password Reset Request
          
          Hello ${user.name || 'User'},
          
          You requested to reset your password. Click the link below to reset your password:
          
          ${resetLink}
          
          This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
        `
      })

      return NextResponse.json({ 
        message: 'If an account with that email exists, we sent you a password reset link.' 
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
