import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Update reminder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.reminder_date !== undefined) updateData.reminder_date = body.reminder_date
    if (body.is_completed !== undefined) {
      updateData.is_completed = body.is_completed
      if (body.is_completed) {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }
    }

    const { data: reminder, error } = await supabase
      .from('admin_reminders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reminder:', error)
      return NextResponse.json({ error: 'Greška pri ažuriranju' }, { status: 500 })
    }

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('Error in PUT /api/admin/reminders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('admin_reminders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting reminder:', error)
      return NextResponse.json({ error: 'Greška pri brisanju' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/reminders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
