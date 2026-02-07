import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'
import { recordPayment, PaymentError } from '@/lib/payments'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get all payments for this tenant
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_date,
        notes,
        created_at,
        subscription_plans (
          id,
          name,
          duration_days
        )
      `)
      .eq('tenant_id', id)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Greška pri učitavanju uplata' }, { status: 500 })
    }

    // Calculate total paid
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)

    // Format payments
    const formattedPayments = (payments || []).map((payment) => {
      const plan = payment.subscription_plans as unknown as { id: string; name: string; duration_days: number } | null
      return {
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        notes: payment.notes,
        created_at: payment.created_at,
        plan_name: plan?.name || 'Nepoznat plan',
        plan_id: plan?.id || null,
        duration_days: plan?.duration_days || 0,
      }
    })

    return NextResponse.json({
      payments: formattedPayments,
      total_paid: totalPaid,
      payment_count: formattedPayments.length,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan_id, amount, payment_date, notes } = body

    if (!plan_id || !amount || !payment_date) {
      return NextResponse.json({ error: 'Sva obavezna polja moraju biti popunjena' }, { status: 400 })
    }

    const result = await recordPayment({
      tenantId: id,
      planId: plan_id,
      amount,
      paymentDate: payment_date,
      notes,
      recordedBy: userData.id,
      isDemo: userData.is_demo || false,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error in POST /api/admin/salons/[id]/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
