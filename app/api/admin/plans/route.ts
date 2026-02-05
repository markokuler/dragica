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

    // Get plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('duration_days', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    // Get usage count for each plan
    const { data: subscriptions } = await supabase
      .from('tenant_subscriptions')
      .select('plan_id')

    const usageCounts: Record<string, number> = {}
    if (subscriptions) {
      subscriptions.forEach((sub) => {
        if (sub.plan_id) {
          usageCounts[sub.plan_id] = (usageCounts[sub.plan_id] || 0) + 1
        }
      })
    }

    // Add usage_count to each plan
    const plansWithUsage = (plans || []).map((plan) => ({
      ...plan,
      usage_count: usageCounts[plan.id] || 0,
    }))

    return NextResponse.json({ plans: plansWithUsage })
  } catch (error) {
    console.error('Error in GET /api/admin/plans:', error)
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
    const { name, duration_days, price, is_trial, is_active } = body

    if (!name || !duration_days || price === undefined) {
      return NextResponse.json({ error: 'Sva obavezna polja moraju biti popunjena' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .insert({
        name,
        duration_days: parseInt(duration_days),
        price: parseFloat(price),
        is_trial: is_trial || false,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating plan:', error)
      return NextResponse.json({ error: 'Greška pri kreiranju plana' }, { status: 500 })
    }

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
