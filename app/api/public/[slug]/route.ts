import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Get tenant info and services (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createAdminClient()

    // Get tenant by slug or subdomain
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, subdomain, email, phone, description, logo_url, banner_url, accent_color, background_color, text_color, button_style, theme, welcome_message, is_active')
      .or(`slug.eq.${slug},subdomain.eq.${slug}`)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    if (!tenant.is_active) {
      return NextResponse.json({ error: 'Salon trenutno ne prima zakazivanja' }, { status: 403 })
    }

    // Get active services
    const { data: services } = await supabase
      .from('services')
      .select('id, name, duration_minutes, price')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name')

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        description: tenant.description,
        logo_url: tenant.logo_url,
        banner_url: tenant.banner_url,
        accent_color: tenant.accent_color,
        background_color: tenant.background_color,
        text_color: tenant.text_color,
        button_style: tenant.button_style,
        theme: tenant.theme,
        welcome_message: tenant.welcome_message,
      },
      services: services || [],
    })
  } catch (error) {
    console.error('Error in GET /api/public/[slug]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
