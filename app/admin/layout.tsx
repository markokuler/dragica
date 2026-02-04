import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Settings, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">Dragica</h1>
          <p className="text-sm text-muted-foreground">Admin Panel</p>
        </div>

        <nav className="space-y-1 px-3">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start">
              <Store className="mr-2 h-4 w-4" />
              Saloni
            </Button>
          </Link>

          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Podešavanja
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 p-3 border-t border-border">
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" className="w-full justify-start" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Odjavi se
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
