import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dragica.app'

  // Remove port if present for comparison
  const cleanHostname = hostname.split(':')[0]
  const cleanBaseDomain = baseDomain.split(':')[0]

  // Skip subdomain logic for:
  // - Main domain (dragica.app)
  // - www subdomain
  // - Vercel preview URLs
  // - Localhost
  if (
    cleanHostname === cleanBaseDomain ||
    cleanHostname === `www.${cleanBaseDomain}` ||
    cleanHostname.includes('vercel.app') ||
    cleanHostname === 'localhost'
  ) {
    return NextResponse.next()
  }

  // Check if this is a subdomain request (e.g., milana.dragica.app)
  if (cleanHostname.endsWith(`.${cleanBaseDomain}`)) {
    const subdomain = cleanHostname.replace(`.${cleanBaseDomain}`, '')

    // Rewrite to the tenant booking page
    const url = request.nextUrl.clone()
    url.pathname = `/book/${subdomain}${url.pathname === '/' ? '' : url.pathname}`

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
     * - setup (account setup page)
     * - book (booking pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin|dashboard|login|setup|auth|book).*)',
  ],
}
