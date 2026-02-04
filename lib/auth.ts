import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

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
