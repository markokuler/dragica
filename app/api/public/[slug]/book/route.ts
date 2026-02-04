import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    const body = await request.json()
    const { service_id, date, time, phone, name } = body

    // Validate required fields
    if (!service_id || !date || !time || !phone) {
      return NextResponse.json(
        { error: 'Sva polja su obavezna' },
        { status: 400 }
      )
    }

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, is_active')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant || !tenant.is_active) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Get service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, duration_minutes, price')
      .eq('id', service_id)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Usluga nije pronađena' }, { status: 404 })
    }

    // Calculate start and end datetime
    const startDatetime = new Date(`${date}T${time}:00`)
    const endDatetime = new Date(startDatetime.getTime() + service.duration_minutes * 60000)

    // Validate not in the past
    if (startDatetime <= new Date()) {
      return NextResponse.json(
        { error: 'Ne možete zakazati termin u prošlosti' },
        { status: 400 }
      )
    }

    // Check for blocked slots
    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('id')
      .eq('tenant_id', tenant.id)
      .lt('start_datetime', endDatetime.toISOString())
      .gt('end_datetime', startDatetime.toISOString())

    if (blockedSlots && blockedSlots.length > 0) {
      return NextResponse.json(
        { error: 'Izabrani termin nije dostupan' },
        { status: 400 }
      )
    }

    // Check for conflicting bookings
    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('tenant_id', tenant.id)
      .in('status', ['pending', 'confirmed'])
      .lt('start_datetime', endDatetime.toISOString())
      .gt('end_datetime', startDatetime.toISOString())

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Termin je već zauzet' },
        { status: 400 }
      )
    }

    // Find or create customer
    let customerId: string

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('phone', phone)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update name if provided
      if (name) {
        await supabase
          .from('customers')
          .update({ name })
          .eq('id', customerId)
          .is('name', null)
      }
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          phone,
          name: name || null,
        })
        .select()
        .single()

      if (customerError || !newCustomer) {
        return NextResponse.json(
          { error: 'Greška pri kreiranju klijenta' },
          { status: 500 }
        )
      }

      customerId = newCustomer.id
    }

    // Generate OTP code (for future SMS verification)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenant.id,
        service_id,
        customer_id: customerId,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        status: 'confirmed', // Auto-confirm for now (until SMS OTP is implemented)
        otp_code: otpCode,
        otp_verified_at: new Date().toISOString(), // Auto-verify for now
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Greška pri zakazivanju' },
        { status: 500 }
      )
    }

    // TODO: Send SMS confirmation when Twilio is configured
    // await sendSMS(phone, `Vaš termin je zakazan za ${date} u ${time}. Kod: ${otpCode}`)

    return NextResponse.json({
      bookingId: booking.id,
      message: 'Termin je uspešno zakazan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/public/[slug]/book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
