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

    const { data: slots, error } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('tenant_id', id)
      .order('start_datetime', { ascending: false })

    if (error) {
      console.error('Error fetching blocked slots:', error)
      return NextResponse.json({ error: 'Failed to fetch blocked slots' }, { status: 500 })
    }

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/blocked-slots:', error)
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
    const { start_datetime, end_datetime, reason } = body

    // Validate required fields
    if (!start_datetime || !end_datetime) {
      return NextResponse.json(
        { error: 'Početak i kraj su obavezni' },
        { status: 400 }
      )
    }

    // Validate datetime format
    const startDate = new Date(start_datetime)
    const endDate = new Date(end_datetime)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Neispravan format datuma i vremena' },
        { status: 400 }
      )
    }

    // Validate start < end
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Početak mora biti pre kraja' },
        { status: 400 }
      )
    }

    // Validate not in the past
    const now = new Date()
    if (endDate < now) {
      return NextResponse.json(
        { error: 'Ne možete blokirati vreme u prošlosti' },
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

    // Create blocked slot
    const { data: slot, error: slotError } = await supabase
      .from('blocked_slots')
      .insert({
        tenant_id: id,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
        reason: reason || null,
      })
      .select()
      .single()

    if (slotError) {
      console.error('Error creating blocked slot:', slotError)
      return NextResponse.json(
        { error: 'Greška pri kreiranju blokiranja' },
        { status: 500 }
      )
    }

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons/[id]/blocked-slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
