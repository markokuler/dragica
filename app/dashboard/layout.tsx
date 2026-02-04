'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LogOut,
  Settings,
  Calendar,
  Scissors,
  Users,
  DollarSign,
  LayoutDashboard,
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Pregled', icon: LayoutDashboard },
  { href: '/dashboard/kalendar', label: 'Kalendar', icon: Calendar },
  { href: '/dashboard/usluge', label: 'Usluge', icon: Scissors },
  { href: '/dashboard/klijenti', label: 'Klijenti', icon: Users },
  { href: '/dashboard/finansije', label: 'Finansije', icon: DollarSign },
  { href: '/dashboard/podesavanja', label: 'Podešavanja', icon: Settings },
]

function Sidebar({ salonName, pathname, onNavClick }: { salonName: string; pathname: string; onNavClick?: () => void }) {
  return (
    <>
      <div className="pb-4 mb-2">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Dragica</h1>
        <p className="text-xs text-muted-foreground italic">Tvoja pomoćnica</p>
        <div className="mt-3 pt-3 border-t border-sidebar-border">
          <p className="text-sm font-medium text-foreground truncate">{salonName}</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href} onClick={onNavClick}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-11",
                  isActive
                    ? "bg-sidebar-accent text-white font-semibold"
                    : "text-secondary-foreground hover:text-white hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-sidebar-border">
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" className="w-full justify-start text-secondary-foreground hover:text-white" type="submit">
            <LogOut className="mr-3 h-5 w-5" />
            Odjavi se
          </Button>
        </form>
      </div>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [salonName, setSalonName] = useState('Moj Salon')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Fetch salon info on client side
    const fetchSalon = async () => {
      try {
        const response = await fetch('/api/dashboard/salon')
        const data = await response.json()
        if (data.salon?.name) {
          setSalonName(data.salon.name)
        }
      } catch (error) {
        console.error('Error fetching salon:', error)
      }
    }
    fetchSalon()
  }, [])

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-background border-r border-sidebar-border flex-col p-4">
        <Sidebar salonName={salonName} pathname={pathname} />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header / Navbar */}
        <header className="md:hidden flex items-center h-[72px] px-4 border-b border-border bg-card text-foreground gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col bg-background">
              <Sidebar salonName={salonName} pathname={pathname} onNavClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Dragica</h1>
            <p className="text-[10px] text-muted-foreground italic -mt-0.5">Tvoja pomoćnica</p>
          </div>
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
