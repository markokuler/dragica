'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, DollarSign, Users, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface DashboardStats {
  todayBookings: number
  upcomingBookings: number
  totalClients: number
  monthlyRevenue: number
}

interface UpcomingBooking {
  id: string
  start_datetime: string
  end_datetime: string
  status: string
  service: {
    name: string
    price: number
  }
  customer: {
    name: string | null
    phone: string
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/bookings?limit=5&upcoming=true'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setUpcomingBookings(bookingsData.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Kontrolna tabla</h1>
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kontrolna tabla</h1>
          <p className="text-muted-foreground">
            Dobrodošli nazad! Evo pregleda vašeg salona.
          </p>
        </div>
        <Link href="/dashboard/zakazivanja/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo zakazivanje
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Današnja zakazivanja
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Termina danas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Predstojeći termini
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              U narednih 7 dana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ukupno klijenata
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">
              U bazi podataka
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mesečni prihod
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.monthlyRevenue || 0).toLocaleString('sr-RS')} RSD
            </div>
            <p className="text-xs text-muted-foreground">
              Ovaj mesec
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming Bookings */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Brze akcije</CardTitle>
            <CardDescription>
              Najčešće korišćene funkcije
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/zakazivanja/novo">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Novo zakazivanje
              </Button>
            </Link>
            <Link href="/dashboard/usluge">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Dodaj uslugu
              </Button>
            </Link>
            <Link href="/dashboard/kalendar">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Pregled kalendara
              </Button>
            </Link>
            <Link href="/dashboard/finansije">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Finansijski izveštaj
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Predstojeći termini</CardTitle>
              <CardDescription>
                Naredna zakazivanja
              </CardDescription>
            </div>
            <Link href="/dashboard/zakazivanja">
              <Button variant="ghost" size="sm">
                Svi termini
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nema predstojećih termina
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {booking.customer.name || booking.customer.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.service.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(booking.start_datetime), 'HH:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.start_datetime), 'EEE, d. MMM', {
                          locale: srLatn,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
