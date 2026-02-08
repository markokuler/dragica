import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Sva polja su obavezna' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Lozinka mora imati najmanje 8 karaktera' }, { status: 400 })
    }

    // Verify current password by attempting sign in
    const serverClient = await createClient()
    const { error: signInError } = await serverClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: 'Trenutna lozinka nije ispravna' }, { status: 400 })
    }

    // Update password using admin client
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Greška pri promeni lozinke' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'update',
      entityType: 'settings',
      entityName: 'Promena lozinke',
      isDemo: user.is_demo,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
