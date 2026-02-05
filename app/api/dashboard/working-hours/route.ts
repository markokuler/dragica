import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, getEffectiveTenantId } from '@/lib/auth'

export async function GET() {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    const { data: hours, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching working hours:', error)
      return NextResponse.json({ error: 'Failed to fetch working hours' }, { status: 500 })
    }

    return NextResponse.json({ hours })
  } catch (error) {
    console.error('Error in GET /api/dashboard/working-hours:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Neispravan format vremena' },
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

    // Check for overlapping hours
    const { data: existingHours } = await supabase
      .from('working_hours')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('day_of_week', day_of_week)
      .eq('is_active', true)

    if (existingHours && existingHours.length > 0) {
      for (const existing of existingHours) {
        if (
          (start_time >= existing.start_time && start_time < existing.end_time) ||
          (end_time > existing.start_time && end_time <= existing.end_time) ||
          (start_time <= existing.start_time && end_time >= existing.end_time)
        ) {
          return NextResponse.json(
            { error: 'Radno vreme se preklapa sa postojećim' },
            { status: 400 }
          )
        }
      }
    }

    const { data: hour, error: hourError } = await supabase
      .from('working_hours')
      .insert({
        tenant_id: tenantId,
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
    console.error('Error in POST /api/dashboard/working-hours:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
