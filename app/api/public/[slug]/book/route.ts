import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmation, NotificationChannel } from '@/lib/infobip/client'
import { normalizePhoneForDB, cleanPhoneNumber } from '@/lib/phone-utils'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    const body = await request.json()
    const { service_id, date, time, phone, name, notification_channel } = body

    // Validate required fields
    if (!service_id || !date || !time || !phone) {
      return NextResponse.json(
        { error: 'Sva polja su obavezna' },
        { status: 400 }
      )
    }

    // Notification channel is optional
    const validChannels: NotificationChannel[] = ['whatsapp', 'viber']
    const channel: NotificationChannel | null = notification_channel && validChannels.includes(notification_channel)
      ? notification_channel
      : null

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, is_active, name, phone')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant || !tenant.is_active) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Get service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration_minutes, price')
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

    // Phone is already in international format (+381...) from frontend
    // Clean it just in case and normalize for lookup
    const cleanedPhone = phone.startsWith('+') ? phone : `+${cleanPhoneNumber(phone)}`
    const normalized = normalizePhoneForDB(cleanedPhone)

    // Find or create customer via normalized phone
    let customerId: string

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, phone')
      .eq('tenant_id', tenant.id)
      .eq('phone_normalized', normalized)
      .limit(1)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update phone to international format, name and notification channel if provided
      const updateData: Record<string, string | null> = {
        phone: cleanedPhone, // Always update to international format
      }
      if (name) updateData.name = name
      if (channel) updateData.notification_channel = channel

      await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId)
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          phone: cleanedPhone, // Store in international format
          name: name || null,
          notification_channel: channel,
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

    // Generate unique manage token for client to modify/cancel booking
    const manageToken = randomUUID()

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenant.id,
        service_id,
        customer_id: customerId,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        status: 'confirmed',
        manage_token: manageToken,
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

    // Send notification via WhatsApp or Viber if channel is selected
    if (channel) {
      try {
        const formattedDate = format(startDatetime, 'EEEE, d. MMMM yyyy', { locale: srLatn })
        const formattedTime = format(startDatetime, 'HH:mm')

        // Build manage link for client to modify/cancel booking
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
        const manageLink = `${baseUrl}/book/${slug}/izmena/${manageToken}`

        await sendBookingConfirmation({
          to: cleanedPhone,
          channel,
          customerName: name || undefined,
          serviceName: service.name,
          date: formattedDate,
          time: formattedTime,
          salonName: tenant.name,
          salonPhone: tenant.phone || undefined,
          manageLink,
        })
      } catch (notificationError) {
        // Log but don't fail the booking if notification fails
        console.error('Failed to send booking notification:', notificationError)
      }
    }

    return NextResponse.json({
      bookingId: booking.id,
      message: 'Termin je uspešno zakazan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/public/[slug]/book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
