import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const body = await request.json()
    const { start_time, end_time } = body

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'Početno i krajnje vreme su obavezni' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('working_hours')
      .update({
        start_time,
        end_time,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating working hours:', error)
      return NextResponse.json(
        { error: 'Greška pri izmeni radnog vremena' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hours: data })
  } catch (error) {
    console.error('Error in PUT /api/dashboard/working-hours/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = userData.tenant_id
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('working_hours')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting working hours:', error)
      return NextResponse.json(
        { error: 'Greška pri brisanju radnog vremena' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/dashboard/working-hours/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
