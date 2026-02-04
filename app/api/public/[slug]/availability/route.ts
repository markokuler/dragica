import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Get available time slots for a date and service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Datum i usluga su obavezni' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, is_active')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant || !tenant.is_active) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Get service duration
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Usluga nije pronađena' }, { status: 404 })
    }

    const serviceDuration = service.duration_minutes

    // Get day of week (0 = Sunday, 6 = Saturday)
    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.getDay()

    // Get working hours for this day
    const { data: workingHours } = await supabase
      .from('working_hours')
      .select('start_time, end_time')
      .eq('tenant_id', tenant.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time')

    if (!workingHours || workingHours.length === 0) {
      return NextResponse.json({ slots: [], message: 'Neradni dan' })
    }

    // Get blocked slots for this date
    const dateStart = `${date}T00:00:00`
    const dateEnd = `${date}T23:59:59`

    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('start_datetime, end_datetime')
      .eq('tenant_id', tenant.id)
      .lt('start_datetime', dateEnd)
      .gt('end_datetime', dateStart)

    // Get existing bookings for this date
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_datetime, end_datetime')
      .eq('tenant_id', tenant.id)
      .in('status', ['pending', 'confirmed'])
      .gte('start_datetime', dateStart)
      .lte('start_datetime', dateEnd)

    // Generate all possible slots from working hours
    const availableSlots: string[] = []
    const now = new Date()

    for (const wh of workingHours) {
      const [startHour, startMin] = wh.start_time.split(':').map(Number)
      const [endHour, endMin] = wh.end_time.split(':').map(Number)

      // Create slot times in 15-minute intervals
      let currentTime = new Date(requestedDate)
      currentTime.setHours(startHour, startMin, 0, 0)

      const endTime = new Date(requestedDate)
      endTime.setHours(endHour, endMin, 0, 0)

      while (currentTime < endTime) {
        const slotStart = new Date(currentTime)
        const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000)

        // Check if slot end time exceeds working hours
        if (slotEnd > endTime) {
          break
        }

        // Check if slot is in the past
        if (slotStart <= now) {
          currentTime = new Date(currentTime.getTime() + 15 * 60000)
          continue
        }

        // Check if slot overlaps with blocked slots
        const isBlocked = blockedSlots?.some((blocked) => {
          const blockedStart = new Date(blocked.start_datetime)
          const blockedEnd = new Date(blocked.end_datetime)
          return slotStart < blockedEnd && slotEnd > blockedStart
        })

        if (isBlocked) {
          currentTime = new Date(currentTime.getTime() + 15 * 60000)
          continue
        }

        // Check if slot overlaps with existing bookings
        const isBooked = existingBookings?.some((booking) => {
          const bookingStart = new Date(booking.start_datetime)
          const bookingEnd = new Date(booking.end_datetime)
          return slotStart < bookingEnd && slotEnd > bookingStart
        })

        if (isBooked) {
          currentTime = new Date(currentTime.getTime() + 15 * 60000)
          continue
        }

        // Slot is available
        availableSlots.push(
          slotStart.toLocaleTimeString('sr-RS', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        )

        // Move to next slot (15-minute intervals)
        currentTime = new Date(currentTime.getTime() + 15 * 60000)
      }
    }

    return NextResponse.json({ slots: availableSlots })
  } catch (error) {
    console.error('Error in GET /api/public/[slug]/availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
