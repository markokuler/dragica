import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function GET() {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const supabase = createAdminClient()

    const { data: slots, error } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('start_datetime', { ascending: false })

    if (error) {
      console.error('Error fetching blocked slots:', error)
      return NextResponse.json({ error: 'Failed to fetch blocked slots' }, { status: 500 })
    }

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error in GET /api/dashboard/blocked-slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const supabase = createAdminClient()

    const body = await request.json()
    const { start_datetime, end_datetime, reason } = body

    // Validate required fields
    if (!start_datetime || !end_datetime) {
      return NextResponse.json(
        { error: 'Početak i kraj su obavezni' },
        { status: 400 }
      )
    }

    const startDate = new Date(start_datetime)
    const endDate = new Date(end_datetime)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Neispravan format datuma' },
        { status: 400 }
      )
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Početak mora biti pre kraja' },
        { status: 400 }
      )
    }

    const { data: slot, error: slotError } = await supabase
      .from('blocked_slots')
      .insert({
        tenant_id: tenantId,
        start_datetime,
        end_datetime,
        reason: reason || null,
      })
      .select()
      .single()

    if (slotError) {
      console.error('Error creating blocked slot:', slotError)
      return NextResponse.json(
        { error: 'Greška pri blokiranju termina' },
        { status: 500 }
      )
    }

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/dashboard/blocked-slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
