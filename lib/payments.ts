import { createAdminClient } from '@/lib/supabase/admin'

interface RecordPaymentParams {
  tenantId: string
  planId: string
  amount: string | number
  paymentDate: string
  notes?: string | null
  recordedBy: string
  isDemo?: boolean
}

interface RecordPaymentResult {
  payment: Record<string, unknown>
  newExpiry: string
  message: string
}

export async function recordPayment(params: RecordPaymentParams): Promise<RecordPaymentResult> {
  const { tenantId, planId, amount, paymentDate, notes, recordedBy, isDemo } = params
  const supabase = createAdminClient()

  // Get the plan details
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('duration_days, name')
    .eq('id', planId)
    .single()

  if (planError || !plan) {
    throw new PaymentError('Plan nije pronađen', 400)
  }

  // Get current tenant info
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('name, subscription_expires_at')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    throw new PaymentError('Salon nije pronađen', 400)
  }

  // Calculate new expiration date
  const now = new Date()
  const currentExpiry = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : now
  const baseDate = currentExpiry > now ? currentExpiry : new Date(paymentDate)
  const newExpiry = new Date(baseDate)
  newExpiry.setDate(newExpiry.getDate() + plan.duration_days)

  // 1. Record the payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      plan_id: planId,
      amount: parseFloat(String(amount)),
      payment_date: paymentDate,
      notes: notes || null,
      recorded_by: recordedBy,
    })
    .select()
    .single()

  if (paymentError) {
    console.error('Error recording payment:', paymentError)
    throw new PaymentError('Greška pri evidentiranju uplate', 500)
  }

  // 2. Update or create tenant subscription
  await supabase
    .from('tenant_subscriptions')
    .upsert({
      tenant_id: tenantId,
      plan_id: planId,
      started_at: paymentDate,
      expires_at: newExpiry.toISOString(),
      status: 'active',
    }, {
      onConflict: 'tenant_id',
    })

  // 3. Update tenant subscription status and expiry
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'active',
      subscription_expires_at: newExpiry.toISOString(),
    })
    .eq('id', tenantId)

  // 4. Auto-create admin financial entry (subscription income)
  const parsedAmount = parseFloat(String(amount))
  if (parsedAmount > 0) {
    await supabase
      .from('admin_financial_entries')
      .insert({
        type: 'income',
        category: 'subscriptions',
        amount: parsedAmount,
        description: `${tenant.name} — ${plan.name}`,
        entry_date: paymentDate,
        payment_id: payment.id,
        is_demo: isDemo || false,
      })
  }

  const message = `Pretplata produžena do ${newExpiry.toLocaleDateString('sr-RS')}`

  return { payment, newExpiry: newExpiry.toISOString(), message }
}

export class PaymentError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
