import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: userData, error } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching admin data:', error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    return NextResponse.json({
      email: userData?.email || '',
      name: userData?.full_name || '',
    })
  } catch (error) {
    console.error('Error in GET /api/admin/settings/account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name } = body

    const supabase = createAdminClient()

    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: name,
        email: email,
      })
      .eq('id', user.id)

    if (userError) {
      console.error('Error updating user:', userError)
      return NextResponse.json({ error: 'Greška pri ažuriranju podataka' }, { status: 500 })
    }

    // If email changed, update auth user too
    if (email && email !== user.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
        email: email,
      })

      if (authError) {
        console.error('Error updating auth email:', authError)
        // Don't fail the request, just log
      }
    }

    await logAudit({
      userId: user.id,
      action: 'update',
      entityType: 'settings',
      entityName: 'Ažuriranje naloga',
      details: { email, name },
      isDemo: user.is_demo,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
