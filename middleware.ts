import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'

  // Remove port if present for comparison
  const cleanHostname = hostname.split(':')[0]
  const cleanBaseDomain = baseDomain.split(':')[0]

  // Check if this is a subdomain request
  const isSubdomain = cleanHostname.includes('.') && cleanHostname !== cleanBaseDomain && !cleanHostname.startsWith('www.')

  if (isSubdomain) {
    const subdomain = cleanHostname.split('.')[0]

    // Rewrite to the tenant booking page
    const url = request.nextUrl.clone()
    url.pathname = `/${subdomain}${url.pathname}`

    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin (admin routes)
     * - dashboard (dashboard routes)
     * - login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin|dashboard|login).*)',
  ],
}
