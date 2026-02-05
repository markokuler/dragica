import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

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

    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.payment_date !== undefined) updateData.payment_date = body.payment_date
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.plan_id !== undefined) updateData.plan_id = body.plan_id

    const { data: payment, error } = await supabase
      .from('subscription_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment:', error)
      return NextResponse.json({ error: 'Greška pri ažuriranju uplate' }, { status: 500 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error in PUT /api/admin/payments/[id]:', error)
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
      .from('subscription_payments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment:', error)
      return NextResponse.json({ error: 'Greška pri brisanju uplate' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/payments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
