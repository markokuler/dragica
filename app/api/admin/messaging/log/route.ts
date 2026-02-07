import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserWithRole()
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenant_id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: messages, error } = await supabase
      .from('admin_message_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching message log:', error)
      return NextResponse.json({ error: 'Greška pri učitavanju' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/messaging/log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
