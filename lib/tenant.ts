import { createClient } from '@/lib/supabase/server'

export async function getTenantFromSubdomain(hostname: string): Promise<string | null> {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'

  // Remove port if present
  const cleanHostname = hostname.split(':')[0]
  const cleanBaseDomain = baseDomain.split(':')[0]

  // Check if this is a subdomain request
  if (!cleanHostname.includes('.') || cleanHostname === cleanBaseDomain) {
    return null
  }

  // Extract subdomain
  const subdomain = cleanHostname.split('.')[0]

  if (!subdomain || subdomain === 'www') {
    return null
  }

  return subdomain
}

export async function getTenantBySubdomain(subdomain: string) {
  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .single()

  if (error || !tenant) {
    return null
  }

  return tenant
}

export async function getTenantById(tenantId: string) {
  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    return null
  }

  return tenant
}

export async function getTenantBySlug(slug: string) {
  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !tenant) {
    return null
  }

  return tenant
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
