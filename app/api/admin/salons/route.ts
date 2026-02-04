import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, subdomain, email, phone, description, ownerEmail, ownerPassword } = body

    // Validate required fields
    if (!name || !slug || !subdomain || !email || !phone || !ownerEmail || !ownerPassword) {
      return NextResponse.json({ error: 'Sva obavezna polja moraju biti popunjena' }, { status: 400 })
    }

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient()

    // Check if subdomain already exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (existingTenant) {
      return NextResponse.json({ error: 'Subdomen već postoji' }, { status: 400 })
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name,
        slug,
        subdomain,
        email,
        phone,
        description: description || null,
        is_active: true,
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      return NextResponse.json({ error: 'Greška pri kreiranju salona' }, { status: 500 })
    }

    // Create owner account using Supabase admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      // Rollback: delete tenant if user creation fails
      await supabase.from('tenants').delete().eq('id', tenant.id)
      console.error('Error creating user:', authError)
      return NextResponse.json({ error: 'Greška pri kreiranju korisničkog naloga' }, { status: 500 })
    }

    // Create user record in users table
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: ownerEmail,
      role: 'client',
      tenant_id: tenant.id,
    })

    if (userError) {
      // Rollback: delete auth user and tenant
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from('tenants').delete().eq('id', tenant.id)
      console.error('Error creating user record:', userError)
      return NextResponse.json({ error: 'Greška pri kreiranju korisničkog zapisa' }, { status: 500 })
    }

    return NextResponse.json({ tenant, userId: authData.user.id }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
