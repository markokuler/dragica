import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const { id, slotId } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify blocked slot belongs to this tenant
    const { data: existingSlot, error: checkError } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('id', slotId)
      .eq('tenant_id', id)
      .single()

    if (checkError || !existingSlot) {
      return NextResponse.json({ error: 'Blokirani termin nije pronađen' }, { status: 404 })
    }

    // Delete blocked slot
    const { error: deleteError } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('id', slotId)
      .eq('tenant_id', id)

    if (deleteError) {
      console.error('Error deleting blocked slot:', deleteError)
      return NextResponse.json(
        { error: 'Greška pri brisanju blokiranja' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]/blocked-slots/[slotId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
