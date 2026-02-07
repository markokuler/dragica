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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const demoTenantIds = await getDemoTenantIds(user)

    // Get all tenants
    let tenantsQuery = supabase
      .from('tenants')
      .select('id, name, email, is_active, subscription_status, subscription_expires_at, created_at')
      .order('created_at', { ascending: false })

    if (demoTenantIds) {
      tenantsQuery = tenantsQuery.in('id', demoTenantIds)
    }

    const { data: tenants, error: tenantsError } = await tenantsQuery

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError)
    }

    const allTenants = tenants || []

    // Calculate stats
    const totalSalons = allTenants.length
    const activeSalons = allTenants.filter(t => t.is_active).length
    const inactiveSalons = totalSalons - activeSalons

    // Subscription stats
    const expiredSubscriptions = allTenants.filter(t =>
      t.subscription_status === 'expired' ||
      (t.subscription_expires_at && new Date(t.subscription_expires_at) < now)
    ).length

    const expiringSubscriptions = allTenants.filter(t =>
      t.subscription_expires_at &&
      new Date(t.subscription_expires_at) >= now &&
      new Date(t.subscription_expires_at) <= sevenDaysFromNow
    ).length

    const paymentPending = allTenants.filter(t =>
      t.subscription_status === 'payment_pending'
    ).length

    // New salons this month
    const newSalonsThisMonth = allTenants.filter(t =>
      new Date(t.created_at) >= startOfMonth
    ).length

    // Get last booking date per tenant for dormant detection
    let lastBookingQuery = supabase
      .from('bookings')
      .select('tenant_id, start_datetime')
      .gte('start_datetime', thirtyDaysAgo.toISOString())
      .in('status', ['pending', 'confirmed', 'completed'])

    if (demoTenantIds) {
      lastBookingQuery = lastBookingQuery.in('tenant_id', demoTenantIds)
    }

    const { data: recentBookings } = await lastBookingQuery
    const tenantsWithRecentBookings = new Set(
      (recentBookings || []).map(b => b.tenant_id)
    )

    // Inactive salons (no bookings in 30+ days)
    const dormantSalons = allTenants.filter(t =>
      t.is_active && !tenantsWithRecentBookings.has(t.id)
    )

    // Get bookings count
    let totalBookingsQuery = supabase.from('bookings').select('*', { count: 'exact', head: true })
    let bookingsThisMonthQuery = supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString())
    let bookingsLastMonthQuery = supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', startOfLastMonth.toISOString()).lt('created_at', startOfMonth.toISOString())

    if (demoTenantIds) {
      totalBookingsQuery = totalBookingsQuery.in('tenant_id', demoTenantIds)
      bookingsThisMonthQuery = bookingsThisMonthQuery.in('tenant_id', demoTenantIds)
      bookingsLastMonthQuery = bookingsLastMonthQuery.in('tenant_id', demoTenantIds)
    }

    const { count: totalBookings } = await totalBookingsQuery
    const { count: bookingsThisMonth } = await bookingsThisMonthQuery
    const { count: bookingsLastMonth } = await bookingsLastMonthQuery

    // Calculate MRR from active subscriptions
    let subsQuery = supabase
      .from('tenant_subscriptions')
      .select(`
        tenant_id,
        plan_id,
        status,
        subscription_plans (
          price,
          duration_days
        )
      `)
      .eq('status', 'active')

    if (demoTenantIds) {
      subsQuery = subsQuery.in('tenant_id', demoTenantIds)
    }

    const { data: subscriptions } = await subsQuery

    let mrr = 0
    if (subscriptions) {
      subscriptions.forEach((sub) => {
        const plan = sub.subscription_plans as unknown as { price: number; duration_days: number } | null
        if (plan?.price && plan?.duration_days) {
          // Convert to monthly (30 days)
          const monthlyPrice = (plan.price / plan.duration_days) * 30
          mrr += monthlyPrice
        }
      })
    }

    // Get last month MRR for comparison (simplified - use payments)
    let lastMonthPaymentsQuery = supabase.from('payments').select('amount').gte('payment_date', startOfLastMonth.toISOString()).lt('payment_date', startOfMonth.toISOString())
    let thisMonthPaymentsQuery = supabase.from('payments').select('amount').gte('payment_date', startOfMonth.toISOString())
    let recentPaymentsQuery = supabase.from('payments').select(`id, amount, payment_date, tenants (name), subscription_plans (name)`).order('payment_date', { ascending: false }).limit(5)

    if (demoTenantIds) {
      lastMonthPaymentsQuery = lastMonthPaymentsQuery.in('tenant_id', demoTenantIds)
      thisMonthPaymentsQuery = thisMonthPaymentsQuery.in('tenant_id', demoTenantIds)
      recentPaymentsQuery = recentPaymentsQuery.in('tenant_id', demoTenantIds)
    }

    const { data: lastMonthPayments } = await lastMonthPaymentsQuery
    const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    const { data: thisMonthPayments } = await thisMonthPaymentsQuery
    const thisMonthRevenue = thisMonthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    const { data: recentPayments } = await recentPaymentsQuery

    const formattedRecentPayments = (recentPayments || []).map(p => {
      const tenant = p.tenants as unknown as { name: string } | null
      const plan = p.subscription_plans as unknown as { name: string } | null
      return {
        id: p.id,
        amount: p.amount,
        payment_date: p.payment_date,
        salon_name: tenant?.name || 'Nepoznat',
        plan_name: plan?.name || 'Nepoznat',
      }
    })

    // Recent salons (last 5)
    const recentSalons = allTenants.slice(0, 5).map(t => ({
      id: t.id,
      name: t.name,
      created_at: t.created_at,
      subscription_status: t.subscription_status || 'trial',
      subscription_expires_at: t.subscription_expires_at,
    }))

    // Expiring soon salons (next 7 days)
    const expiringSalons = allTenants
      .filter(t =>
        t.subscription_expires_at &&
        new Date(t.subscription_expires_at) >= now &&
        new Date(t.subscription_expires_at) <= sevenDaysFromNow
      )
      .map(t => {
        const expiryDate = new Date(t.subscription_expires_at!)
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: t.id,
          name: t.name,
          expires_at: t.subscription_expires_at,
          days_left: daysLeft,
        }
      })
      .sort((a, b) => a.days_left - b.days_left)

    // Get reminders due today or overdue
    const today = now.toISOString().split('T')[0]
    let remindersQuery = supabase
      .from('admin_reminders')
      .select(`
        id,
        title,
        reminder_date,
        tenant_id,
        tenants (
          name
        )
      `)
      .eq('is_completed', false)
      .lte('reminder_date', today)
      .order('reminder_date', { ascending: true })
      .limit(5)

    if (demoTenantIds) {
      remindersQuery = remindersQuery.in('tenant_id', demoTenantIds)
    }

    const { data: reminders } = await remindersQuery

    const dueReminders = (reminders || []).map(r => {
      const tenant = r.tenants as unknown as { name: string } | null
      return {
        id: r.id,
        title: r.title,
        reminder_date: r.reminder_date,
        tenant_id: r.tenant_id,
        salon_name: tenant?.name || null,
      }
    })

    // Alerts
    const alerts = allTenants
      .filter(t =>
        t.subscription_status === 'expired' ||
        t.subscription_status === 'payment_pending' ||
        (t.subscription_expires_at && new Date(t.subscription_expires_at) <= sevenDaysFromNow)
      )
      .map(t => ({
        id: t.id,
        type: t.subscription_status === 'expired' ? 'expired' :
              t.subscription_status === 'payment_pending' ? 'payment_pending' : 'expiring',
        salon_name: t.name,
        expires_at: t.subscription_expires_at,
      }))
      .slice(0, 10)

    return NextResponse.json({
      totalSalons,
      activeSalons,
      inactiveSalons,
      totalBookings: totalBookings || 0,
      bookingsThisMonth: bookingsThisMonth || 0,
      bookingsLastMonth: bookingsLastMonth || 0,
      expiringSubscriptions,
      expiredSubscriptions,
      paymentPending,
      newSalonsThisMonth,
      dormantSalonsCount: dormantSalons.length,
      dormantSalons: dormantSalons.slice(0, 5).map(s => ({
        id: s.id,
        name: s.name,
      })),
      mrr: Math.round(mrr),
      thisMonthRevenue,
      lastMonthRevenue,
      recentSalons,
      recentPayments: formattedRecentPayments,
      expiringSalons,
      dueReminders,
      alerts,
    })
  } catch (error) {
    console.error('Error in admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
