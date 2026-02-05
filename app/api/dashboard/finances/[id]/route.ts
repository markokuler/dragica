import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, getEffectiveTenantId } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    const body = await request.json()
    const { type, category, amount, description, entry_date } = body

    // Verify ownership
    const { data: existing } = await supabase
      .from('financial_entries')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Unos nije pronađen' }, { status: 404 })
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (type !== undefined) updates.type = type
    if (category !== undefined) updates.category = category
    if (amount !== undefined) updates.amount = amount
    if (description !== undefined) updates.description = description || null
    if (entry_date !== undefined) updates.entry_date = entry_date

    const { data: entry, error } = await supabase
      .from('financial_entries')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating financial entry:', error)
      return NextResponse.json({ error: 'Greška pri ažuriranju unosa' }, { status: 500 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error in PUT /api/dashboard/finances/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    // Verify ownership before deleting
    const { data: existing } = await supabase
      .from('financial_entries')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Unos nije pronađen' }, { status: 404 })
    }

    const { error } = await supabase
      .from('financial_entries')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting financial entry:', error)
      return NextResponse.json({ error: 'Greška pri brisanju unosa' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/dashboard/finances/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
