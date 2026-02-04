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

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
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

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const supabase = createAdminClient()

    const body = await request.json()
    const { status } = body

    // Validate status
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

    // Update booking
    const updateData: any = {}
    if (status) updateData.status = status

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

      if (service) {
        await supabase.from('financial_entries').insert({
          tenant_id: tenantId,
          type: 'income',
          category: 'booking',
          amount: service.price,
          description: `Zakazivanje: ${service.name}`,
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

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const supabase = createAdminClient()

    // Instead of deleting, mark as cancelled
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
  } catch (error) {
    console.error('Error in DELETE /api/dashboard/bookings/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
