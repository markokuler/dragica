import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, getEffectiveTenantId } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'income' or 'expense'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('financial_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    if (startDate) {
      query = query.gte('entry_date', startDate)
    }

    if (endDate) {
      query = query.lte('entry_date', endDate)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching financial entries:', error)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error in GET /api/dashboard/finances:', error)
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
    const { type, category, amount, description, entry_date } = body

    // Validate required fields
    if (!type || !category || amount === undefined || !entry_date) {
      return NextResponse.json(
        { error: 'Tip, kategorija, iznos i datum su obavezni' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: 'Tip mora biti "income" ili "expense"' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount < 0) {
      return NextResponse.json(
        { error: 'Iznos mora biti pozitivan broj' },
        { status: 400 }
      )
    }

    const { data: entry, error: entryError } = await supabase
      .from('financial_entries')
      .insert({
        tenant_id: tenantId,
        type,
        category,
        amount,
        description: description || null,
        entry_date,
      })
      .select()
      .single()

    if (entryError) {
      console.error('Error creating financial entry:', entryError)
      return NextResponse.json(
        { error: 'Greška pri kreiranju unosa' },
        { status: 500 }
      )
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/dashboard/finances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
