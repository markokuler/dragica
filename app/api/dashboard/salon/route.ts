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

    const { data: salon, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error || !salon) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    return NextResponse.json({ salon })
  } catch (error) {
    console.error('Error in GET /api/dashboard/salon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const supabase = createAdminClient()

    const body = await request.json()
    const { name, email, phone, description, accent_color } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Naziv, email i telefon su obavezni' },
        { status: 400 }
      )
    }

    const { data: salon, error } = await supabase
      .from('tenants')
      .update({
        name,
        email,
        phone,
        description: description || null,
        accent_color: accent_color || null,
      })
      .eq('id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating salon:', error)
      return NextResponse.json(
        { error: 'Greška pri ažuriranju salona' },
        { status: 500 }
      )
    }

    return NextResponse.json({ salon })
  } catch (error) {
    console.error('Error in PUT /api/dashboard/salon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
