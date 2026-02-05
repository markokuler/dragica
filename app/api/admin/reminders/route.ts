import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Get all reminders
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showCompleted = searchParams.get('showCompleted') === 'true'
    const tenantId = searchParams.get('tenantId')

    const supabase = createAdminClient()

    let query = supabase
      .from('admin_reminders')
      .select(`
        *,
        tenants (
          id,
          name
        )
      `)
      .order('reminder_date', { ascending: true })

    if (!showCompleted) {
      query = query.eq('is_completed', false)
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data: reminders, error } = await query

    if (error) {
      console.error('Error fetching reminders:', error)
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }

    const formattedReminders = (reminders || []).map(r => {
      const tenant = r.tenants as unknown as { id: string; name: string } | null
      return {
        ...r,
        salon_name: tenant?.name || null,
        tenants: undefined,
      }
    })

    return NextResponse.json({ reminders: formattedReminders })
  } catch (error) {
    console.error('Error in GET /api/admin/reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create reminder
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenant_id, title, description, reminder_date } = body

    if (!title || !reminder_date) {
      return NextResponse.json({ error: 'Naslov i datum su obavezni' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: reminder, error } = await supabase
      .from('admin_reminders')
      .insert({
        tenant_id: tenant_id || null,
        title,
        description: description || null,
        reminder_date,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      return NextResponse.json({ error: 'Greška pri kreiranju podsećanja' }, { status: 500 })
    }

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
