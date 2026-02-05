import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get current date info
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

    // Get total bookings count
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)

    // Get this month's bookings
    const { count: monthBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .gte('booking_date', startOfMonth)

    // Get last month's bookings for comparison
    const { count: lastMonthBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .gte('booking_date', startOfLastMonth)
      .lt('booking_date', startOfMonth)

    // Get completed bookings (revenue source)
    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('status', 'completed')

    // Get unique clients count
    const { data: clientsData } = await supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('tenant_id', id)

    const clientCount = clientsData?.length || 0

    // Get services count
    const { count: servicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)

    // Get active services count
    const { count: activeServicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('is_active', true)

    // Get last booking
    const { data: lastBookingData } = await supabase
      .from('bookings')
      .select('booking_date, booking_time')
      .eq('tenant_id', id)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })
      .limit(1)
      .single()

    // Get bookings by status
    const { data: statusCounts } = await supabase
      .from('bookings')
      .select('status')
      .eq('tenant_id', id)

    const bookingsByStatus = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noshow: 0,
    }

    if (statusCounts) {
      statusCounts.forEach((b) => {
        const status = b.status as keyof typeof bookingsByStatus
        if (status in bookingsByStatus) {
          bookingsByStatus[status]++
        }
      })
    }

    // Calculate revenue (sum of completed bookings)
    const { data: revenueData } = await supabase
      .from('bookings')
      .select(`
        services (
          price
        )
      `)
      .eq('tenant_id', id)
      .eq('status', 'completed')

    let totalRevenue = 0
    if (revenueData) {
      revenueData.forEach((booking) => {
        const service = booking.services as unknown as { price: number } | null
        if (service?.price) {
          totalRevenue += service.price
        }
      })
    }

    // Get this month's revenue
    const { data: monthRevenueData } = await supabase
      .from('bookings')
      .select(`
        services (
          price
        )
      `)
      .eq('tenant_id', id)
      .eq('status', 'completed')
      .gte('booking_date', startOfMonth)

    let monthRevenue = 0
    if (monthRevenueData) {
      monthRevenueData.forEach((booking) => {
        const service = booking.services as unknown as { price: number } | null
        if (service?.price) {
          monthRevenue += service.price
        }
      })
    }

    // Get owner's last login (from users table)
    const { data: ownerData } = await supabase
      .from('users')
      .select('last_login_at, created_at')
      .eq('tenant_id', id)
      .eq('role', 'owner')
      .single()

    // Get working hours count
    const { count: workingDays } = await supabase
      .from('working_hours')
      .select('day_of_week', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('is_active', true)

    return NextResponse.json({
      stats: {
        bookings: {
          total: totalBookings || 0,
          thisMonth: monthBookings || 0,
          lastMonth: lastMonthBookings || 0,
          completed: completedBookings || 0,
          byStatus: bookingsByStatus,
          lastBooking: lastBookingData ? {
            date: lastBookingData.booking_date,
            time: lastBookingData.booking_time,
          } : null,
        },
        clients: {
          total: clientCount,
        },
        services: {
          total: servicesCount || 0,
          active: activeServicesCount || 0,
        },
        revenue: {
          total: totalRevenue,
          thisMonth: monthRevenue,
        },
        activity: {
          ownerLastLogin: ownerData?.last_login_at || null,
          ownerCreatedAt: ownerData?.created_at || null,
          workingDays: workingDays || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
