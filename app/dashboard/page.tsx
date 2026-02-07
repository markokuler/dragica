'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, DollarSign, Users, Plus, ArrowRight } from 'lucide-react'
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

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([])
  const [loading, setLoading] = useState(true)

  // Booking dialog state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    service_id: '',
    customer_phone: '',
    customer_name: '',
    date: '',
    time: '',
  })

  // Service dialog state
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration_minutes: '',
    price: '',
  })

  useEffect(() => {
    fetchDashboardData()
    fetchServices()
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

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/dashboard/services')
      const data = await response.json()
      setServices((data.services || []).filter((s: Service) => s.is_active))
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const openBookingDialog = () => {
    setBookingForm({
      service_id: '',
      customer_phone: '',
      customer_name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
    })
    setBookingDialogOpen(true)
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const start_datetime = `${bookingForm.date}T${bookingForm.time}:00`

      const response = await fetch('/api/dashboard/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: bookingForm.service_id,
          customer_phone: bookingForm.customer_phone,
          customer_name: bookingForm.customer_name || null,
          start_datetime,
        }),
      })

      if (response.ok) {
        setBookingDialogOpen(false)
        fetchDashboardData()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri kreiranju zakazivanja')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Greška pri kreiranju zakazivanja')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedService = services.find((s) => s.id === bookingForm.service_id)

  const openServiceDialog = () => {
    setServiceForm({ name: '', duration_minutes: '', price: '' })
    setServiceDialogOpen(true)
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/dashboard/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceForm.name,
          duration_minutes: parseInt(serviceForm.duration_minutes),
          price: parseFloat(serviceForm.price),
        }),
      })

      if (response.ok) {
        setServiceDialogOpen(false)
        fetchServices()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri kreiranju usluge')
      }
    } catch (error) {
      console.error('Error creating service:', error)
      alert('Greška pri kreiranju usluge')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif">Tvoj pregled</h1>
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">Tvoj pregled</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Dobrodošli nazad! Evo pregleda vašeg salona.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Link href="/dashboard/kalendar">
              <Card className="cursor-pointer hover:bg-secondary/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">Zakazivanja</CardTitle>
                  <Calendar className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-base text-muted-foreground">Danas</p>
                    <div className="text-3xl font-bold font-serif text-primary">{stats?.todayBookings || 0}</div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-base text-muted-foreground">7 dana</p>
                    <div className="text-3xl font-bold font-serif">{stats?.upcomingBookings || 0}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/klijenti">
              <Card className="cursor-pointer hover:bg-secondary/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">Klijenti</CardTitle>
                  <Users className="h-5 w-5 text-chart-1" />
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-chart-1">{stats?.totalClients || 0}</div>
                  <p className="text-base text-muted-foreground">Ukupno u bazi</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Brze akcije</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" className="w-full justify-start h-11" onClick={openBookingDialog}>
                <Plus className="mr-3 h-5 w-5 flex-shrink-0" />
                Novo zakazivanje
              </Button>
              <Button variant="outline" className="w-full justify-start h-11" onClick={openServiceDialog}>
                <Plus className="mr-3 h-5 w-5 flex-shrink-0" />
                Dodaj uslugu
              </Button>
              <Link href="/dashboard/kalendar" className="block">
                <Button variant="outline" className="w-full justify-start h-11">
                  <Calendar className="mr-3 h-5 w-5 flex-shrink-0" />
                  Pregled kalendara
                </Button>
              </Link>
              <Link href="/dashboard/finansije" className="block">
                <Button variant="outline" className="w-full justify-start h-11">
                  <DollarSign className="mr-3 h-5 w-5 flex-shrink-0" />
                  Finansijski izveštaj
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Upcoming Bookings (full height) */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Predstojeći termini</CardTitle>
              <CardDescription>Naredna zakazivanja</CardDescription>
            </div>
            <Link href="/dashboard/kalendar">
              <Button variant="outline" size="sm" className="h-9">
                Svi termini
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {upcomingBookings.length === 0 ? (
              <p className="text-base text-muted-foreground text-center py-8">
                Nema predstojećih termina
              </p>
            ) : (
              <div className="divide-y divide-border">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/kalendar?date=${format(new Date(booking.start_datetime), 'yyyy-MM-dd')}&booking=${booking.id}`}
                    className="block"
                  >
                    <div className="flex items-center py-3 hover:bg-secondary/30 transition-colors cursor-pointer -mx-6 px-6">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {booking.customer.name || booking.customer.phone}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.service.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-primary font-medium">
                          {format(new Date(booking.start_datetime), 'HH:mm')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.start_datetime), 'EEE, d. MMM', {
                            locale: srLatn,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo zakazivanje</DialogTitle>
            <DialogDescription>Ručno zakazivanje termina za klijenta</DialogDescription>
          </DialogHeader>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nemate aktivnih usluga. Dodajte uslugu da biste mogli da zakazujete termine.
              </p>
              <Link href="/dashboard/usluge">
                <Button>Dodaj uslugu</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Usluga *</Label>
                <Select
                  value={bookingForm.service_id}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, service_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite uslugu" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration_minutes} min - {service.price.toLocaleString('sr-RS')} RSD)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon klijenta *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+381 60 123 4567"
                  value={bookingForm.customer_phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ime klijenta (opciono)</Label>
                <Input
                  id="name"
                  placeholder="Marija Petrović"
                  value={bookingForm.customer_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Vreme *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {selectedService && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Rezime</p>
                  <p className="font-medium">{selectedService.name}</p>
                  <p className="text-sm">
                    Trajanje: {selectedService.duration_minutes} min | Cena:{' '}
                    {selectedService.price.toLocaleString('sr-RS')} RSD
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                  Otkaži
                </Button>
                <Button type="submit" disabled={submitting || !bookingForm.service_id}>
                  {submitting ? 'Kreiranje...' : 'Zakaži termin'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* New Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova usluga</DialogTitle>
            <DialogDescription>Dodajte novu uslugu u vaš salon</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateService} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Naziv usluge *</Label>
              <Input
                id="service-name"
                placeholder="Manikir"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-duration">Trajanje (minuti) *</Label>
              <Input
                id="service-duration"
                type="number"
                min="15"
                step="15"
                placeholder="60"
                value={serviceForm.duration_minutes}
                onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-price">Cena (RSD) *</Label>
              <Input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="2000"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setServiceDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kreiranje...' : 'Dodaj uslugu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
