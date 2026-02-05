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
  Coffee,
  CalendarCheck,
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
      {/* Logo & Branding - Pop Art Style */}
      <div className="pb-6 mb-4">
        <div className="flex items-center gap-3">
          {/* Creative Logo: Coffee cup with calendar check = assistant doing work while you relax */}
          <div className="w-14 h-14 rounded-xl bg-white border-3 border-foreground flex items-center justify-center shadow-[4px_4px_0px_#1B4332] relative overflow-visible">
            {/* Main coffee cup */}
            <Coffee className="w-6 h-6 text-primary" />
            {/* Calendar with check - work being done */}
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-md bg-success border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_#1B4332]">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            {/* Sparkles - magic touch */}
            <Sparkles className="w-3 h-3 text-secondary absolute -bottom-1 -left-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Dragica
            </h1>
            <p className="text-[10px] text-foreground/80 tracking-wide font-semibold italic">Tvoja pomoćnica</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-3 border-foreground/30">
          <p className="text-sm font-bold text-foreground truncate">{salonName}</p>
          <p className="text-xs text-foreground/60 font-medium">Aktivni salon</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href} onClick={onNavClick}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 text-sm font-bold transition-all duration-150 rounded-md group uppercase tracking-wide",
                  isActive
                    ? "bg-white text-primary border-2 border-foreground shadow-[3px_3px_0px_#1B4332]"
                    : "text-foreground/80 hover:text-foreground hover:bg-white/50 hover:shadow-[2px_2px_0px_#1B4332] border-2 border-transparent hover:border-foreground"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-all duration-150",
                  isActive ? "text-primary" : "group-hover:text-primary"
                )} />
                {item.label}
                {isActive && (
                  <span className="ml-auto w-2.5 h-2.5 rounded-full bg-accent" />
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="pt-4 mt-4 border-t-2 border-foreground/20">
        <form action="/api/auth/signout" method="POST">
          <Button
            variant="ghost"
            className="w-full justify-start h-11 text-sm font-bold text-foreground/70 hover:text-foreground hover:bg-white/30 rounded-md uppercase tracking-wide"
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
      {/* Desktop Sidebar - Sunny Yellow Pop Art */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r-3 border-foreground flex-col p-4 fixed h-screen">
        <Sidebar salonName={salonName} pathname={pathname} />
      </aside>

      {/* Main area with offset for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Mobile Header / Navbar - Pop Art */}
        <header className="md:hidden flex items-center h-16 px-4 border-b-3 border-foreground bg-sidebar text-foreground gap-3 flex-shrink-0 sticky top-0 z-50">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/30 border-2 border-foreground shadow-[2px_2px_0px_#1B4332]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col bg-sidebar border-r-3 border-foreground">
              <Sidebar salonName={salonName} pathname={pathname} onNavClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Logo */}
            <div className="w-10 h-10 rounded-lg bg-white border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_#1B4332] relative overflow-visible">
              <Coffee className="w-5 h-5 text-primary" />
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded bg-success border-2 border-foreground flex items-center justify-center">
                <CalendarCheck className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-lg font-extrabold text-foreground block leading-tight">
                Dragica
              </span>
              <span className="text-[9px] text-foreground/70 font-semibold italic">Tvoja pomoćnica</span>
            </div>
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
