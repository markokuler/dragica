import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// Default app settings
const DEFAULT_SETTINGS = {
  default_trial_days: 14,
  default_working_hours_start: '09:00',
  default_working_hours_end: '20:00',
  default_slot_duration: 30,
  max_booking_advance_days: 90,
  reminder_hours_before: 24,
  app_name: 'Dragica',
  support_email: 'podrska@dragica.rs',
}

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Try to get settings from app_settings table
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'global')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching app settings:', error)
    }

    // Return stored settings or defaults
    return NextResponse.json({
      settings: data?.value || DEFAULT_SETTINGS,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/settings/app:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createAdminClient()

    // Validate settings
    const settings = {
      default_trial_days: body.default_trial_days || DEFAULT_SETTINGS.default_trial_days,
      default_working_hours_start: body.default_working_hours_start || DEFAULT_SETTINGS.default_working_hours_start,
      default_working_hours_end: body.default_working_hours_end || DEFAULT_SETTINGS.default_working_hours_end,
      default_slot_duration: body.default_slot_duration || DEFAULT_SETTINGS.default_slot_duration,
      max_booking_advance_days: body.max_booking_advance_days || DEFAULT_SETTINGS.max_booking_advance_days,
      reminder_hours_before: body.reminder_hours_before || DEFAULT_SETTINGS.reminder_hours_before,
      app_name: body.app_name || DEFAULT_SETTINGS.app_name,
      support_email: body.support_email || DEFAULT_SETTINGS.support_email,
    }

    // Upsert settings
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'global',
        value: settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      })

    if (error) {
      console.error('Error saving app settings:', error)
      return NextResponse.json({ error: 'Greška pri čuvanju podešavanja' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/app:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
