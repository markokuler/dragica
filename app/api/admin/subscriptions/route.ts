import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, getDemoTenantIds } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date()

    const demoTenantIds = await getDemoTenantIds(user)

    // Get all tenants with their subscription info
    let tenantsQuery = supabase
      .from('tenants')
      .select(`
        id,
        name,
        email,
        subscription_status,
        subscription_expires_at
      `)
      .order('subscription_expires_at', { ascending: true, nullsFirst: false })

    if (demoTenantIds) {
      tenantsQuery = tenantsQuery.in('id', demoTenantIds)
    }

    const { data: tenants, error: tenantsError } = await tenantsQuery

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Get active subscriptions from tenant_subscriptions table
    let subsQuery = supabase
      .from('tenant_subscriptions')
      .select(`
        id,
        tenant_id,
        plan_id,
        started_at,
        expires_at,
        status,
        subscription_plans (
          name
        )
      `)
      .order('expires_at', { ascending: true })

    if (demoTenantIds) {
      subsQuery = subsQuery.in('tenant_id', demoTenantIds)
    }

    const { data: subscriptions, error: subsError } = await subsQuery

    // Create a map of tenant_id to subscription
    const subscriptionMap = new Map()
    if (subscriptions) {
      for (const sub of subscriptions) {
        // Keep the most recent subscription per tenant
        if (!subscriptionMap.has(sub.tenant_id) ||
            new Date(sub.expires_at) > new Date(subscriptionMap.get(sub.tenant_id).expires_at)) {
          subscriptionMap.set(sub.tenant_id, sub)
        }
      }
    }

    // Combine tenant info with subscription info
    const result = (tenants || []).map(tenant => {
      const subscription = subscriptionMap.get(tenant.id)
      const expiresAt = tenant.subscription_expires_at
      const daysRemaining = expiresAt
        ? Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const plan = subscription?.subscription_plans as unknown as { name: string } | null

      return {
        id: subscription?.id || tenant.id,
        tenant_id: tenant.id,
        salon_name: tenant.name,
        salon_email: tenant.email,
        plan_name: plan?.name || 'Trial',
        status: tenant.subscription_status || 'trial',
        started_at: subscription?.started_at || null,
        expires_at: expiresAt,
        days_remaining: daysRemaining,
      }
    })

    return NextResponse.json({ subscriptions: result })
  } catch (error) {
    console.error('Error in GET /api/admin/subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
