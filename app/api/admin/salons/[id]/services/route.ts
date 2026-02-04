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

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/services:', error)
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
    const { name, duration_minutes, price } = body

    // Validate required fields
    if (!name || !duration_minutes || price === undefined) {
      return NextResponse.json(
        { error: 'Sva polja su obavezna' },
        { status: 400 }
      )
    }

    // Validate duration
    if (duration_minutes < 15 || duration_minutes % 15 !== 0) {
      return NextResponse.json(
        { error: 'Trajanje mora biti minimum 15 minuta i deljivo sa 15' },
        { status: 400 }
      )
    }

    // Validate price
    if (price < 0) {
      return NextResponse.json(
        { error: 'Cena mora biti pozitivan broj' },
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

    // Create service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .insert({
        tenant_id: id,
        name,
        duration_minutes,
        price,
        is_active: true,
      })
      .select()
      .single()

    if (serviceError) {
      console.error('Error creating service:', serviceError)
      return NextResponse.json(
        { error: 'Greška pri kreiranju usluge' },
        { status: 500 }
      )
    }

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons/[id]/services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
