import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, getEffectiveTenantId } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await getEffectiveTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant access' }, { status: 403 })
    }
    const supabase = createAdminClient()

    const body = await request.json()
    const {
      logo_url,
      accent_color,
      background_color,
      text_color,
      button_style,
      theme,
      welcome_message,
    } = body

    const { data: salon, error } = await supabase
      .from('tenants')
      .update({
        logo_url: logo_url || null,
        accent_color: accent_color || null,
        background_color: background_color || null,
        text_color: text_color || null,
        button_style: button_style || null,
        theme: theme || null,
        welcome_message: welcome_message || null,
      })
      .eq('id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating branding:', error)
      return NextResponse.json(
        { error: 'Greška pri ažuriranju brendiranja' },
        { status: 500 }
      )
    }

    return NextResponse.json({ salon })
  } catch (error) {
    console.error('Error in PUT /api/dashboard/branding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
