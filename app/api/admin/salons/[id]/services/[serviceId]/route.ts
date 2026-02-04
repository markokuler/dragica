import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id, serviceId } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createAdminClient()

    // Verify service belongs to this tenant
    const { data: existingService, error: checkError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('tenant_id', id)
      .single()

    if (checkError || !existingService) {
      return NextResponse.json({ error: 'Usluga nije pronađena' }, { status: 404 })
    }

    // Prepare update object (only update provided fields)
    const updateData: any = {}

    if (body.name !== undefined) {
      updateData.name = body.name
    }

    if (body.duration_minutes !== undefined) {
      if (body.duration_minutes < 15 || body.duration_minutes % 15 !== 0) {
        return NextResponse.json(
          { error: 'Trajanje mora biti minimum 15 minuta i deljivo sa 15' },
          { status: 400 }
        )
      }
      updateData.duration_minutes = body.duration_minutes
    }

    if (body.price !== undefined) {
      if (body.price < 0) {
        return NextResponse.json(
          { error: 'Cena mora biti pozitivan broj' },
          { status: 400 }
        )
      }
      updateData.price = body.price
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }

    // Update service
    const { data: service, error: updateError } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .eq('tenant_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating service:', updateError)
      return NextResponse.json(
        { error: 'Greška pri izmeni usluge' },
        { status: 500 }
      )
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error in PUT /api/admin/salons/[id]/services/[serviceId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id, serviceId } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Check if service has active bookings
    const { count: bookingsCount, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .in('status', ['pending', 'confirmed'])

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Greška pri proveri zakazivanja' },
        { status: 500 }
      )
    }

    if (bookingsCount && bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Ne možete obrisati uslugu sa aktivnim zakazivanjima' },
        { status: 400 }
      )
    }

    // Delete service
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('tenant_id', id)

    if (deleteError) {
      console.error('Error deleting service:', deleteError)
      return NextResponse.json(
        { error: 'Greška pri brisanju usluge' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]/services/[serviceId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
