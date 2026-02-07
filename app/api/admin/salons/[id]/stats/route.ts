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
      .gte('start_datetime', startOfMonth)

    // Get last month's bookings for comparison
    const { count: lastMonthBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .gte('start_datetime', startOfLastMonth)
      .lt('start_datetime', startOfMonth)

    // Get unique clients count
    const { data: clientsData } = await supabase
      .from('customers')
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

    // Get last booking date (last activity)
    const { data: lastBookingData } = await supabase
      .from('bookings')
      .select('start_datetime')
      .eq('tenant_id', id)
      .order('start_datetime', { ascending: false })
      .limit(1)
      .single()

    // Engagement: online booking rate (bookings with manage_token vs total)
    const { count: onlineBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .not('manage_token', 'is', null)

    const onlineBookingRate = (totalBookings && totalBookings > 0)
      ? Math.round(((onlineBookings || 0) / totalBookings) * 100)
      : 0

    // Engagement: completion rate (completed / total, as percentage)
    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('status', 'completed')

    const completionRate = (totalBookings && totalBookings > 0)
      ? Math.round(((completedBookings || 0) / totalBookings) * 100)
      : 0

    // Cancelled bookings count
    const { count: cancelledBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('status', 'cancelled')

    // No-show bookings count
    const { count: noShowBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('status', 'no_show')

    // Blocked slots count (feature adoption)
    const { count: blockedSlotsCount } = await supabase
      .from('blocked_slots')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)

    // Online bookings this month
    const { count: onlineBookingsThisMonth } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .not('manage_token', 'is', null)
      .gte('start_datetime', startOfMonth)

    // Manual bookings this month (no manage_token)
    const { count: manualBookingsThisMonth } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .is('manage_token', null)
      .gte('start_datetime', startOfMonth)

    // Get owner's created_at (from users table)
    const { data: ownerData } = await supabase
      .from('users')
      .select('created_at')
      .eq('tenant_id', id)
      .eq('role', 'client')
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
          cancelled: cancelledBookings || 0,
          noShow: noShowBookings || 0,
          onlineThisMonth: onlineBookingsThisMonth || 0,
          manualThisMonth: manualBookingsThisMonth || 0,
          lastActivityDate: lastBookingData?.start_datetime
            ? lastBookingData.start_datetime.split('T')[0]
            : null,
        },
        clients: {
          total: clientCount,
        },
        services: {
          total: servicesCount || 0,
          active: activeServicesCount || 0,
        },
        engagement: {
          onlineBookingRate,
          completionRate,
        },
        activity: {
          ownerCreatedAt: ownerData?.created_at || null,
          workingDays: workingDays || 0,
          blockedSlots: blockedSlotsCount || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
