import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectiveTenantId, getUserWithRole } from '@/lib/auth'

export async function GET() {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get effective tenant (supports impersonation)
    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get date 7 days from now
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Count today's bookings
    const { count: todayBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('start_datetime', today.toISOString())
      .lt('start_datetime', tomorrow.toISOString())
      .in('status', ['pending', 'confirmed'])

    // Count upcoming bookings (next 7 days)
    const { count: upcomingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('start_datetime', today.toISOString())
      .lt('start_datetime', nextWeek.toISOString())
      .in('status', ['pending', 'confirmed'])

    // Count total clients
    const { count: totalClients } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    // Calculate monthly revenue from financial_entries only
    // (completed bookings automatically create financial_entries, so counting both would double-count)
    const { data: monthlyIncome } = await supabase
      .from('financial_entries')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('type', 'income')
      .gte('entry_date', firstDayOfMonth.toISOString().split('T')[0])

    let monthlyRevenue = 0
    if (monthlyIncome) {
      monthlyRevenue = monthlyIncome.reduce((sum, entry) => sum + Number(entry.amount), 0)
    }

    return NextResponse.json({
      todayBookings: todayBookings || 0,
      upcomingBookings: upcomingBookings || 0,
      totalClients: totalClients || 0,
      monthlyRevenue,
    })
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
