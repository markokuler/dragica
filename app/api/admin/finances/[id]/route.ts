import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount)
    if (body.description !== undefined) updateData.description = body.description
    if (body.entry_date !== undefined) updateData.entry_date = body.entry_date

    const { data: entry, error } = await supabase
      .from('admin_financial_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin finance entry:', error)
      return NextResponse.json({ error: 'Greška pri ažuriranju unosa' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'update',
      entityType: 'finance',
      entityId: id,
      entityName: entry.description || `${entry.type} — ${entry.category}`,
      isDemo: user.is_demo,
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error in PUT /api/admin/finances/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      .from('admin_financial_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting admin finance entry:', error)
      return NextResponse.json({ error: 'Greška pri brisanju unosa' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'delete',
      entityType: 'finance',
      entityId: id,
      isDemo: user.is_demo,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/finances/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
