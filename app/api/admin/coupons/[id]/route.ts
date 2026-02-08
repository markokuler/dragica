import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

// Update coupon
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

    if (body.code !== undefined) updateData.code = body.code.toUpperCase()
    if (body.discount_type !== undefined) updateData.discount_type = body.discount_type
    if (body.discount_value !== undefined) updateData.discount_value = parseFloat(body.discount_value)
    if (body.max_uses !== undefined) updateData.max_uses = body.max_uses ? parseInt(body.max_uses) : null
    if (body.valid_from !== undefined) updateData.valid_from = body.valid_from
    if (body.valid_until !== undefined) updateData.valid_until = body.valid_until || null
    if (body.description !== undefined) updateData.description = body.description
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating coupon:', error)
      return NextResponse.json({ error: 'Greška pri ažuriranju kupona' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'update',
      entityType: 'coupon',
      entityId: id,
      entityName: coupon.code,
      isDemo: user.is_demo,
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error in PUT /api/admin/coupons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete coupon
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
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return NextResponse.json({ error: 'Greška pri brisanju kupona' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'delete',
      entityType: 'coupon',
      entityId: id,
      isDemo: user.is_demo,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/coupons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
