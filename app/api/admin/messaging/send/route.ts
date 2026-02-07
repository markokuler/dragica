import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'
import { sendAdminMessage } from '@/lib/messaging'

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserWithRole()
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenant_id, channel, message } = await request.json()

    if (!tenant_id || !channel || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['whatsapp', 'viber'].includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get tenant phone
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('phone, name, is_demo')
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    if (!tenant.phone) {
      return NextResponse.json({ error: 'Salon nema telefon' }, { status: 400 })
    }

    // Send and log the message
    const result = await sendAdminMessage({
      tenantId: tenant_id,
      channel,
      phone: tenant.phone,
      message,
      sentBy: userData.id,
      isDemo: tenant.is_demo || false,
    })

    // Also create a contact history entry
    await supabase.from('salon_contact_history').insert({
      tenant_id: tenant_id,
      contact_type: channel,
      description: message,
      contact_date: new Date().toISOString().split('T')[0],
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Slanje neuspešno', logId: result.logId }, { status: 500 })
    }

    return NextResponse.json({ success: true, logId: result.logId })
  } catch (error) {
    console.error('Error in POST /api/admin/messaging/send:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
