import { requireClient } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import {
  LogOut,
  Settings,
  Calendar,
  Scissors,
  Users,
  BookOpen,
  DollarSign,
  LayoutDashboard,
  Menu,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { href: '/dashboard', label: 'Pregled', icon: LayoutDashboard },
  { href: '/dashboard/kalendar', label: 'Kalendar', icon: Calendar },
  { href: '/dashboard/usluge', label: 'Usluge', icon: Scissors },
  { href: '/dashboard/klijenti', label: 'Klijenti', icon: Users },
  { href: '/dashboard/zakazivanja', label: 'Zakazivanja', icon: BookOpen },
  { href: '/dashboard/finansije', label: 'Finansije', icon: DollarSign },
  { href: '/dashboard/brendiranje', label: 'Brendiranje', icon: Palette },
  { href: '/dashboard/podesavanja', label: 'Podešavanja', icon: Settings },
]

function Sidebar({ salonName }: { salonName: string }) {
  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Dragica</h1>
        <p className="text-sm text-muted-foreground truncate">{salonName}</p>
      </div>

      <nav className="space-y-1 px-3 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className="w-full justify-start">
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" className="w-full justify-start" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Odjavi se
          </Button>
        </form>
      </div>
    </>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireClient()

  // Get salon info
  const supabase = createAdminClient()
  const { data: salon } = await supabase
    .from('tenants')
    .select('name, subdomain')
    .eq('id', user.tenant_id)
    .single()

  const salonName = salon?.name || 'Moj Salon'

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-border flex-col">
        <Sidebar salonName={salonName} />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar">
          <div>
            <h1 className="text-xl font-bold text-primary">Dragica</h1>
            <p className="text-xs text-muted-foreground truncate">{salonName}</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <Sidebar salonName={salonName} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
