/**
 * One-time setup script for demo accounts on production
 *
 * Creates 1 admin demo + 5 owner demo slots (Nails Salon)
 *
 * Prerequisites:
 *   - Set env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Set env vars: DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, DEMO_OWNER_PASSWORD
 *   - Migration 20250210_add_demo_flag must be applied
 *
 * Usage:
 *   npx tsx scripts/setup-demo.ts
 */

import { createClient } from '@supabase/supabase-js'
import { populateDemoData, populateAdminDemoData } from '../lib/demo-data'

const DEMO_OWNER_SLOTS = 5

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DEMO_ADMIN_EMAIL',
  'DEMO_ADMIN_PASSWORD',
  'DEMO_OWNER_PASSWORD',
] as const

// Validate env vars
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}`)
    process.exit(1)
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('Setting up demo accounts...\n')

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
      console.log('   Demo admin already exists, skipping auth creation')
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
        console.log(`   Admin user ensured: ${existingAdmin.id}`)
      }
    } else {
      console.error('   Error creating admin:', adminAuthError.message)
      process.exit(1)
    }
  } else {
    console.log(`   Auth user created: ${adminAuth.user.id}`)
    await supabase.from('users').upsert({
      id: adminAuth.user.id,
      email: process.env.DEMO_ADMIN_EMAIL!,
      role: 'admin',
      tenant_id: null,
      is_demo: true,
    })
    console.log('   Admin user record created')
  }

  // 2. Create 5 demo tenants (Nails Salon)
  console.log(`\n2. Creating ${DEMO_OWNER_SLOTS} demo tenants (Nails Salon)...`)
  const tenantIds: string[] = []

  for (let i = 1; i <= DEMO_OWNER_SLOTS; i++) {
    const slug = `nails-salon-${i}`
    const email = `demo-salon-${i}@dragica.local`

    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingTenant) {
      console.log(`   Tenant ${slug} already exists: ${existingTenant.id}`)
      tenantIds.push(existingTenant.id)
      await supabase.from('tenants').update({ is_demo: true }).eq('id', existingTenant.id)
    } else {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 10)

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Nails Salon',
          slug,
          subdomain: slug,
          email,
          phone: `+38160000000${i}`,
          description: 'Profesionalni salon za negu noktiju. Manikir, pedikir, gel, nail art.',
          is_active: true,
          is_demo: true,
          accent_color: '#C17F59',
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (tenantError) {
        console.error(`   Error creating tenant ${slug}:`, tenantError.message)
        process.exit(1)
      }

      tenantIds.push(tenant.id)
      console.log(`   Tenant created: ${tenant.id} (${slug})`)
    }
  }

  // 3. Create 5 demo salon owner users
  console.log(`\n3. Creating ${DEMO_OWNER_SLOTS} demo salon owners...`)

  for (let i = 0; i < DEMO_OWNER_SLOTS; i++) {
    const ownerEmail = `demo-salon-${i + 1}@dragica.local`
    const tenantId = tenantIds[i]

    const { data: ownerAuth, error: ownerAuthError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: process.env.DEMO_OWNER_PASSWORD!,
      email_confirm: true,
      user_metadata: { role: 'client', tenant_id: tenantId },
    })

    if (ownerAuthError) {
      if (ownerAuthError.message.includes('already been registered')) {
        console.log(`   Owner ${ownerEmail} already exists, ensuring user record`)
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingOwner = users?.find(u => u.email === ownerEmail)
        if (existingOwner) {
          await supabase.from('users').upsert({
            id: existingOwner.id,
            email: ownerEmail,
            role: 'client',
            tenant_id: tenantId,
            is_demo: true,
          })
        }
      } else {
        console.error(`   Error creating owner ${ownerEmail}:`, ownerAuthError.message)
        process.exit(1)
      }
    } else {
      console.log(`   Auth user created: ${ownerAuth.user.id} (${ownerEmail})`)
      await supabase.from('users').upsert({
        id: ownerAuth.user.id,
        email: ownerEmail,
        role: 'client',
        tenant_id: tenantId,
        is_demo: true,
      })
    }
  }

  // 4. Populate admin demo data
  console.log('\n4. Populating admin demo data...')
  const adminResult = await populateAdminDemoData(supabase, tenantIds)
  console.log(`   ${adminResult.salons} salons, ${adminResult.payments} payments, ${adminResult.finances} finances, ${adminResult.messages} messages`)

  // 5. Populate salon demo data for all tenants
  console.log(`\n5. Populating salon demo data for ${DEMO_OWNER_SLOTS} tenants...`)
  for (const tenantId of tenantIds) {
    const result = await populateDemoData(supabase, tenantId)
    console.log(`   Tenant ${tenantId}: ${result.services} services, ${result.customers} customers, ${result.bookings} bookings, ${result.financialEntries} financial entries`)
  }

  console.log('\nDemo setup complete!')
  console.log(`\nDemo Admin: ${process.env.DEMO_ADMIN_EMAIL}`)
  console.log(`Demo Owners: demo-salon-1..${DEMO_OWNER_SLOTS}@dragica.local`)
  console.log(`Demo Tenants: ${tenantIds.length} Nails Salon slots`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
