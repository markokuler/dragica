'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Calendar, ChevronLeft, ChevronRight, List, Pencil } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface Booking {
  id: string
  start_datetime: string
  end_datetime: string
  status: string
  service: {
    id: string
    name: string
    price: number
    duration_minutes: number
  }
  customer: {
    id: string
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

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Booking dialog state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    service_id: '',
    customer_phone: '',
    customer_name: '',
    date: '',
    time: '',
  })

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {},
  })

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    fetchWeekBookings()
  }, [currentWeek])

  useEffect(() => {
    fetchAllBookings()
  }, [statusFilter, dateFilter])

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchWeekBookings = async () => {
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd')
      const endDate = format(weekEnd, 'yyyy-MM-dd')
      const response = await fetch(`/api/dashboard/bookings?startDate=${startDate}&endDate=${endDate}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllBookings = async () => {
    try {
      let url = '/api/dashboard/bookings?limit=100'
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      if (dateFilter) {
        url += `&startDate=${dateFilter}`
      }
      const response = await fetch(url)
      const data = await response.json()
      setAllBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
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
    setEditingBooking(null)
    setBookingForm({
      service_id: '',
      customer_phone: '',
      customer_name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
    })
    setBookingDialogOpen(true)
  }

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking)
    const startDate = new Date(booking.start_datetime)
    setBookingForm({
      service_id: booking.service.id,
      customer_phone: booking.customer.phone,
      customer_name: booking.customer.name || '',
      date: format(startDate, 'yyyy-MM-dd'),
      time: format(startDate, 'HH:mm'),
    })
    setBookingDialogOpen(true)
  }

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const start_datetime = `${bookingForm.date}T${bookingForm.time}:00`

      const url = editingBooking
        ? `/api/dashboard/bookings/${editingBooking.id}`
        : '/api/dashboard/bookings'

      const response = await fetch(url, {
        method: editingBooking ? 'PUT' : 'POST',
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
        setEditingBooking(null)
        fetchWeekBookings()
        fetchAllBookings()
      } else {
        const data = await response.json()
        alert(data.error || (editingBooking ? 'Greška pri izmeni zakazivanja' : 'Greška pri kreiranju zakazivanja'))
      }
    } catch (error) {
      console.error('Error saving booking:', error)
      alert(editingBooking ? 'Greška pri izmeni zakazivanja' : 'Greška pri kreiranju zakazivanja')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedService = services.find((s) => s.id === bookingForm.service_id)

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((b) => {
      const bookingDate = new Date(b.start_datetime)
      return isSameDay(bookingDate, day)
    })
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        fetchWeekBookings()
        fetchAllBookings()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri promeni statusa')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleCancel = (bookingId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Otkazivanje termina',
      description: 'Da li ste sigurni da želite da otkažete ovaj termin? Ova akcija se ne može poništiti.',
      action: () => handleStatusChange(bookingId, 'cancelled'),
    })
  }

  const getStatusBadge = (status: string, compact = false) => {
    const baseClass = compact
      ? 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium'
      : 'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium'

    switch (status) {
      case 'completed':
        return <span className={`${baseClass} bg-success text-white`}>{compact ? '✓' : 'Završeno'}</span>
      case 'cancelled':
        return <span className={`${baseClass} bg-destructive text-white`}>{compact ? '✗' : 'Otkazano'}</span>
      case 'confirmed':
        return <span className={`${baseClass} bg-success text-white`}>{compact ? '✓' : 'Potvrđeno'}</span>
      default:
        return <span className={`${baseClass} bg-warning text-white`}>{compact ? '?' : 'Na čekanju'}</span>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'border-l-success'
      case 'cancelled':
        return 'border-l-destructive'
      default:
        return 'border-l-warning'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kalendar</h1>
          <p className="text-muted-foreground">Pregled i upravljanje terminima</p>
        </div>
        <Button onClick={openBookingDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo zakazivanje
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Kalendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Evidencija
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(new Date())}>
                    Danas
                  </Button>
                </div>
                <CardTitle className="text-lg">
                  {format(weekStart, 'd. MMM', { locale: srLatn })} - {format(weekEnd, 'd. MMM yyyy', { locale: srLatn })}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
              ) : (
                <div className="grid grid-cols-7 border-t border-border">
                  {/* Day headers */}
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`p-2 text-center border-r border-border last:border-r-0 ${
                        isToday(day) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">{format(day, 'EEE', { locale: srLatn })}</p>
                      <p className={`text-lg font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}

                  {/* Day content */}
                  {weekDays.map((day) => {
                    const dayBookings = getBookingsForDay(day)
                    return (
                      <div
                        key={`content-${day.toISOString()}`}
                        className={`min-h-[200px] border-t border-r border-border last:border-r-0 p-1 ${
                          isToday(day) ? 'bg-primary/5' : ''
                        }`}
                      >
                        {dayBookings.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center mt-4">-</p>
                        ) : (
                          <div className="space-y-1">
                            {dayBookings.map((booking) => (
                              <div
                                key={booking.id}
                                className={`p-1.5 rounded text-xs bg-card border-l-2 ${getStatusColor(booking.status)} cursor-pointer hover:bg-secondary/50 transition-colors`}
                                title={`${booking.customer.name || booking.customer.phone} - ${booking.service.name}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-medium text-primary">
                                    {format(new Date(booking.start_datetime), 'HH:mm')}
                                  </span>
                                  {getStatusBadge(booking.status, true)}
                                </div>
                                <p className="truncate font-medium mt-0.5">
                                  {booking.customer.name || booking.customer.phone}
                                </p>
                                <p className="truncate text-muted-foreground">{booking.service.name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's bookings summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Današnji termini</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const todayBookings = bookings.filter((b) => isToday(new Date(b.start_datetime)))
                if (todayBookings.length === 0) {
                  return <p className="text-sm text-muted-foreground">Nema zakazanih termina za danas</p>
                }
                return (
                  <div className="space-y-2">
                    {todayBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-primary font-medium">
                            {format(new Date(booking.start_datetime), 'HH:mm')}
                          </span>
                          <div>
                            <p className="font-medium">{booking.customer.name || booking.customer.phone}</p>
                            <p className="text-sm text-muted-foreground">{booking.service.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditDialog(booking)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {booking.status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange(booking.id, 'confirmed')}>
                                  Potvrdi
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(booking.id, 'completed')}>
                                Završi
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filteri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi statusi</SelectItem>
                    <SelectItem value="pending">Na čekanju</SelectItem>
                    <SelectItem value="confirmed">Potvrđeno</SelectItem>
                    <SelectItem value="completed">Završeno</SelectItem>
                    <SelectItem value="cancelled">Otkazano</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-44"
                />
                {(statusFilter !== 'all' || dateFilter) && (
                  <Button variant="outline" onClick={() => { setStatusFilter('all'); setDateFilter('') }}>
                    Poništi
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sva zakazivanja</CardTitle>
              <CardDescription>{allBookings.length} termina</CardDescription>
            </CardHeader>
            <CardContent>
              {allBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nema zakazivanja</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Datum i vreme</TableHead>
                      <TableHead>Klijent</TableHead>
                      <TableHead>Usluga</TableHead>
                      <TableHead>Cena</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings.map((booking) => (
                      <TableRow key={booking.id} className="border-border">
                        <TableCell>
                          <p className="font-medium">
                            {format(new Date(booking.start_datetime), 'HH:mm')} - {format(new Date(booking.end_datetime), 'HH:mm')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.start_datetime), 'EEE, d. MMM yyyy', { locale: srLatn })}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{booking.customer.name || booking.customer.phone}</p>
                          {booking.customer.name && (
                            <p className="text-sm text-muted-foreground font-mono">{booking.customer.phone}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p>{booking.service.name}</p>
                          <p className="text-sm text-muted-foreground">{booking.service.duration_minutes} min</p>
                        </TableCell>
                        <TableCell className="text-primary font-medium">
                          {booking.service.price.toLocaleString('sr-RS')} RSD
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right">
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <Button variant="ghost" size="icon" className="mr-1" onClick={() => openEditDialog(booking)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {booking.status === 'pending' && (
                            <Button variant="outline" size="sm" className="mr-1" onClick={() => handleStatusChange(booking.id, 'confirmed')}>
                              Potvrdi
                            </Button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <>
                              <Button variant="outline" size="sm" className="mr-1" onClick={() => handleStatusChange(booking.id, 'completed')}>
                                Završi
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleCancel(booking.id)}>
                                Otkaži
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Dialog (Create/Edit) */}
      <Dialog open={bookingDialogOpen} onOpenChange={(open) => {
        setBookingDialogOpen(open)
        if (!open) setEditingBooking(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBooking ? 'Izmeni zakazivanje' : 'Novo zakazivanje'}</DialogTitle>
            <DialogDescription>
              {editingBooking ? 'Izmenite detalje termina' : 'Ručno zakazivanje termina za klijenta'}
            </DialogDescription>
          </DialogHeader>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nemate aktivnih usluga. Dodajte uslugu da biste mogli da zakazujete termine.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveBooking} className="space-y-4">
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

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                  Otkaži
                </Button>
                <Button type="submit" disabled={submitting || !bookingForm.service_id}>
                  {submitting ? 'Čuvanje...' : editingBooking ? 'Sačuvaj izmene' : 'Zakaži termin'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog.action()
                setConfirmDialog({ ...confirmDialog, open: false })
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Potvrdi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
