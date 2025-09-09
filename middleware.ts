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
    secret: process.env.NEXTAUTH_SECRET 
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

  // If it's a protected route and no valid token, redirect to signin
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/signin', nextUrl))
  }

  // If it's an admin route, check if user has admin role
  if (isAdminRoute && token && !token.isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
}




