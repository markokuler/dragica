import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

interface CSVSalon {
  naziv: string
  email: string
  telefon: string
  subdomen: string
  vlasnik_email: string
  vlasnik_lozinka: string
}

function parseCSV(text: string): CSVSalon[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const salons: CSVSalon[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.length < 6) continue

    const salon: Record<string, string> = {}
    headers.forEach((header, index) => {
      salon[header] = values[index] || ''
    })

    if (salon.naziv && salon.email && salon.telefon && salon.subdomen && salon.vlasnik_email && salon.vlasnik_lozinka) {
      salons.push(salon as unknown as CSVSalon)
    }
  }

  return salons
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fajl nije učitan' }, { status: 400 })
    }

    const text = await file.text()
    const salons = parseCSV(text)

    if (salons.length === 0) {
      return NextResponse.json({ error: 'Nema validnih salona u CSV fajlu' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let imported = 0
    const errors: string[] = []

    // Default trial period
    const trialDays = 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + trialDays)

    // Get trial plan
    const { data: trialPlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('is_trial', true)
      .single()

    for (const salon of salons) {
      try {
        // Check if subdomain exists
        const { data: existing } = await supabase
          .from('tenants')
          .select('id')
          .eq('subdomain', salon.subdomen)
          .single()

        if (existing) {
          errors.push(`Subdomen "${salon.subdomen}" već postoji`)
          continue
        }

        // Create tenant
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: salon.naziv,
            slug: salon.subdomen,
            subdomain: salon.subdomen,
            email: salon.email,
            phone: salon.telefon,
            is_active: true,
            subscription_status: 'trial',
            subscription_expires_at: expiresAt.toISOString(),
          })
          .select()
          .single()

        if (tenantError || !tenant) {
          errors.push(`Greška pri kreiranju salona "${salon.naziv}": ${tenantError?.message}`)
          continue
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: salon.vlasnik_email,
          password: salon.vlasnik_lozinka,
          email_confirm: true,
        })

        if (authError || !authData.user) {
          // Rollback tenant
          await supabase.from('tenants').delete().eq('id', tenant.id)
          errors.push(`Greška pri kreiranju korisnika za "${salon.naziv}": ${authError?.message}`)
          continue
        }

        // Create user record
        const { error: userError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: salon.vlasnik_email,
          role: 'client',
          tenant_id: tenant.id,
        })

        if (userError) {
          // Rollback
          await supabase.auth.admin.deleteUser(authData.user.id)
          await supabase.from('tenants').delete().eq('id', tenant.id)
          errors.push(`Greška pri kreiranju korisničkog zapisa za "${salon.naziv}"`)
          continue
        }

        // Create subscription if plan exists
        if (trialPlan) {
          await supabase.from('tenant_subscriptions').insert({
            tenant_id: tenant.id,
            plan_id: trialPlan.id,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            status: 'active',
            trial_days: trialDays,
          })
        }

        imported++
      } catch (err) {
        errors.push(`Neočekivana greška za "${salon.naziv}"`)
      }
    }

    return NextResponse.json({
      imported,
      total: salons.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/salons/import:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
