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
    const limit = parseInt(searchParams.get('limit') || '50')
    const upcoming = searchParams.get('upcoming') === 'true'
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        service:services(id, name, price, duration_minutes),
        customer:customers(id, name, phone)
      `)
      .eq('tenant_id', tenantId)
      .order('start_datetime', { ascending: upcoming })
      .limit(limit)

    if (upcoming) {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      query = query.gte('start_datetime', startOfToday.toISOString())
        .in('status', ['pending', 'confirmed'])
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('start_datetime', startDate)
    }

    if (endDate) {
      query = query.lte('start_datetime', endDate)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error in GET /api/dashboard/bookings:', error)
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
    const { service_id, customer_phone, customer_name, start_datetime } = body

    // Validate required fields
    if (!service_id || !customer_phone || !start_datetime) {
      return NextResponse.json(
        { error: 'Usluga, telefon klijenta i vreme su obavezni' },
        { status: 400 }
      )
    }

    // Get service to calculate end_datetime
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('tenant_id', tenantId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Usluga nije pronađena' }, { status: 404 })
    }

    // Calculate end_datetime
    const startDate = new Date(start_datetime)
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000)

    // Clean phone - expect international format from dashboard
    const cleanedPhone = customer_phone.startsWith('+') ? customer_phone : `+${cleanPhoneNumber(customer_phone)}`
    const normalized = normalizePhoneForDB(cleanedPhone)

    // Find or create customer
    let customerId: string

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, phone')
      .eq('tenant_id', tenantId)
      .eq('phone_normalized', normalized)
      .limit(1)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update phone to international format and customer name if provided
      const updateData: Record<string, string | null> = {
        phone: cleanedPhone, // Always update to international format
      }
      if (customer_name) {
        updateData.name = customer_name
      }

      await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId)
    } else {
      // Create new customer with international phone
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          phone: cleanedPhone,
          name: customer_name || null,
        })
        .select()
        .single()

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError)
        return NextResponse.json(
          { error: 'Greška pri kreiranju klijenta' },
          { status: 500 }
        )
      }

      customerId = newCustomer.id
    }

    // Check for blocked slots
    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('id')
      .eq('tenant_id', tenantId)
      .lt('start_datetime', endDate.toISOString())
      .gt('end_datetime', startDate.toISOString())

    if (blockedSlots && blockedSlots.length > 0) {
      return NextResponse.json(
        { error: 'Izabrani termin je blokiran' },
        { status: 400 }
      )
    }

    // Check for conflicting bookings
    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('status', ['pending', 'confirmed'])
      .lt('start_datetime', endDate.toISOString())
      .gt('end_datetime', startDate.toISOString())

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Termin je već zauzet' },
        { status: 400 }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        service_id,
        customer_id: customerId,
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        status: 'confirmed', // Manual bookings are auto-confirmed
        otp_verified_at: new Date().toISOString(), // Mark as verified since it's manual
      })
      .select(`
        *,
        service:services(id, name, price, duration_minutes),
        customer:customers(id, name, phone)
      `)
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Greška pri kreiranju zakazivanja' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/dashboard/bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
