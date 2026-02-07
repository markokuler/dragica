import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, getDemoTenantIds } from '@/lib/auth'
import { recordPayment, PaymentError } from '@/lib/payments'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const demoTenantIds = await getDemoTenantIds(user)

    let query = supabase
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

    if (demoTenantIds) {
      query = query.in('tenant_id', demoTenantIds)
    }

    const { data: payments, error } = await query

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

    const result = await recordPayment({
      tenantId: tenant_id,
      planId: plan_id,
      amount,
      paymentDate: payment_date,
      notes,
      recordedBy: user.id,
      isDemo: user.is_demo || false,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error in POST /api/admin/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
