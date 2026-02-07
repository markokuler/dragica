import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function GET() {
  try {
    const userData = await getUserWithRole()
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: templates, error } = await supabase
      .from('admin_message_templates')
      .select('*')
      .order('trigger_type')
      .order('channel')

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Greška pri učitavanju' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/messaging/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userData = await getUserWithRole()
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, message_body, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (message_body !== undefined) updateData.message_body = message_body
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: template, error } = await supabase
      .from('admin_message_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: 'Greška pri ažuriranju' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error in PUT /api/admin/messaging/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
