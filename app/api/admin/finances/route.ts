import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get admin financial entries - demo admin sees demo entries only
    let query = supabase
      .from('admin_financial_entries')
      .select('*')
      .order('entry_date', { ascending: false })

    if (user.is_demo) {
      query = query.eq('is_demo', true)
    } else {
      query = query.eq('is_demo', false)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching admin finances:', error)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    return NextResponse.json({ entries: entries || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/finances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, category, amount, description, entry_date } = body

    if (!type || !category || amount === undefined || !entry_date) {
      return NextResponse.json({ error: 'Sva obavezna polja moraju biti popunjena' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: entry, error } = await supabase
      .from('admin_financial_entries')
      .insert({
        type,
        category,
        amount: parseFloat(amount),
        description: description || null,
        entry_date,
        is_demo: user.is_demo || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin finance entry:', error)
      return NextResponse.json({ error: 'Greška pri kreiranju unosa' }, { status: 500 })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/finances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
