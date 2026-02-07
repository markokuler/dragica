/**
 * One-time setup script for demo accounts on production
 *
 * Prerequisites:
 *   - Set env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Set env vars: DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD
 *   - Migration 20250210_add_demo_flag must be applied
 *
 * Usage:
 *   npx tsx scripts/setup-demo.ts
 */

import { createClient } from '@supabase/supabase-js'
import { populateDemoData } from '../lib/demo-data'

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DEMO_ADMIN_EMAIL',
  'DEMO_ADMIN_PASSWORD',
  'DEMO_OWNER_EMAIL',
  'DEMO_OWNER_PASSWORD',
] as const

// Validate env vars
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`)
    process.exit(1)
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('🚀 Setting up demo accounts...\n')

  // 1. Create demo admin user
  console.log('1. Creating demo admin user...')
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
    email: process.env.DEMO_ADMIN_EMAIL!,
    password: process.env.DEMO_ADMIN_PASSWORD!,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  })

  if (adminAuthError) {
    if (adminAuthError.message.includes('already been registered')) {
      console.log('   ⚠️  Demo admin already exists, skipping auth creation')
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingAdmin = users?.find(u => u.email === process.env.DEMO_ADMIN_EMAIL)
      if (existingAdmin) {
        await supabase.from('users').upsert({
          id: existingAdmin.id,
          email: process.env.DEMO_ADMIN_EMAIL!,
          role: 'admin',
          tenant_id: null,
          is_demo: true,
        })
        console.log(`   ✅ Admin user ensured: ${existingAdmin.id}`)
      }
    } else {
      console.error('   ❌ Error creating admin:', adminAuthError.message)
      process.exit(1)
    }
  } else {
    console.log(`   ✅ Auth user created: ${adminAuth.user.id}`)
    const { error: adminUserError } = await supabase.from('users').upsert({
      id: adminAuth.user.id,
      email: process.env.DEMO_ADMIN_EMAIL!,
      role: 'admin',
      tenant_id: null,
      is_demo: true,
    })
    if (adminUserError) {
      console.error('   ❌ Error creating admin user record:', adminUserError.message)
    } else {
      console.log('   ✅ Admin user record created')
    }
  }

  // 2. Create demo tenant
  console.log('\n2. Creating demo tenant...')
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'dragica-demo')
    .single()

  let tenantId: string

  if (existingTenant) {
    console.log(`   ⚠️  Demo tenant already exists: ${existingTenant.id}`)
    tenantId = existingTenant.id
    await supabase.from('tenants').update({ is_demo: true }).eq('id', tenantId)
  } else {
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 10)

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Dragica Demo Salon',
        slug: 'dragica-demo',
        subdomain: 'demo',
        email: process.env.DEMO_OWNER_EMAIL!,
        phone: '+381600000000',
        description: 'Demo salon za isprobavanje Dragica platforme. Podaci se resetuju svakog dana.',
        is_active: true,
        is_demo: true,
        accent_color: '#C17F59',
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (tenantError) {
      console.error('   ❌ Error creating tenant:', tenantError.message)
      process.exit(1)
    }

    tenantId = tenant.id
    console.log(`   ✅ Tenant created: ${tenantId}`)
  }

  // 3. Create demo salon owner user
  console.log('\n3. Creating demo salon owner...')
  const { data: ownerAuth, error: ownerAuthError } = await supabase.auth.admin.createUser({
    email: process.env.DEMO_OWNER_EMAIL!,
    password: process.env.DEMO_OWNER_PASSWORD!,
    email_confirm: true,
    user_metadata: { role: 'client', tenant_id: tenantId },
  })

  if (ownerAuthError) {
    if (ownerAuthError.message.includes('already been registered')) {
      console.log('   ⚠️  Demo owner already exists, skipping auth creation')
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingOwner = users?.find(u => u.email === process.env.DEMO_OWNER_EMAIL)
      if (existingOwner) {
        await supabase.from('users').upsert({
          id: existingOwner.id,
          email: process.env.DEMO_OWNER_EMAIL!,
          role: 'client',
          tenant_id: tenantId,
          is_demo: true,
        })
        console.log(`   ✅ Owner user ensured: ${existingOwner.id}`)
      }
    } else {
      console.error('   ❌ Error creating owner:', ownerAuthError.message)
      process.exit(1)
    }
  } else {
    console.log(`   ✅ Auth user created: ${ownerAuth.user.id}`)
    const { error: ownerUserError } = await supabase.from('users').upsert({
      id: ownerAuth.user.id,
      email: process.env.DEMO_OWNER_EMAIL!,
      role: 'client',
      tenant_id: tenantId,
      is_demo: true,
    })
    if (ownerUserError) {
      console.error('   ❌ Error creating owner user record:', ownerUserError.message)
    } else {
      console.log('   ✅ Owner user record created')
    }
  }

  // 4. Populate demo data using shared function
  console.log('\n4. Populating demo data (120 days history + 7 days future)...')
  const result = await populateDemoData(supabase, tenantId)

  console.log(`   ✅ ${result.services} services`)
  console.log(`   ✅ ${result.customers} customers`)
  console.log(`   ✅ ${result.bookings} bookings`)
  console.log(`   ✅ ${result.financialEntries} financial entries`)
  console.log(`   ✅ ${result.blockedSlots} blocked slots`)

  console.log('\n✅ Demo setup complete!')
  console.log(`\nDemo Admin: ${process.env.DEMO_ADMIN_EMAIL}`)
  console.log(`Demo Salon: ${process.env.DEMO_OWNER_EMAIL}`)
  console.log(`Demo Tenant: ${tenantId}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
