import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

// Get all coupons
export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (user.is_demo) {
      query = query.eq('is_demo', true)
    } else {
      query = query.eq('is_demo', false)
    }

    const { data: coupons, error } = await query

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    // Compute current_uses from payments table
    const couponIds = (coupons || []).map(c => c.id)
    let usageCounts: Record<string, number> = {}

    if (couponIds.length > 0) {
      const { data: usageData } = await supabase
        .from('payments')
        .select('coupon_id')
        .in('coupon_id', couponIds)

      if (usageData) {
        for (const row of usageData) {
          if (row.coupon_id) {
            usageCounts[row.coupon_id] = (usageCounts[row.coupon_id] || 0) + 1
          }
        }
      }
    }

    const couponsWithUsage = (coupons || []).map(coupon => ({
      ...coupon,
      current_uses: usageCounts[coupon.id] || 0,
    }))

    return NextResponse.json({ coupons: couponsWithUsage })
  } catch (error) {
    console.error('Error in GET /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create coupon
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, discount_type, discount_value, max_uses, valid_from, valid_until, description } = body

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json({ error: 'Kod, tip i vrednost popusta su obavezni' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        discount_type,
        discount_value: parseFloat(discount_value),
        max_uses: max_uses ? parseInt(max_uses) : null,
        valid_from: valid_from || new Date().toISOString().split('T')[0],
        valid_until: valid_until || null,
        description: description || null,
        is_active: true,
        is_demo: user.is_demo || false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Kupon sa tim kodom već postoji' }, { status: 400 })
      }
      console.error('Error creating coupon:', error)
      return NextResponse.json({ error: 'Greška pri kreiranju kupona' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'create',
      entityType: 'coupon',
      entityId: coupon.id,
      entityName: coupon.code,
      details: { discount_type, discount_value, max_uses },
      isDemo: user.is_demo,
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/coupons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
