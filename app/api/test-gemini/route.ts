import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Gemini API key not configured',
          status: 'missing_key'
        },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent('Hello, this is a test message.')
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working correctly',
      response: text,
      status: 'connected'
    })
  } catch (error) {
    console.error('Gemini API test error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to connect to Gemini API',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'connection_failed'
      },
      { status: 500 }
    )
  }
}

