import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; hourId: string }> }
) {
  try {
    const { id, hourId } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify working hours belongs to this tenant
    const { data: existingHour, error: checkError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('id', hourId)
      .eq('tenant_id', id)
      .single()

    if (checkError || !existingHour) {
      return NextResponse.json({ error: 'Radno vreme nije pronađeno' }, { status: 404 })
    }

    // Delete working hours
    const { error: deleteError } = await supabase
      .from('working_hours')
      .delete()
      .eq('id', hourId)
      .eq('tenant_id', id)

    if (deleteError) {
      console.error('Error deleting working hours:', deleteError)
      return NextResponse.json(
        { error: 'Greška pri brisanju radnog vremena' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]/hours/[hourId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
