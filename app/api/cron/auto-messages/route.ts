import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminMessage, replacePlaceholders } from '@/lib/messaging'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const results = { subscription_expiring: 0, inactivity: 0, welcome: 0, errors: 0 }

    // Load all active templates
    const { data: templates } = await supabase
      .from('admin_message_templates')
      .select('*')
      .eq('is_active', true)

    if (!templates || templates.length === 0) {
      return NextResponse.json({ success: true, message: 'No active templates', results })
    }

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // 1. Subscription expiring (expires within 7 days)
    const { data: expiringSalons } = await supabase
      .from('tenants')
      .select('id, name, phone, notification_channel, subscription_expires_at, is_demo')
      .not('notification_channel', 'is', null)
      .not('phone', 'is', null)
      .not('subscription_expires_at', 'is', null)
      .gte('subscription_expires_at', now.toISOString())
      .lte('subscription_expires_at', sevenDaysFromNow.toISOString())

    if (expiringSalons) {
      for (const salon of expiringSalons) {
        // Check if already sent in last 7 days
        const { data: recentLog } = await supabase
          .from('admin_message_log')
          .select('id')
          .eq('tenant_id', salon.id)
          .eq('trigger_type', 'subscription_expiring')
          .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        if (recentLog && recentLog.length > 0) continue

        const template = templates.find(
          t => t.trigger_type === 'subscription_expiring' && t.channel === salon.notification_channel
        )
        if (!template) continue

        const expiryDate = new Date(salon.subscription_expires_at!)
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const message = replacePlaceholders(template.message_body, {
          salon_name: salon.name,
          expiry_date: expiryDate.toLocaleDateString('sr-RS'),
          days_left: daysLeft.toString(),
        })

        const result = await sendAdminMessage({
          tenantId: salon.id,
          channel: salon.notification_channel as 'whatsapp' | 'viber',
          phone: salon.phone!,
          message,
          triggerType: 'subscription_expiring',
          templateId: template.id,
          isDemo: salon.is_demo || false,
        })

        if (result.success) results.subscription_expiring++
        else results.errors++
      }
    }

    // 2. Inactivity (no bookings in 14+ days)
    const { data: inactiveSalons } = await supabase
      .from('tenants')
      .select('id, name, phone, notification_channel, is_demo')
      .not('notification_channel', 'is', null)
      .not('phone', 'is', null)

    if (inactiveSalons) {
      for (const salon of inactiveSalons) {
        // Check last booking
        const { data: lastBooking } = await supabase
          .from('bookings')
          .select('created_at')
          .eq('tenant_id', salon.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const hasRecentBooking = lastBooking && lastBooking.length > 0 &&
          new Date(lastBooking[0].created_at) > fourteenDaysAgo

        if (hasRecentBooking) continue

        // No bookings at all is also inactivity (but only if tenant is older than 14 days)
        if (!lastBooking || lastBooking.length === 0) {
          // Skip for now — welcome covers new tenants
          continue
        }

        // Check if already sent in last 14 days
        const { data: recentLog } = await supabase
          .from('admin_message_log')
          .select('id')
          .eq('tenant_id', salon.id)
          .eq('trigger_type', 'inactivity')
          .gte('created_at', fourteenDaysAgo.toISOString())
          .limit(1)

        if (recentLog && recentLog.length > 0) continue

        const template = templates.find(
          t => t.trigger_type === 'inactivity' && t.channel === salon.notification_channel
        )
        if (!template) continue

        const message = replacePlaceholders(template.message_body, {
          salon_name: salon.name,
        })

        const result = await sendAdminMessage({
          tenantId: salon.id,
          channel: salon.notification_channel as 'whatsapp' | 'viber',
          phone: salon.phone!,
          message,
          triggerType: 'inactivity',
          templateId: template.id,
          isDemo: salon.is_demo || false,
        })

        if (result.success) results.inactivity++
        else results.errors++
      }
    }

    // 3. Welcome (created in last 24h)
    const { data: newSalons } = await supabase
      .from('tenants')
      .select('id, name, phone, notification_channel, is_demo')
      .not('notification_channel', 'is', null)
      .not('phone', 'is', null)
      .gte('created_at', twentyFourHoursAgo.toISOString())

    if (newSalons) {
      for (const salon of newSalons) {
        // Check if already sent
        const { data: recentLog } = await supabase
          .from('admin_message_log')
          .select('id')
          .eq('tenant_id', salon.id)
          .eq('trigger_type', 'welcome')
          .limit(1)

        if (recentLog && recentLog.length > 0) continue

        const template = templates.find(
          t => t.trigger_type === 'welcome' && t.channel === salon.notification_channel
        )
        if (!template) continue

        const message = replacePlaceholders(template.message_body, {
          salon_name: salon.name,
        })

        const result = await sendAdminMessage({
          tenantId: salon.id,
          channel: salon.notification_channel as 'whatsapp' | 'viber',
          phone: salon.phone!,
          message,
          triggerType: 'welcome',
          templateId: template.id,
          isDemo: salon.is_demo || false,
        })

        if (result.success) results.welcome++
        else results.errors++
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error in auto-messages cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
