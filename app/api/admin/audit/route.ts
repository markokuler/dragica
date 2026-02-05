import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Get audit log entries
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createAdminClient()

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (action) {
      query = query.eq('action', action)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data: entries, error, count } = await query

    if (error) {
      console.error('Error fetching audit log:', error)
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    return NextResponse.json({
      entries: entries || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/audit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Log an action (internal use)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, entity_type, entity_id, entity_name, details } = body

    if (!action || !entity_type) {
      return NextResponse.json({ error: 'Action and entity_type are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: entry, error } = await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action,
        entity_type,
        entity_id: entity_id || null,
        entity_name: entity_name || null,
        details: details || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating audit log:', error)
      return NextResponse.json({ error: 'Failed to log action' }, { status: 500 })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/audit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
