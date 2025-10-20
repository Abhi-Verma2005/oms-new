import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export const config = {
  matcher: [
    '/((?!api/auth|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request
  
  // Get the JWT token from the request
  const token = await getToken({ 
    req: request, 
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  })

  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') || 
                          nextUrl.pathname.startsWith('/admin') ||
                          nextUrl.pathname.startsWith('/profile') ||
                          nextUrl.pathname.startsWith('/data') ||
                          nextUrl.pathname.startsWith('/notifications') ||
                          nextUrl.pathname.startsWith('/cart') ||
                          nextUrl.pathname.startsWith('/checkout') ||
                          nextUrl.pathname.startsWith('/orders')

  const isAdminRoute = nextUrl.pathname.startsWith('/admin')

  // Pages that should be redirected to /publishers when accessed by authenticated users
  const hiddenPages = ['/about', '/integrations', '/pricing', '/customers', '/changelog', '/case-studies', '/resources', '/contact', '/faq']
  
  // All landing pages that should be inaccessible to normal users
  const landingPages = [
    '/about', '/integrations', '/pricing', '/customers', '/changelog', 
    '/case-studies', '/resources', '/contact', '/faq', '/features',
    '/help', '/docs', '/status', '/privacy', '/terms', '/cookies', '/gdpr'
  ]

  // If it's a protected route and no valid token, redirect to signin
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/signin', nextUrl))
  }

  // If it's an admin route, check if user has admin role
  if (isAdminRoute && token && !token.isAdmin) {
    return NextResponse.redirect(new URL('/publishers', nextUrl))
  }

  // Redirect all landing pages to appropriate destinations
  if (landingPages.includes(nextUrl.pathname)) {
    if (token) {
      // Authenticated users go to publishers
      return NextResponse.redirect(new URL('/publishers', nextUrl))
    } else {
      // Unauthenticated users go to signin
      return NextResponse.redirect(new URL('/signin', nextUrl))
    }
  }

  // Redirect hidden pages to /publishers for authenticated users (legacy logic)
  if (token && hiddenPages.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/publishers', nextUrl))
  }

  return NextResponse.next()
}




