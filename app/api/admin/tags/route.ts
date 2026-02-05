import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Get all available tags
export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: tags, error } = await supabase
      .from('salon_tags')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({ tags: tags || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new tag
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Naziv je obavezan' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: tag, error } = await supabase
      .from('salon_tags')
      .insert({
        name,
        color: color || '#6B7280',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Tag sa tim imenom već postoji' }, { status: 400 })
      }
      console.error('Error creating tag:', error)
      return NextResponse.json({ error: 'Greška pri kreiranju taga' }, { status: 500 })
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
