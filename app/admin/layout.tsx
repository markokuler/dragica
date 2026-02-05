'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LogOut,
  Settings,
  Store,
  LayoutDashboard,
  Menu,
  DollarSign,
  BarChart3,
  Shield,
  FileText,
  History,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import DragicaLogo from '@/components/DragicaLogo'

const navItems = [
  { href: '/admin', label: 'Pregled', icon: LayoutDashboard, exact: true },
  { href: '/admin/saloni', label: 'Saloni', icon: Store },
  { href: '/admin/finansije', label: 'Finansije', icon: DollarSign },
  { href: '/admin/izvestaji', label: 'Izveštaji', icon: FileText },
  { href: '/admin/promocije', label: 'Promocije', icon: Ticket },
  { href: '/admin/aktivnost', label: 'Aktivnost', icon: History },
  { href: '/admin/podesavanja', label: 'Podešavanja', icon: Settings },
]

function Sidebar({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
  return (
    <>
      {/* Logo & Branding - Admin Panel */}
      <div className="pb-6 mb-4">
        <div className="flex items-center gap-3">
          <DragicaLogo size="md" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Dragica
            </h1>
            <p className="text-[10px] text-foreground/80 tracking-wide font-semibold italic">Admin Panel</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-3 border-foreground/30">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <p className="text-sm font-bold text-foreground">God Mode</p>
          </div>
          <p className="text-xs text-foreground/60 font-medium">Pun pristup sistemu</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check')
        if (response.ok) {
          setIsAdmin(true)
        } else {
          window.location.href = '/login'
        }
      } catch (error) {
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <DragicaLogo size="lg" />
          <p className="mt-4 text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r-3 border-foreground flex-col p-4 fixed h-screen">
        <Sidebar pathname={pathname} />
      </aside>

      {/* Main area with offset for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center h-16 px-4 border-b-3 border-foreground bg-sidebar text-foreground gap-3 flex-shrink-0 sticky top-0 z-50">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/30 border-2 border-foreground shadow-[2px_2px_0px_#1B4332]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col bg-sidebar border-r-3 border-foreground">
              <Sidebar pathname={pathname} onNavClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0">
            <DragicaLogo size="sm" />
            <div className="min-w-0">
              <span className="text-lg font-extrabold text-foreground block leading-tight">
                Dragica
              </span>
              <span className="text-[9px] text-foreground/70 font-semibold italic">Admin Panel</span>
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
