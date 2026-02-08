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
import { Calendar, DollarSign, Users, Plus, ArrowRight, ChevronDown, Search } from 'lucide-react'
import { COUNTRY_CODES, formatInternationalPhone, parseInternationalPhone } from '@/lib/phone-utils'
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
    hour: '',
    minute: '',
  })
  const [workingHours, setWorkingHours] = useState<Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }>>([])

  const [countryCode, setCountryCode] = useState('381')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // Client search state
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<Array<{ id: string; name: string | null; phone: string }>>([])
  const [showClientResults, setShowClientResults] = useState(false)
  const [searchingClients, setSearchingClients] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

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
    fetchWorkingHours()
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

  const fetchWorkingHours = async () => {
    try {
      const response = await fetch('/api/dashboard/working-hours')
      const data = await response.json()
      setWorkingHours(data.hours || [])
    } catch (error) {
      console.error('Error fetching working hours:', error)
    }
  }

  const handleClientSearch = (term: string) => {
    setClientSearch(term)
    if (searchTimeout) clearTimeout(searchTimeout)

    if (term.length < 2) {
      setClientResults([])
      setShowClientResults(false)
      return
    }

    setSearchingClients(true)
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/dashboard/clients?search=${encodeURIComponent(term)}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          setClientResults((data.clients || []).map((c: { id: string; name: string | null; phone: string }) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          })))
          setShowClientResults(true)
        }
      } catch (error) {
        console.error('Error searching clients:', error)
      } finally {
        setSearchingClients(false)
      }
    }, 300)
    setSearchTimeout(timeout)
  }

  const selectClient = (client: { id: string; name: string | null; phone: string }) => {
    const parsed = parseInternationalPhone(client.phone)
    if (parsed) {
      setCountryCode(parsed.countryCode)
      setPhoneNumber(parsed.localNumber)
    } else {
      setPhoneNumber(client.phone)
    }
    setBookingForm((prev) => ({ ...prev, customer_name: client.name || '' }))
    setClientSearch('')
    setClientResults([])
    setShowClientResults(false)
  }

  const openBookingDialog = () => {
    setBookingForm({
      service_id: '',
      customer_phone: '',
      customer_name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      hour: '',
      minute: '',
    })
    setCountryCode('381')
    setPhoneNumber('')
    setShowCountryDropdown(false)
    setClientSearch('')
    setClientResults([])
    setShowClientResults(false)
    setBookingDialogOpen(true)
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const start_datetime = `${bookingForm.date}T${bookingForm.hour.padStart(2, '0')}:${bookingForm.minute.padStart(2, '0')}:00`
      const combinedPhone = formatInternationalPhone(countryCode, phoneNumber)

      const response = await fetch('/api/dashboard/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: bookingForm.service_id,
          customer_phone: combinedPhone,
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
            <form onSubmit={handleCreateBooking} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label>Pretraga klijenta</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pretražite po imenu ili telefonu"
                    value={clientSearch}
                    onChange={(e) => handleClientSearch(e.target.value)}
                    onFocus={() => clientResults.length > 0 && setShowClientResults(true)}
                    className="pl-9"
                  />
                  {showClientResults && clientResults.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowClientResults(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border border-input bg-background shadow-md z-50">
                        {clientResults.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => selectClient(client)}
                            className="w-full px-3 py-2 text-left hover:bg-secondary/50 border-b border-border last:border-b-0"
                          >
                            <p className="font-medium text-sm">{client.name || 'Bez imena'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{client.phone}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {showClientResults && clientResults.length === 0 && clientSearch.length >= 2 && !searchingClients && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowClientResults(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-input bg-background shadow-md z-50 p-3">
                        <p className="text-sm text-muted-foreground text-center">Nema rezultata</p>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Unesite 2+ karaktera za pretragu postojećih klijenata</p>
              </div>

              <div className="space-y-1.5">
                <Label>Telefon klijenta *</Label>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="h-10 px-3 flex items-center gap-1 rounded-md border border-input bg-background text-sm min-w-[90px] justify-between hover:bg-secondary/50"
                    >
                      <span>
                        {COUNTRY_CODES.find(c => c.code === countryCode)?.flag} +{countryCode}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </button>
                    {showCountryDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCountryDropdown(false)} />
                        <div className="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-auto rounded-md border border-input bg-background shadow-md z-50">
                          {COUNTRY_CODES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCountryCode(c.code)
                                setShowCountryDropdown(false)
                              }}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-secondary/50 ${
                                countryCode === c.code ? 'bg-secondary' : ''
                              }`}
                            >
                              <span>{c.flag}</span>
                              <span className="font-medium">+{c.code}</span>
                              <span className="text-muted-foreground">{c.country}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <Input
                    type="tel"
                    placeholder="60 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Sa ili bez početne nule (060... ili 60...)</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Ime klijenta (opciono)</Label>
                <Input
                  id="name"
                  placeholder="Marija Petrović"
                  value={bookingForm.customer_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Datum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value, hour: '', minute: '' })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sat *</Label>
                  <Select
                    value={bookingForm.hour}
                    onValueChange={(value) => setBookingForm({ ...bookingForm, hour: value, minute: '00' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sat" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        if (!bookingForm.date) return null
                        const selectedDay = new Date(bookingForm.date).getDay()
                        const dayHours = workingHours.filter(wh => wh.day_of_week === selectedDay && wh.is_active)
                        if (dayHours.length === 0) return <SelectItem value="__none" disabled>Salon ne radi</SelectItem>

                        const hours = new Set<number>()
                        for (const wh of dayHours) {
                          const [startH] = wh.start_time.split(':').map(Number)
                          const [endH, endM] = wh.end_time.split(':').map(Number)
                          const lastHour = endM > 0 ? endH : endH - 1
                          for (let h = startH; h <= lastHour; h++) hours.add(h)
                        }

                        return Array.from(hours).sort((a, b) => a - b).map(h => (
                          <SelectItem key={h} value={String(h).padStart(2, '0')}>
                            {String(h).padStart(2, '0')}:00
                          </SelectItem>
                        ))
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Minuti *</Label>
                  <Select
                    value={bookingForm.minute}
                    onValueChange={(value) => setBookingForm({ ...bookingForm, minute: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '15', '30', '45'].map(m => (
                        <SelectItem key={m} value={m}>:{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedService && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{selectedService.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedService.duration_minutes} min | {selectedService.price.toLocaleString('sr-RS')} RSD
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                  Otkaži
                </Button>
                <Button type="submit" disabled={submitting || !bookingForm.service_id || !bookingForm.hour || !bookingForm.minute}>
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
