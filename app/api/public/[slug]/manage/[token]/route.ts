import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/public/[slug]/manage/[token]
 * Fetch booking details by manage token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  try {
    const { slug, token } = await params
    const supabase = createAdminClient()

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, phone, email, slug')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Get booking by manage token
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_datetime,
        end_datetime,
        status,
        created_at,
        service:services(id, name, duration_minutes, price),
        customer:customers(id, name, phone)
      `)
      .eq('tenant_id', tenant.id)
      .eq('manage_token', token)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Termin nije pronađen' }, { status: 404 })
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        start_datetime: booking.start_datetime,
        end_datetime: booking.end_datetime,
        status: booking.status,
        created_at: booking.created_at,
        service: booking.service,
        customer: booking.customer,
      },
      tenant: {
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email,
        slug: tenant.slug,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/public/[slug]/manage/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/public/[slug]/manage/[token]
 * Cancel booking by manage token
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  try {
    const { slug, token } = await params
    const supabase = createAdminClient()

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Get booking by manage token
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, start_datetime')
      .eq('tenant_id', tenant.id)
      .eq('manage_token', token)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Termin nije pronađen' }, { status: 404 })
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Termin je već otkazan' }, { status: 400 })
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ error: 'Završeni termini se ne mogu otkazati' }, { status: 400 })
    }

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return NextResponse.json({ error: 'Greška pri otkazivanju' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Termin je uspešno otkazan' })
  } catch (error) {
    console.error('Error in DELETE /api/public/[slug]/manage/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/public/[slug]/manage/[token]
 * Reschedule booking by manage token
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  try {
    const { slug, token } = await params
    const supabase = createAdminClient()
    const body = await request.json()
    const { date, time } = body

    if (!date || !time) {
      return NextResponse.json({ error: 'Datum i vreme su obavezni' }, { status: 400 })
    }

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Get booking by manage token
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        service_id,
        service:services(duration_minutes)
      `)
      .eq('tenant_id', tenant.id)
      .eq('manage_token', token)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Termin nije pronađen' }, { status: 404 })
    }

    // Check if booking can be rescheduled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Otkazani termini se ne mogu menjati' }, { status: 400 })
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ error: 'Završeni termini se ne mogu menjati' }, { status: 400 })
    }

    // Calculate new times
    const service = booking.service as unknown as { duration_minutes: number }
    const startDatetime = new Date(`${date}T${time}:00`)
    const endDatetime = new Date(startDatetime.getTime() + service.duration_minutes * 60000)

    // Validate not in the past
    if (startDatetime <= new Date()) {
      return NextResponse.json({ error: 'Ne možete zakazati termin u prošlosti' }, { status: 400 })
    }

    // Check for blocked slots
    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('id')
      .eq('tenant_id', tenant.id)
      .lt('start_datetime', endDatetime.toISOString())
      .gt('end_datetime', startDatetime.toISOString())

    if (blockedSlots && blockedSlots.length > 0) {
      return NextResponse.json({ error: 'Izabrani termin nije dostupan' }, { status: 400 })
    }

    // Check for conflicting bookings (excluding current booking)
    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('tenant_id', tenant.id)
      .neq('id', booking.id)
      .in('status', ['pending', 'confirmed'])
      .lt('start_datetime', endDatetime.toISOString())
      .gt('end_datetime', startDatetime.toISOString())

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json({ error: 'Termin je već zauzet' }, { status: 400 })
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error rescheduling booking:', updateError)
      return NextResponse.json({ error: 'Greška pri izmeni termina' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Termin je uspešno izmenjen',
      newStartDatetime: startDatetime.toISOString(),
      newEndDatetime: endDatetime.toISOString(),
    })
  } catch (error) {
    console.error('Error in PATCH /api/public/[slug]/manage/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
