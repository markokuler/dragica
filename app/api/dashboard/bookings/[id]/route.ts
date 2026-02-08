import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, getEffectiveTenantId } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(id, name, price, duration_minutes),
        customer:customers(id, name, phone)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Zakazivanje nije pronađeno' }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error in GET /api/dashboard/bookings/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { status, service_id, customer_phone, customer_name, start_datetime } = body

    // Validate status if provided
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Neispravan status' },
        { status: 400 }
      )
    }

    // Verify booking exists and belongs to this tenant
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (checkError || !existingBooking) {
      return NextResponse.json({ error: 'Zakazivanje nije pronađeno' }, { status: 404 })
    }

    // Handle customer update/creation if phone provided
    let customerId = existingBooking.customer_id
    if (customer_phone) {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('phone', customer_phone)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
        // Update customer name if provided
        if (customer_name !== undefined) {
          await supabase
            .from('customers')
            .update({ name: customer_name })
            .eq('id', customerId)
        }
      } else {
        // Create new customer
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            tenant_id: tenantId,
            phone: customer_phone,
            name: customer_name || null,
          })
          .select()
          .single()
        if (newCustomer) {
          customerId = newCustomer.id
        }
      }
    }

    // Calculate end_datetime if service or start time changed
    let endDatetime = existingBooking.end_datetime
    const serviceIdToUse = service_id || existingBooking.service_id
    const startDatetimeToUse = start_datetime || existingBooking.start_datetime

    if (service_id || start_datetime) {
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceIdToUse)
        .single()

      if (service) {
        const startDate = new Date(startDatetimeToUse)
        endDatetime = new Date(startDate.getTime() + service.duration_minutes * 60000).toISOString()
      }
    }

    // Validate working hours and conflicts if time is changing
    if (start_datetime) {
      const newStart = new Date(startDatetimeToUse)
      const newEnd = new Date(endDatetime)

      // Check working hours
      const dayOfWeek = newStart.getDay()
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

      if (!workingHours || workingHours.length === 0) {
        return NextResponse.json({ error: 'Salon ne radi na izabrani dan' }, { status: 400 })
      }

      const bookingStartMinutes = newStart.getHours() * 60 + newStart.getMinutes()
      const bookingEndMinutes = newEnd.getHours() * 60 + newEnd.getMinutes()
      const fitsInWorkingHours = workingHours.some(wh => {
        const [startH, startM] = wh.start_time.split(':').map(Number)
        const [endH, endM] = wh.end_time.split(':').map(Number)
        const whStart = startH * 60 + startM
        const whEnd = endH * 60 + endM
        return bookingStartMinutes >= whStart && bookingEndMinutes <= whEnd
      })

      if (!fitsInWorkingHours) {
        return NextResponse.json({ error: 'Izabrani termin je van radnog vremena' }, { status: 400 })
      }

      // Check blocked slots
      const { data: blockedSlots } = await supabase
        .from('blocked_slots')
        .select('id')
        .eq('tenant_id', tenantId)
        .lt('start_datetime', newEnd.toISOString())
        .gt('end_datetime', newStart.toISOString())

      if (blockedSlots && blockedSlots.length > 0) {
        return NextResponse.json({ error: 'Izabrani termin je blokiran' }, { status: 400 })
      }

      // Check conflicting bookings (exclude self)
      const { data: conflictingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('tenant_id', tenantId)
        .neq('id', id)
        .in('status', ['pending', 'confirmed'])
        .lt('start_datetime', newEnd.toISOString())
        .gt('end_datetime', newStart.toISOString())

      if (conflictingBookings && conflictingBookings.length > 0) {
        return NextResponse.json({ error: 'Termin je već zauzet' }, { status: 400 })
      }
    }

    // Build update data
    const updateData: any = {}
    if (status) updateData.status = status
    if (service_id) updateData.service_id = service_id
    if (customer_phone) updateData.customer_id = customerId
    if (start_datetime) {
      updateData.start_datetime = start_datetime
      updateData.end_datetime = endDatetime
    }

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        service:services(id, name, price, duration_minutes),
        customer:customers(id, name, phone)
      `)
      .single()

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json(
        { error: 'Greška pri ažuriranju zakazivanja' },
        { status: 500 }
      )
    }

    // If marked as completed, create financial entry
    if (status === 'completed' && existingBooking.status !== 'completed') {
      const { data: service } = await supabase
        .from('services')
        .select('price, name')
        .eq('id', existingBooking.service_id)
        .single()

      // Get customer name
      const { data: customer } = await supabase
        .from('customers')
        .select('name, phone')
        .eq('id', customerId || existingBooking.customer_id)
        .single()

      if (service) {
        const customerName = customer?.name || customer?.phone || 'Nepoznat'
        await supabase.from('financial_entries').insert({
          tenant_id: tenantId,
          type: 'income',
          category: 'booking',
          amount: service.price,
          description: `Dragica: ${service.name}, ${customerName}`,
          entry_date: new Date().toISOString().split('T')[0],
          booking_id: id,
        })
      }
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error in PUT /api/dashboard/bookings/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    // Check for permanent deletion query param
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    if (permanent) {
      // Permanently delete the booking
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('Error deleting booking:', error)
        return NextResponse.json({ error: 'Greška pri brisanju zakazivanja' }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: true })
    } else {
      // Mark as cancelled (soft delete)
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error || !booking) {
        return NextResponse.json({ error: 'Zakazivanje nije pronađeno' }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error in DELETE /api/dashboard/bookings/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
