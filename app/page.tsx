import { redirect } from 'next/navigation'
import { getUserWithRole } from '@/lib/auth'

export default async function Home() {
  const userData = await getUserWithRole()

  if (userData) {
    if (userData.role === 'admin') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  } else {
    redirect('/login')
  }
}
