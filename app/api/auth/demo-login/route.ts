import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (type !== 'admin' && type !== 'owner') {
      return NextResponse.json({ error: 'Invalid demo type' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    let email: string
    let password: string

    if (type === 'admin') {
      // Admin demo: single fixed account
      email = process.env.DEMO_ADMIN_EMAIL || ''
      password = process.env.DEMO_ADMIN_PASSWORD || ''

      if (!email || !password) {
        return NextResponse.json({ error: 'Demo nalog nije konfigurisan' }, { status: 500 })
      }
    } else {
      // Owner demo: rotate between available demo owner accounts
      password = process.env.DEMO_OWNER_PASSWORD || ''
      if (!password) {
        return NextResponse.json({ error: 'Demo nalog nije konfigurisan' }, { status: 500 })
      }

      const { data: demoOwners } = await adminClient
        .from('users')
        .select('email')
        .eq('is_demo', true)
        .eq('role', 'client')

      if (!demoOwners || demoOwners.length === 0) {
        return NextResponse.json({ error: 'Demo nalozi nisu pronađeni' }, { status: 500 })
      }

      // Pick a random slot
      const randomIndex = Math.floor(Math.random() * demoOwners.length)
      email = demoOwners[randomIndex].email
    }

    // Verify user is actually a demo user before signing in
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
