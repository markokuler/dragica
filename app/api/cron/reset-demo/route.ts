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

    // Find the main demo tenant (created in seed.sql, slug = 'dragica-demo')
    const { data: mainTenant, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .eq('is_demo', true)
      .eq('slug', 'dragica-demo')
      .single()

    if (tenantsError || !mainTenant) {
      return NextResponse.json({ error: 'Main demo tenant not found', details: tenantsError }, { status: 404 })
    }

    const mainDemoTenantId = mainTenant.id

    // 1. Populate admin demo data (creates extra demo tenants, plans, payments, etc.)
    const adminResult = await populateAdminDemoData(supabase, mainDemoTenantId)

    // 2. Populate salon demo data for the main demo tenant
    const salonResult = await populateDemoData(supabase, mainDemoTenantId)

    return NextResponse.json({
      success: true,
      message: 'Demo data reset complete',
      salon: { tenantId: mainDemoTenantId, ...salonResult },
      admin: adminResult,
    })
  } catch (error) {
    console.error('Error in reset-demo cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
