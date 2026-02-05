import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; hourId: string }> }
) {
  try {
    const { id, hourId } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createAdminClient()

    // Verify working hours belongs to this tenant
    const { data: existingHour, error: checkError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('id', hourId)
      .eq('tenant_id', id)
      .single()

    if (checkError || !existingHour) {
      return NextResponse.json({ error: 'Radno vreme nije pronađeno' }, { status: 404 })
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {}

    if (body.start_time !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(body.start_time)) {
        return NextResponse.json({ error: 'Neispravan format početka' }, { status: 400 })
      }
      updateData.start_time = body.start_time
    }

    if (body.end_time !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(body.end_time)) {
        return NextResponse.json({ error: 'Neispravan format kraja' }, { status: 400 })
      }
      updateData.end_time = body.end_time
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }

    // Validate start < end
    const startTime = (updateData.start_time as string) || existingHour.start_time
    const endTime = (updateData.end_time as string) || existingHour.end_time
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'Početak mora biti pre kraja' }, { status: 400 })
    }

    // Update working hours
    const { data: hour, error: updateError } = await supabase
      .from('working_hours')
      .update(updateData)
      .eq('id', hourId)
      .eq('tenant_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating working hours:', updateError)
      return NextResponse.json({ error: 'Greška pri izmeni radnog vremena' }, { status: 500 })
    }

    return NextResponse.json({ hour })
  } catch (error) {
    console.error('Error in PUT /api/admin/salons/[id]/hours/[hourId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; hourId: string }> }
) {
  try {
    const { id, hourId } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify working hours belongs to this tenant
    const { data: existingHour, error: checkError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('id', hourId)
      .eq('tenant_id', id)
      .single()

    if (checkError || !existingHour) {
      return NextResponse.json({ error: 'Radno vreme nije pronađeno' }, { status: 404 })
    }

    // Delete working hours
    const { error: deleteError } = await supabase
      .from('working_hours')
      .delete()
      .eq('id', hourId)
      .eq('tenant_id', id)

    if (deleteError) {
      console.error('Error deleting working hours:', deleteError)
      return NextResponse.json(
        { error: 'Greška pri brisanju radnog vremena' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]/hours/[hourId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
