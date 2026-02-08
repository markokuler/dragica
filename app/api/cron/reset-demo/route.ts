import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { populateDemoData, populateAdminDemoData } from '@/lib/demo-data'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Find all demo tenants (5 Nails Salon slots)
    const { data: demoTenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .eq('is_demo', true)
      .order('id')

    if (tenantsError || !demoTenants || demoTenants.length === 0) {
      return NextResponse.json({ error: 'Demo tenants not found', details: tenantsError }, { status: 404 })
    }

    // 1. Populate admin demo data (protect all owner demo tenants from cleanup)
    const adminResult = await populateAdminDemoData(supabase, demoTenants.map(t => t.id))

    // 2. Populate salon demo data for ALL demo tenants
    const salonResults = []
    for (const tenant of demoTenants) {
      const result = await populateDemoData(supabase, tenant.id)
      salonResults.push({ tenantId: tenant.id, ...result })
    }

    return NextResponse.json({
      success: true,
      message: `Demo data reset complete for ${demoTenants.length} tenants`,
      salons: salonResults,
      admin: adminResult,
    })
  } catch (error) {
    console.error('Error in reset-demo cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
