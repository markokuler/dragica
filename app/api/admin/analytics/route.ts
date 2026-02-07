import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, getDemoTenantIds } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30')

    const supabase = createAdminClient()
    const now = new Date()
    const periodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const demoTenantIds = await getDemoTenantIds(user)

    // Get total revenue from payments
    let paymentsQuery = supabase.from('payments').select('amount, payment_date')
    if (demoTenantIds) {
      paymentsQuery = paymentsQuery.in('tenant_id', demoTenantIds)
    }
    const { data: allPayments } = await paymentsQuery

    const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Monthly revenue (this month)
    const monthlyRevenue = allPayments?.filter(p =>
      new Date(p.payment_date) >= thisMonthStart
    ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Get all tenants
    let tenantsQuery = supabase.from('tenants').select('id, name, created_at, is_active')
    if (demoTenantIds) {
      tenantsQuery = tenantsQuery.in('id', demoTenantIds)
    }
    const { data: tenants } = await tenantsQuery

    const totalSalons = tenants?.length || 0
    const activeSalons = tenants?.filter(t => t.is_active).length || 0
    const averageRevenuePerSalon = activeSalons > 0 ? monthlyRevenue / activeSalons : 0

    // New salons this month
    const newSalonsThisMonth = tenants?.filter(t =>
      new Date(t.created_at) >= thisMonthStart
    ).length || 0

    // Bookings this month
    let bookingsThisMonthQuery = supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString())
    let bookingsLastMonthQuery = supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart.toISOString()).lt('created_at', thisMonthStart.toISOString())

    if (demoTenantIds) {
      bookingsThisMonthQuery = bookingsThisMonthQuery.in('tenant_id', demoTenantIds)
      bookingsLastMonthQuery = bookingsLastMonthQuery.in('tenant_id', demoTenantIds)
    }

    const { count: bookingsThisMonth } = await bookingsThisMonthQuery
    const { count: bookingsLastMonth } = await bookingsLastMonthQuery

    // Calculate growth
    const bookingsGrowth = bookingsLastMonth && bookingsLastMonth > 0
      ? ((bookingsThisMonth || 0) - bookingsLastMonth) / bookingsLastMonth * 100
      : 0

    // Churn rate (inactive salons / total)
    const churnRate = totalSalons > 0
      ? ((totalSalons - activeSalons) / totalSalons) * 100
      : 0

    // Top salons by bookings
    let bookingsByTenantQuery = supabase.from('bookings').select('tenant_id').gte('created_at', periodStart.toISOString())
    if (demoTenantIds) {
      bookingsByTenantQuery = bookingsByTenantQuery.in('tenant_id', demoTenantIds)
    }
    const { data: bookingsByTenant } = await bookingsByTenantQuery

    // Count bookings per tenant
    const tenantBookings: Record<string, number> = {}
    bookingsByTenant?.forEach(b => {
      tenantBookings[b.tenant_id] = (tenantBookings[b.tenant_id] || 0) + 1
    })

    // Get tenant names and calculate top salons
    const topSalons = Object.entries(tenantBookings)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tenantId, bookings]) => {
        const tenant = tenants?.find(t => t.id === tenantId)
        return {
          id: tenantId,
          name: tenant?.name || 'Nepoznat salon',
          bookings,
          revenue: 0, // Would need finance_entries to calculate properly
        }
      })

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthRevenue = allPayments?.filter(p =>
        new Date(p.payment_date) >= monthStart && new Date(p.payment_date) <= monthEnd
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      revenueByMonth.push({
        month: monthStart.toLocaleDateString('sr-RS', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue,
      })
    }

    return NextResponse.json({
      totalRevenue,
      monthlyRevenue,
      averageRevenuePerSalon,
      bookingsThisMonth: bookingsThisMonth || 0,
      bookingsLastMonth: bookingsLastMonth || 0,
      bookingsGrowth,
      newSalonsThisMonth,
      churnRate,
      topSalons,
      revenueByMonth,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
