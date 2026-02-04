import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
    const supabase = createAdminClient()

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, phone, email, accent_color')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_datetime,
        end_datetime,
        status,
        service:services(name, duration_minutes, price)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Zakazivanje nije pronađeno' }, { status: 404 })
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        start_datetime: booking.start_datetime,
        end_datetime: booking.end_datetime,
        service: booking.service,
        tenant: {
          name: tenant.name,
          phone: tenant.phone,
          email: tenant.email,
          accent_color: tenant.accent_color,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /api/public/[slug]/booking/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
