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
      {/* Logo & Branding */}
      <div className="pb-4 mb-2">
        <h1 className="text-4xl font-bold text-primary tracking-wide font-serif">Dragica</h1>
        <p className="text-sm text-muted-foreground italic tracking-wide">Tvoja pomoćnica</p>

        {/* Art Deco decorative line */}
        <div className="flex items-center gap-2 mt-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="w-2 h-2 rotate-45 border border-primary/50" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <div className="mt-4 pt-4 border-t border-sidebar-border">
          <p className="text-base font-semibold text-foreground truncate">{salonName}</p>
        </div>
      </div>

      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href} onClick={onNavClick}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 text-base transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary font-semibold border-l-2 border-primary rounded-l-none"
                    : "text-secondary-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Art Deco decorative line */}
      <div className="flex items-center gap-2 py-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
      </div>

      <div className="pt-2">
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" className="w-full justify-start h-12 text-base text-secondary-foreground hover:text-primary" type="submit">
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
      <aside className="hidden md:flex w-72 bg-sidebar border-r border-sidebar-border flex-col p-5">
        <Sidebar salonName={salonName} pathname={pathname} />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header / Navbar */}
        <header className="md:hidden flex items-center h-[72px] px-4 border-b border-border bg-card text-foreground gap-3 flex-shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5 flex flex-col bg-sidebar">
              <Sidebar salonName={salonName} pathname={pathname} onNavClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-primary tracking-wide font-serif">Dragica</h1>
            <p className="text-sm text-muted-foreground italic">Tvoja pomoćnica</p>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="w-full px-4 py-6 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
