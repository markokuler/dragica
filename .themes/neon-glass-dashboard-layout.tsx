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
  Menu,
  Sparkles
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
      <div className="pb-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-[#8B5CF6] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
              Dragica
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Salon CRM</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-sidebar-border">
          <p className="text-sm font-medium text-foreground truncate">{salonName}</p>
          <p className="text-xs text-muted-foreground">Aktivni salon</p>
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
                  "w-full justify-start h-11 text-sm font-medium transition-all duration-300 rounded-lg group",
                  isActive
                    ? "bg-sidebar-accent text-primary neon-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-4 w-4 transition-all duration-300",
                  isActive ? "text-primary" : "group-hover:text-primary"
                )} />
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="pt-4 mt-4 border-t border-sidebar-border">
        <form action="/api/auth/signout" method="POST">
          <Button
            variant="ghost"
            className="w-full justify-start h-11 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg"
            type="submit"
          >
            <LogOut className="mr-3 h-4 w-4" />
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
      <aside className="hidden md:flex w-64 glass border-r border-sidebar-border flex-col p-4 fixed h-screen">
        <Sidebar salonName={salonName} pathname={pathname} />
      </aside>

      {/* Main area with offset for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Mobile Header / Navbar */}
        <header className="md:hidden flex items-center h-16 px-4 border-b border-border glass text-foreground gap-3 flex-shrink-0 sticky top-0 z-50">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/5">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col glass border-r border-sidebar-border">
              <Sidebar salonName={salonName} pathname={pathname} onNavClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-accent to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dragica
            </span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
