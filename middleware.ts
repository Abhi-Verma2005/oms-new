import { NextRequest, NextResponse } from "next/server"
export const config = {
  matcher: [
    '/((?!api/auth|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request
  const token = request.cookies.get("authjs.session-token") || 
                request.cookies.get("__Secure-authjs.session-token")

  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') || 
                          nextUrl.pathname.startsWith('/admin') ||
                          nextUrl.pathname.startsWith('/profile') ||
                          nextUrl.pathname.startsWith('/data')

  const isAdminRoute = nextUrl.pathname.startsWith('/admin')

  const isUserOnlyRoute = nextUrl.pathname.startsWith('/cart') ||
                         nextUrl.pathname.startsWith('/checkout') ||
                         nextUrl.pathname.startsWith('/orders') ||
                         nextUrl.pathname.startsWith('/data')

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  return NextResponse.next()
}




