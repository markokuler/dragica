import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
      query = query.or(`phone.ilike.%${search}%,name.ilike.%${search}%`)
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Get booking counts and totals for each client
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        // Get booking count
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', client.id)
          .eq('status', 'completed')

        // Get total spent
        const { data: bookings } = await supabase
          .from('bookings')
          .select('service_id, services(price)')
          .eq('customer_id', client.id)
          .eq('status', 'completed')

        const totalSpent = bookings?.reduce((sum, booking) => {
          const price = (booking.services as any)?.price || 0
          return sum + price
        }, 0) || 0

        // Get last visit
        const { data: lastBooking } = await supabase
          .from('bookings')
          .select('start_datetime')
          .eq('customer_id', client.id)
          .eq('status', 'completed')
          .order('start_datetime', { ascending: false })
          .limit(1)
          .single()

        return {
          ...client,
          totalBookings: totalBookings || 0,
          totalSpent,
          lastVisit: lastBooking?.start_datetime || null,
        }
      })
    )

    return NextResponse.json({ clients: clientsWithStats })
  } catch (error) {
    console.error('Error in GET /api/dashboard/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
