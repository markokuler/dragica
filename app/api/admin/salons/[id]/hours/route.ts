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

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: hours, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('tenant_id', id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching working hours:', error)
      return NextResponse.json({ error: 'Failed to fetch working hours' }, { status: 500 })
    }

    return NextResponse.json({ hours })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/hours:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { day_of_week, start_time, end_time } = body

    // Validate required fields
    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Sva polja su obavezna' },
        { status: 400 }
      )
    }

    // Validate day of week
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: 'Dan u nedelji mora biti između 0 i 6' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Neispravan format vremena. Koristite HH:MM' },
        { status: 400 }
      )
    }

    // Validate start < end
    if (start_time >= end_time) {
      return NextResponse.json(
        { error: 'Početak mora biti pre kraja' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Check for overlapping hours on the same day
    const { data: existingHours, error: checkError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('tenant_id', id)
      .eq('day_of_week', day_of_week)
      .eq('is_active', true)

    if (checkError) {
      console.error('Error checking existing hours:', checkError)
      return NextResponse.json(
        { error: 'Greška pri proveri postojećeg radnog vremena' },
        { status: 500 }
      )
    }

    // Check for overlaps
    if (existingHours && existingHours.length > 0) {
      for (const existing of existingHours) {
        const existingStart = existing.start_time
        const existingEnd = existing.end_time

        // Check if new time overlaps with existing
        if (
          (start_time >= existingStart && start_time < existingEnd) ||
          (end_time > existingStart && end_time <= existingEnd) ||
          (start_time <= existingStart && end_time >= existingEnd)
        ) {
          return NextResponse.json(
            { error: 'Radno vreme se preklapa sa postojećim vremenom' },
            { status: 400 }
          )
        }
      }
    }

    // Create working hours
    const { data: hour, error: hourError } = await supabase
      .from('working_hours')
      .insert({
        tenant_id: id,
        day_of_week,
        start_time,
        end_time,
        is_active: true,
      })
      .select()
      .single()

    if (hourError) {
      console.error('Error creating working hours:', hourError)
      return NextResponse.json(
        { error: 'Greška pri kreiranju radnog vremena' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hour }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons/[id]/hours:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
