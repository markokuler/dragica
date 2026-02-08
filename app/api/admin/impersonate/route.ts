import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserWithRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { cookies } from 'next/headers'

const IMPERSONATE_COOKIE = 'impersonate_tenant'

// Start impersonation
export async function POST(request: NextRequest) {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenant_id } = body

    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant ID je obavezan' }, { status: 400 })
    }

    // Verify tenant exists
    const supabase = createAdminClient()
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenant_id)
      .single()

    if (error || !tenant) {
      return NextResponse.json({ error: 'Salon nije pronađen' }, { status: 404 })
    }

    // Set impersonation cookie
    const cookieStore = await cookies()
    cookieStore.set(IMPERSONATE_COOKIE, tenant_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
      path: '/',
    })

    await logAudit({
      userId: userData.id,
      action: 'impersonate',
      entityType: 'salon',
      entityId: tenant.id,
      entityName: tenant.name,
      isDemo: userData.is_demo,
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/admin/impersonate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Stop impersonation
export async function DELETE() {
  try {
    const userData = await getUserWithRole()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove impersonation cookie
    const cookieStore = await cookies()
    cookieStore.delete(IMPERSONATE_COOKIE)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/impersonate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Check impersonation status
export async function GET() {
  try {
    const userData = await getUserWithRole()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const impersonatedTenantId = cookieStore.get(IMPERSONATE_COOKIE)?.value

    if (!impersonatedTenantId) {
      return NextResponse.json({ impersonating: false })
    }

    // Get tenant info
    const supabase = createAdminClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', impersonatedTenantId)
      .single()

    return NextResponse.json({
      impersonating: !!tenant,
      tenant: tenant || null,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/impersonate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
