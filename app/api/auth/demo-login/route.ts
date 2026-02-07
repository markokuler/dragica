import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (type !== 'admin' && type !== 'owner') {
      return NextResponse.json({ error: 'Invalid demo type' }, { status: 400 })
    }

    const email = type === 'admin'
      ? process.env.DEMO_ADMIN_EMAIL
      : process.env.DEMO_OWNER_EMAIL
    const password = type === 'admin'
      ? process.env.DEMO_ADMIN_PASSWORD
      : process.env.DEMO_OWNER_PASSWORD

    if (!email || !password) {
      return NextResponse.json({
        error: 'Demo nalog nije konfigurisan',
        debug: {
          hasEmail: !!email,
          hasPassword: !!password,
          type,
          envKeys: Object.keys(process.env).filter(k => k.includes('DEMO')),
        }
      }, { status: 500 })
    }

    // Verify user is actually a demo user before signing in
    const adminClient = createAdminClient()
    const { data: userData } = await adminClient
      .from('users')
      .select('is_demo')
      .eq('email', email)
      .single()

    if (!userData?.is_demo) {
      return NextResponse.json({ error: 'Demo nalog nije pronađen' }, { status: 500 })
    }

    // Create supabase client that can write cookies to the response
    const response = NextResponse.json({ redirect: type === 'admin' ? '/admin' : '/dashboard' })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: 'Greška pri prijavi demo naloga' }, { status: 500 })
    }

    return response
  } catch (error) {
    console.error('Error in demo login:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
