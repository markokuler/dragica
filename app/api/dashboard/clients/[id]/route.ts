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

    // Get client
    const { data: client, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Klijent nije pronađen' }, { status: 404 })
    }

    // Get booking history
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(id, name, price, duration_minutes)
      `)
      .eq('customer_id', id)
      .order('start_datetime', { ascending: false })

    // Calculate stats
    const completedBookings = bookings?.filter(b => b.status === 'completed') || []
    const totalSpent = completedBookings.reduce((sum, booking) => {
      const price = (booking.service as any)?.price || 0
      return sum + price
    }, 0)

    return NextResponse.json({
      client: {
        ...client,
        totalBookings: completedBookings.length,
        totalSpent,
        bookings: bookings || [],
      },
    })
  } catch (error) {
    console.error('Error in GET /api/dashboard/clients/[id]:', error)
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
    const { phone, name, notes } = body

    const updateData: Record<string, unknown> = { name }
    if (phone) {
      updateData.phone = phone
    }
    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    const { data: client, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Klijent nije pronađen' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error in PUT /api/dashboard/clients/[id]:', error)
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

    // Check if client has active bookings
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id)
      .in('status', ['pending', 'confirmed'])

    if (activeBookings && activeBookings > 0) {
      return NextResponse.json(
        { error: 'Ne možete obrisati klijenta sa aktivnim zakazivanjima' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.error('Error deleting client:', deleteError)
      return NextResponse.json(
        { error: 'Greška pri brisanju klijenta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/dashboard/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
