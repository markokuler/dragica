import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, getEffectiveTenantId } from '@/lib/auth'
import { normalizePhoneForDB, cleanPhoneNumber } from '@/lib/phone-utils'

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
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
      const isPhoneSearch = /^\+?\d+$/.test(search.replace(/[\s\-()]/g, ''))
      if (isPhoneSearch) {
        const normalized = normalizePhoneForDB(search)
        query = query.or(`phone_normalized.ilike.%${normalized}%,name.ilike.%${search}%`)
      } else {
        query = query.or(`phone.ilike.%${search}%,name.ilike.%${search}%`)
      }
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

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    const body = await request.json()
    const { phone, name, notes } = body

    if (!phone) {
      return NextResponse.json({ error: 'Telefon je obavezan' }, { status: 400 })
    }

    // Clean phone number - expect international format from dashboard
    const cleanedPhone = phone.startsWith('+') ? phone : `+${cleanPhoneNumber(phone)}`
    const normalized = normalizePhoneForDB(cleanedPhone)

    // Check if client with this phone already exists via normalized column
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone_normalized', normalized)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Klijent sa ovim brojem telefona već postoji' }, { status: 400 })
    }

    const { data: client, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        phone: cleanedPhone, // Store in international format
        name: name || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: 'Greška pri kreiranju klijenta' }, { status: 500 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error in POST /api/dashboard/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
