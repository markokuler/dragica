import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dragica.app'
  return NextResponse.redirect(`${baseUrl}/login`, { status: 303 })
}
