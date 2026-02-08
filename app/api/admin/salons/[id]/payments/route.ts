import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'
import { recordPayment, PaymentError } from '@/lib/payments'

export async function PUT(
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
    const { payment_id, plan_id, amount, payment_date, notes } = body

    if (!payment_id || !plan_id || !amount || !payment_date) {
      return NextResponse.json({ error: 'Sva obavezna polja moraju biti popunjena' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify payment belongs to this tenant
    const { data: existing } = await supabase
      .from('payments')
      .select('id, amount, payment_date')
      .eq('id', payment_id)
      .eq('tenant_id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Uplata nije pronađena' }, { status: 404 })
    }

    const parsedAmount = parseFloat(String(amount))

    // Update the payment
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        plan_id,
        amount: parsedAmount,
        payment_date,
        notes: notes || null,
      })
      .eq('id', payment_id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return NextResponse.json({ error: 'Greška pri ažuriranju uplate' }, { status: 500 })
    }

    // Update linked admin_financial_entries
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', plan_id)
      .single()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', id)
      .single()

    await supabase
      .from('admin_financial_entries')
      .update({
        amount: parsedAmount,
        entry_date: payment_date,
        description: `${tenant?.name || 'Salon'} — ${plan?.name || 'Plan'}`,
      })
      .eq('payment_id', payment_id)

    // Recalculate subscription expiry from all payments
    await recalculateSubscription(supabase, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/salons/[id]/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
      return NextResponse.json({ error: 'payment_id je obavezan' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify payment belongs to this tenant
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('id', paymentId)
      .eq('tenant_id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Uplata nije pronađena' }, { status: 404 })
    }

    // Delete linked admin_financial_entries first
    await supabase
      .from('admin_financial_entries')
      .delete()
      .eq('payment_id', paymentId)

    // Delete the payment
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (deleteError) {
      console.error('Error deleting payment:', deleteError)
      return NextResponse.json({ error: 'Greška pri brisanju uplate' }, { status: 500 })
    }

    // Recalculate subscription expiry
    await recalculateSubscription(supabase, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function recalculateSubscription(supabase: ReturnType<typeof createAdminClient>, tenantId: string) {
  // Get all payments with plan info, ordered by date
  const { data: allPayments } = await supabase
    .from('payments')
    .select('payment_date, subscription_plans(duration_days)')
    .eq('tenant_id', tenantId)
    .order('payment_date', { ascending: true })

  if (!allPayments || allPayments.length === 0) {
    // No payments — set expired
    await supabase.from('tenants').update({
      subscription_status: 'expired',
      subscription_expires_at: null,
    }).eq('id', tenantId)
    await supabase.from('tenant_subscriptions').delete().eq('tenant_id', tenantId)
    return
  }

  // Walk through payments to calculate final expiry
  let expiry: Date | null = null
  for (const p of allPayments) {
    const plan = p.subscription_plans as unknown as { duration_days: number } | null
    if (!plan) continue
    const payDate = new Date(p.payment_date)
    const base: Date = expiry && expiry > payDate ? expiry : payDate
    expiry = new Date(base)
    expiry.setDate(expiry.getDate() + plan.duration_days)
  }

  if (expiry) {
    const status = expiry > new Date() ? 'active' : 'expired'
    await supabase.from('tenants').update({
      subscription_status: status,
      subscription_expires_at: expiry.toISOString(),
    }).eq('id', tenantId)
  }
}

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
