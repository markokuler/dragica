import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ role: null }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: userData, error } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ role: null }, { status: 500 })
  }

  return NextResponse.json({ role: userData.role })
}
