import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is an invite (type=invite or type=recovery), redirect to setup
      if (type === 'invite' || type === 'recovery' || type === 'signup') {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin
        return NextResponse.redirect(`${baseUrl}/setup`)
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // Return to login page if something went wrong
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`)
}
