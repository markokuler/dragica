import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

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

    const supabase = createAdminClient()

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('duration_days, name')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan nije pronađen' }, { status: 400 })
    }

    // Get current tenant subscription
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('subscription_expires_at')
      .eq('id', id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 400 })
    }

    // Calculate new expiration date
    const now = new Date()
    const currentExpiry = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : now
    const baseDate = currentExpiry > now ? currentExpiry : new Date(payment_date)
    const newExpiry = new Date(baseDate)
    newExpiry.setDate(newExpiry.getDate() + plan.duration_days)

    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: id,
        plan_id,
        amount: parseFloat(amount),
        payment_date,
        notes: notes || null,
        recorded_by: userData.id,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      return NextResponse.json({ error: 'Greška pri evidentiranju uplate' }, { status: 500 })
    }

    // Update or create tenant subscription
    await supabase
      .from('tenant_subscriptions')
      .upsert({
        tenant_id: id,
        plan_id,
        started_at: payment_date,
        expires_at: newExpiry.toISOString(),
        status: 'active',
      }, {
        onConflict: 'tenant_id',
      })

    // Update tenant subscription status and expiry
    await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        subscription_expires_at: newExpiry.toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      payment,
      new_expiry: newExpiry.toISOString(),
      message: `Pretplata produžena do ${newExpiry.toLocaleDateString('sr-RS')}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons/[id]/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
