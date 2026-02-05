import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

// Delete contact from history
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id, contactId } = await params
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('salon_contact_history')
      .delete()
      .eq('id', contactId)
      .eq('tenant_id', id)

    if (error) {
      console.error('Error deleting contact:', error)
      return NextResponse.json({ error: 'Greška pri brisanju' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/salons/[id]/contacts/[contactId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
