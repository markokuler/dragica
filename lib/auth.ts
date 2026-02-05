import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

const IMPERSONATE_COOKIE = 'impersonate_tenant'

export async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getUserWithRole() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Use admin client to bypass RLS for reading user role
  const adminClient = createAdminClient()
  const { data: userData, error } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user data:', error)
    return null
  }

  return userData
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireAdmin() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const userData = await getUserWithRole()

  if (!userData) {
    // User exists in auth but not in users table - go to login
    redirect('/login')
  }

  if (userData.role !== 'admin') {
    redirect('/dashboard')
  }

  return userData
}

export async function requireClient() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const userData = await getUserWithRole()

  if (!userData) {
    // User exists in auth but not in users table - go to login
    redirect('/login')
  }

  if (userData.role !== 'client') {
    redirect('/admin')
  }

  return userData
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Get effective tenant ID for dashboard operations
// Supports admin impersonation via cookie
export async function getEffectiveTenantId(): Promise<{
  tenantId: string | null
  isImpersonating: boolean
  impersonatedTenantName?: string
}> {
  const userData = await getUserWithRole()

  if (!userData) {
    return { tenantId: null, isImpersonating: false }
  }

  // Check for impersonation (admin only)
  if (userData.role === 'admin') {
    const cookieStore = await cookies()
    const impersonatedTenantId = cookieStore.get(IMPERSONATE_COOKIE)?.value

    if (impersonatedTenantId) {
      // Verify the tenant exists
      const adminClient = createAdminClient()
      const { data: tenant } = await adminClient
        .from('tenants')
        .select('id, name')
        .eq('id', impersonatedTenantId)
        .single()

      if (tenant) {
        return {
          tenantId: tenant.id,
          isImpersonating: true,
          impersonatedTenantName: tenant.name,
        }
      }
    }

    // Admin without impersonation - no tenant access
    return { tenantId: null, isImpersonating: false }
  }

  // Regular client - use their tenant
  return {
    tenantId: userData.tenant_id,
    isImpersonating: false,
  }
}

// Check if user can access dashboard (client OR impersonating admin)
export async function requireDashboardAccess() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const userData = await getUserWithRole()

  if (!userData) {
    redirect('/login')
  }

  // Client can always access
  if (userData.role === 'client') {
    return {
      user: userData,
      tenantId: userData.tenant_id,
      isImpersonating: false,
    }
  }

  // Admin needs to be impersonating
  if (userData.role === 'admin') {
    const { tenantId, isImpersonating, impersonatedTenantName } = await getEffectiveTenantId()

    if (tenantId && isImpersonating) {
      return {
        user: userData,
        tenantId,
        isImpersonating: true,
        impersonatedTenantName,
      }
    }

    // Admin not impersonating - redirect to admin
    redirect('/admin')
  }

  redirect('/login')
}
