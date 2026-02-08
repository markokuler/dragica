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

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.duration_days !== undefined) updateData.duration_days = parseInt(body.duration_days)
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.is_trial !== undefined) updateData.is_trial = body.is_trial
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating plan:', error)
      return NextResponse.json({ error: 'Greška pri ažuriranju plana' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'update',
      entityType: 'plan',
      entityId: id,
      entityName: plan.name,
      isDemo: user.is_demo,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error in PUT /api/admin/plans/[id]:', error)
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

    // Check if plan is in use
    const { count } = await supabase
      .from('tenant_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Plan je u upotrebi i ne može se obrisati' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting plan:', error)
      return NextResponse.json({ error: 'Greška pri brisanju plana' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'delete',
      entityType: 'plan',
      entityId: id,
      isDemo: user.is_demo,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/plans/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
