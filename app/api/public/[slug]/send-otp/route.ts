import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOTPCode, generateOTP, NotificationChannel } from '@/lib/infobip/client'
import { storeOTP, isRateLimited } from '@/lib/otp/store'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    const body = await request.json()
    const { phone, notification_channel } = body

    // Validate required fields
    if (!phone || !notification_channel) {
      return NextResponse.json(
        { error: 'Telefon i kanal su obavezni' },
        { status: 400 }
      )
    }

    // Validate channel
    const validChannels: NotificationChannel[] = ['whatsapp', 'viber']
    if (!validChannels.includes(notification_channel)) {
      return NextResponse.json(
        { error: 'Nevažeći kanal notifikacije' },
        { status: 400 }
      )
    }

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, is_active, name')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant || !tenant.is_active) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Check rate limiting
    const rateLimit = isRateLimited(phone, tenant.id)
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: `Previše pokušaja. Sačekajte ${rateLimit.waitMinutes} minuta.` },
        { status: 429 }
      )
    }

    // Generate OTP
    const code = generateOTP()

    // Send OTP via selected channel
    const sent = await sendOTPCode({
      to: phone,
      channel: notification_channel,
      code,
      salonName: tenant.name,
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Greška pri slanju koda. Proverite broj telefona.' },
        { status: 500 }
      )
    }

    // Store OTP
    storeOTP(phone, tenant.id, code)

    return NextResponse.json({
      message: 'Kod je poslat',
      channel: notification_channel,
    })
  } catch (error) {
    console.error('Error in POST /api/public/[slug]/send-otp:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
