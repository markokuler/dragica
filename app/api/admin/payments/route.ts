import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        tenant_id,
        amount,
        payment_date,
        notes,
        created_at,
        tenants (
          name
        ),
        subscription_plans (
          name
        )
      `)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    const result = (payments || []).map(payment => {
      const tenant = payment.tenants as unknown as { name: string } | null
      const plan = payment.subscription_plans as unknown as { name: string } | null
      return {
        id: payment.id,
        tenant_id: payment.tenant_id,
        salon_name: tenant?.name || 'Nepoznat salon',
        amount: payment.amount,
        payment_date: payment.payment_date,
        plan_name: plan?.name || 'Nepoznat plan',
        notes: payment.notes,
        created_at: payment.created_at,
      }
    })

    return NextResponse.json({ payments: result })
  } catch (error) {
    console.error('Error in GET /api/admin/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenant_id, plan_id, amount, payment_date, notes } = body

    if (!tenant_id || !plan_id || !amount || !payment_date) {
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
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 400 })
    }

    // Calculate new expiration date
    // If subscription is still valid, extend from expiration date
    // If expired, start from payment date
    const now = new Date()
    const currentExpiry = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : now
    const baseDate = currentExpiry > now ? currentExpiry : new Date(payment_date)
    const newExpiry = new Date(baseDate)
    newExpiry.setDate(newExpiry.getDate() + plan.duration_days)

    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id,
        plan_id,
        amount: parseFloat(amount),
        payment_date,
        notes: notes || null,
        recorded_by: user.id,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      return NextResponse.json({ error: 'Greška pri evidentiranju uplate' }, { status: 500 })
    }

    // Update or create tenant subscription
    const { error: subError } = await supabase
      .from('tenant_subscriptions')
      .upsert({
        tenant_id,
        plan_id,
        started_at: payment_date,
        expires_at: newExpiry.toISOString(),
        status: 'active',
      }, {
        onConflict: 'tenant_id',
      })

    if (subError) {
      console.error('Error updating subscription:', subError)
      // Don't fail - payment is recorded
    }

    // Update tenant subscription status and expiry
    const { error: tenantUpdateError } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        subscription_expires_at: newExpiry.toISOString(),
      })
      .eq('id', tenant_id)

    if (tenantUpdateError) {
      console.error('Error updating tenant:', tenantUpdateError)
    }

    return NextResponse.json({
      payment,
      new_expiry: newExpiry.toISOString(),
      message: `Pretplata produžena do ${newExpiry.toLocaleDateString('sr-RS')}`
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
