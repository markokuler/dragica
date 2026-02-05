import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

// Get tags for a salon
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

    const { data: tenantTags, error } = await supabase
      .from('tenant_tags')
      .select(`
        id,
        tag_id,
        salon_tags (
          id,
          name,
          color
        )
      `)
      .eq('tenant_id', id)

    if (error) {
      console.error('Error fetching tenant tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    const tags = (tenantTags || []).map(tt => {
      const tag = tt.salon_tags as unknown as { id: string; name: string; color: string }
      return {
        id: tt.id,
        tag_id: tt.tag_id,
        name: tag.name,
        color: tag.color,
      }
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error in GET /api/admin/salons/[id]/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add tag to salon
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
    const { tag_id } = body

    if (!tag_id) {
      return NextResponse.json({ error: 'Tag ID je obavezan' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: tenantTag, error } = await supabase
      .from('tenant_tags')
      .insert({
        tenant_id: id,
        tag_id,
      })
      .select(`
        id,
        tag_id,
        salon_tags (
          id,
          name,
          color
        )
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Salon već ima ovaj tag' }, { status: 400 })
      }
      console.error('Error adding tag:', error)
      return NextResponse.json({ error: 'Greška pri dodavanju taga' }, { status: 500 })
    }

    const tag = tenantTag.salon_tags as unknown as { id: string; name: string; color: string }

    return NextResponse.json({
      tag: {
        id: tenantTag.id,
        tag_id: tenantTag.tag_id,
        name: tag.name,
        color: tag.color,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons/[id]/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Remove tag from salon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID je obavezan' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('tenant_tags')
      .delete()
      .eq('tenant_id', id)
      .eq('tag_id', tagId)

    if (error) {
      console.error('Error removing tag:', error)
      return NextResponse.json({ error: 'Greška pri uklanjanju taga' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
