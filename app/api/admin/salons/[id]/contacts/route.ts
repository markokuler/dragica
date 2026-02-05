import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

// Get contact history for a salon
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

    const { data: contacts, error } = await supabase
      .from('salon_contact_history')
      .select('*')
      .eq('tenant_id', id)
      .order('contact_date', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json({ contacts: contacts || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add contact to history
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
    const { contact_type, description, contact_date } = body

    if (!contact_type || !description) {
      return NextResponse.json({ error: 'Tip i opis su obavezni' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: contact, error } = await supabase
      .from('salon_contact_history')
      .insert({
        tenant_id: id,
        contact_type,
        description,
        contact_date: contact_date || new Date().toISOString(),
        created_by: userData.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: 'Greška pri dodavanju kontakta' }, { status: 500 })
    }

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons/[id]/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
