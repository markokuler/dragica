import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole, requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: salons, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching salons:', error)
      return NextResponse.json({ error: 'Failed to fetch salons' }, { status: 500 })
    }

    return NextResponse.json({ salons })
  } catch (error) {
    console.error('Error in GET /api/admin/salons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, subdomain, email, phone, description, ownerEmail, trialDays } = body

    // Validate required fields
    if (!name || !slug || !subdomain || !email || !phone || !ownerEmail) {
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

    // Calculate trial expiration
    const trialDuration = trialDays || 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + trialDuration)

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
        subscription_status: 'trial',
        subscription_expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      return NextResponse.json({ error: 'Greška pri kreiranju salona' }, { status: 500 })
    }

    // Check if user already exists in users table by email
    const { data: existingUserRecord } = await supabase
      .from('users')
      .select('id')
      .eq('email', ownerEmail)
      .single()

    let authUserId: string

    if (existingUserRecord) {
      // User exists in our database - delete from auth and users table
      try {
        await supabase.auth.admin.deleteUser(existingUserRecord.id)
        console.log(`Deleted existing auth user: ${ownerEmail}`)
      } catch (e) {
        console.log(`Auth user may not exist: ${ownerEmail}`)
      }
      await supabase.from('users').delete().eq('id', existingUserRecord.id)
    }

    // Also check Supabase Auth directly (in case user exists there but not in our table)
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const existingAuthUser = authUsers?.users?.find(u => u.email === ownerEmail)
      if (existingAuthUser) {
        await supabase.auth.admin.deleteUser(existingAuthUser.id)
        console.log(`Deleted orphan auth user: ${ownerEmail}`)
      }
    } catch (e) {
      console.log('Could not check for orphan auth users')
    }

    // Invite owner using Supabase admin API
    // This sends an email with a link to set their password
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dragica.app'
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(ownerEmail, {
      redirectTo: `${baseUrl}/setup`,
      data: {
        tenant_id: tenant.id,
        role: 'client',
      },
    })

    if (authError || !authData.user) {
      // Rollback: delete tenant if user creation fails
      await supabase.from('tenants').delete().eq('id', tenant.id)
      console.error('Error inviting user:', authError)
      // Return detailed error for debugging
      return NextResponse.json({
        error: `Greška pri kreiranju korisničkog naloga: ${authError?.message || 'Unknown error'}`,
        details: authError
      }, { status: 500 })
    }

    authUserId = authData.user.id

    // Create or update user record in users table
    const { error: userError } = await supabase.from('users').upsert({
      id: authUserId,
      email: ownerEmail,
      role: 'client',
      tenant_id: tenant.id,
    })

    if (userError) {
      // Rollback: delete auth user and tenant
      await supabase.auth.admin.deleteUser(authUserId)
      await supabase.from('tenants').delete().eq('id', tenant.id)
      console.error('Error creating user record:', userError)
      return NextResponse.json({ error: 'Greška pri kreiranju korisničkog zapisa' }, { status: 500 })
    }

    // Create initial subscription record (if subscription_plans table exists)
    try {
      const { data: trialPlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('is_trial', true)
        .single()

      if (trialPlan) {
        await supabase.from('tenant_subscriptions').insert({
          tenant_id: tenant.id,
          plan_id: trialPlan.id,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
          trial_days: trialDuration,
        })
      }
    } catch (subError) {
      // Subscription tables may not exist yet, skip
      console.log('Subscription tables not ready:', subError)
    }

    return NextResponse.json({ tenant, userId: authUserId }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/salons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
