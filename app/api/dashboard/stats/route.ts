import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function GET() {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
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

    // Calculate monthly revenue from completed bookings
    const { data: completedBookings } = await supabase
      .from('bookings')
      .select('service_id, services(price)')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('start_datetime', firstDayOfMonth.toISOString())

    let monthlyRevenue = 0
    if (completedBookings) {
      monthlyRevenue = completedBookings.reduce((sum, booking) => {
        const price = (booking.services as any)?.price || 0
        return sum + price
      }, 0)
    }

    // Also add manual income from financial_entries
    const { data: manualIncome } = await supabase
      .from('financial_entries')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('type', 'income')
      .gte('entry_date', firstDayOfMonth.toISOString().split('T')[0])

    if (manualIncome) {
      monthlyRevenue += manualIncome.reduce((sum, entry) => sum + Number(entry.amount), 0)
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
