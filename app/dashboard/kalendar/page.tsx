'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
import { Plus, Calendar, ChevronLeft, ChevronRight, List, Pencil, Ban, Clock, X, Trash2, Globe, UserPen } from 'lucide-react'
import { format, addDays, subDays, isSameDay, isToday, startOfDay, parseISO, isWithinInterval, isBefore, isAfter, setHours, setMinutes } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface Booking {
  id: string
  start_datetime: string
  end_datetime: string
  status: string
  manage_token: string | null
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

interface BlockedSlot {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
}

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
}

// Time slots configuration
const SLOT_INTERVAL_MINUTES = 30
const WORK_START_HOUR = 9
const WORK_END_HOUR = 20

// Generate time slots for a day (fixed working hours)
function generateTimeSlots(date: Date): { time: string; datetime: Date }[] {
  const slots = []
  for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      const slotDate = setMinutes(setHours(date, hour), minute)
      slots.push({
        time: format(slotDate, 'HH:mm'),
        datetime: slotDate,
      })
    }
  }
  return slots
}

// Check if booking is within working hours
function isBookingInWorkingHours(booking: { start_datetime: string }): boolean {
  const startTime = new Date(booking.start_datetime)
  const hour = startTime.getHours()
  return hour >= WORK_START_HOUR && hour < WORK_END_HOUR
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Učitavanje...</div>}>
      <CalendarPageContent />
    </Suspense>
  )
}

function CalendarPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null)

  // Update URL when date changes
  const updateUrlWithDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    router.replace(`${pathname}?date=${dateStr}`, { scroll: false })
  }, [router, pathname])

  // Wrapper for setSelectedDate that also updates URL
  const changeDate = useCallback((date: Date) => {
    setSelectedDate(date)
    updateUrlWithDate(date)
  }, [updateUrlWithDate])

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

  // Block slot dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockForm, setBlockForm] = useState({
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    reason: '',
  })

  // Slot detail popup
  const [selectedSlotBooking, setSelectedSlotBooking] = useState<Booking | null>(null)

  // Only bookings within working hours
  const workingHoursBookings = bookings.filter(isBookingInWorkingHours)

  const timeSlots = generateTimeSlots(selectedDate)

  // Handle URL query params for date and booking
  useEffect(() => {
    const dateParam = searchParams.get('date')
    const bookingParam = searchParams.get('booking')

    if (dateParam) {
      const parsedDate = parseISO(dateParam)
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(startOfDay(parsedDate))
      }
    }

    if (bookingParam) {
      setPendingBookingId(bookingParam)
    }
  }, [searchParams])

  // Auto-open booking detail when bookings load and we have a pending booking ID
  useEffect(() => {
    if (pendingBookingId && bookings.length > 0) {
      const booking = bookings.find(b => b.id === pendingBookingId)
      if (booking) {
        setSelectedSlotBooking(booking)
        setPendingBookingId(null)
      }
    }
  }, [pendingBookingId, bookings])

  useEffect(() => {
    fetchDayData()
  }, [selectedDate])

  useEffect(() => {
    fetchAllBookings()
  }, [statusFilter, dateFilter])

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchDayData = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const nextDayStr = format(addDays(selectedDate, 1), 'yyyy-MM-dd')

      // Fetch bookings and blocked slots in parallel
      // Note: endDate must be next day because API uses <= comparison
      const [bookingsRes, blockedRes] = await Promise.all([
        fetch(`/api/dashboard/bookings?startDate=${dateStr}&endDate=${nextDayStr}&limit=100`),
        fetch('/api/dashboard/blocked-slots'),
      ])

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data.bookings || [])
      }

      if (blockedRes.ok) {
        const data = await blockedRes.json()
        setBlockedSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Error fetching day data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllBookings = async () => {
    try {
      // Fetch bookings from today onwards by default
      const today = format(new Date(), 'yyyy-MM-dd')
      let url = `/api/dashboard/bookings?limit=100&startDate=${dateFilter || today}`
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      const response = await fetch(url)
      const data = await response.json()
      // Sort by start_datetime ascending (next booking first)
      const sorted = (data.bookings || []).sort((a: Booking, b: Booking) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      )
      setAllBookings(sorted)
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

  const openBookingDialogForSlot = (time: string) => {
    setEditingBooking(null)
    setBookingForm({
      service_id: '',
      customer_phone: '',
      customer_name: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: time,
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
    setSelectedSlotBooking(null)
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
        fetchDayData()
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

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        fetchDayData()
        fetchAllBookings()
        setSelectedSlotBooking(null)
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

  const handlePermanentDelete = (bookingId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Permanentno brisanje termina',
      description: 'Da li ste sigurni da želite da TRAJNO obrišete ovaj termin? Ova akcija se NE MOŽE poništiti i termin će biti uklonjen iz sistema.',
      action: async () => {
        try {
          const response = await fetch(`/api/dashboard/bookings/${bookingId}?permanent=true`, {
            method: 'DELETE',
          })
          if (response.ok) {
            fetchDayData()
            fetchAllBookings()
            setSelectedSlotBooking(null)
          } else {
            const data = await response.json()
            alert(data.error || 'Greška pri brisanju termina')
          }
        } catch (error) {
          console.error('Error:', error)
          alert('Greška pri brisanju termina')
        }
      },
    })
  }

  // Block slot functions
  const openBlockDialog = () => {
    const today = format(selectedDate, 'yyyy-MM-dd')
    setBlockForm({
      start_date: today,
      start_time: '09:00',
      end_date: today,
      end_time: '17:00',
      reason: '',
    })
    setBlockDialogOpen(true)
  }

  const openBlockDialogForSlot = (time: string) => {
    const today = format(selectedDate, 'yyyy-MM-dd')
    // End time = slot time + 30 min
    const [h, m] = time.split(':').map(Number)
    const endMinutes = h * 60 + m + 30
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
    const endM = String(endMinutes % 60).padStart(2, '0')
    setBlockForm({
      start_date: today,
      start_time: time,
      end_date: today,
      end_time: `${endH}:${endM}`,
      reason: '',
    })
    setBlockDialogOpen(true)
  }

  const isOnlineBooking = (b: Booking) => b.manage_token != null

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/dashboard/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_datetime: `${blockForm.start_date}T${blockForm.start_time}:00`,
          end_datetime: `${blockForm.end_date}T${blockForm.end_time}:00`,
          reason: blockForm.reason || null,
        }),
      })

      if (response.ok) {
        setBlockDialogOpen(false)
        fetchDayData()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri blokiranju termina')
      }
    } catch (error) {
      console.error('Error blocking slot:', error)
      alert('Greška pri blokiranju termina')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBlockedSlot = async (slotId: string) => {
    try {
      const response = await fetch(`/api/dashboard/blocked-slots/${slotId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchDayData()
      }
    } catch (error) {
      console.error('Error deleting blocked slot:', error)
    }
  }

  // Check if a time slot is blocked (filter by selected date first, then compare times)
  const isSlotBlocked = (slotTime: string): BlockedSlot | null => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

    for (const blocked of blockedSlots) {
      const blockStartDate = blocked.start_datetime.substring(0, 10)
      const blockEndDate = blocked.end_datetime.substring(0, 10)
      const blockStartTime = blocked.start_datetime.substring(11, 16)
      const blockEndTime = blocked.end_datetime.substring(11, 16)

      // Check if selected date is within the blocked period
      const dateInRange = selectedDateStr >= blockStartDate && selectedDateStr <= blockEndDate

      if (dateInRange) {
        // If same day block, check time range
        if (blockStartDate === blockEndDate) {
          if (slotTime >= blockStartTime && slotTime < blockEndTime) {
            return blocked
          }
        } else {
          // Multi-day block: first day from start time, last day until end time, middle days full
          if (selectedDateStr === blockStartDate && slotTime >= blockStartTime) {
            return blocked
          } else if (selectedDateStr === blockEndDate && slotTime < blockEndTime) {
            return blocked
          } else if (selectedDateStr > blockStartDate && selectedDateStr < blockEndDate) {
            return blocked
          }
        }
      }
    }
    return null
  }

  // Get booking for a time slot (parse dates to handle timezone correctly)
  const getBookingForSlot = (slotTime: string): Booking | null => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

    for (const booking of bookings) {
      // Parse ISO string to Date object (handles timezone)
      const bookingStart = new Date(booking.start_datetime)
      const bookingEnd = new Date(booking.end_datetime)

      // Format to local date and time
      const bookingDateStr = format(bookingStart, 'yyyy-MM-dd')
      const startTime = format(bookingStart, 'HH:mm')
      const endTime = format(bookingEnd, 'HH:mm')

      // Check if booking is on selected date and slot is within time range [start, end)
      if (bookingDateStr === selectedDateStr && slotTime >= startTime && slotTime < endTime) {
        return booking
      }
    }
    return null
  }

  // Check if slot is the start of a booking
  const isBookingStart = (slotTime: string, booking: Booking): boolean => {
    const bookingStart = new Date(booking.start_datetime)
    const startTime = format(bookingStart, 'HH:mm')
    return slotTime === startTime
  }

  // Glass card with neon border glow for better readability
  const getStatusStyle = (status: string) => {
    const base = 'bg-card/80 backdrop-blur-sm border-l-4'
    switch (status) {
      case 'completed':
        return `${base} border-l-status-completed shadow-[0_0_15px_rgba(0,255,136,0.2)]`
      case 'confirmed':
        return `${base} border-l-status-confirmed shadow-[0_0_15px_rgba(0,217,255,0.2)]`
      case 'cancelled':
        return `${base} border-l-status-cancelled shadow-[0_0_15px_rgba(255,51,102,0.2)]`
      case 'no_show':
        return `${base} border-l-status-noshow shadow-[0_0_15px_rgba(139,92,246,0.2)]`
      default:
        return `${base} border-l-status-pending shadow-[0_0_15px_rgba(255,184,0,0.2)]`
    }
  }

  // Keep old function for badge dots
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-status-completed'
      case 'confirmed':
        return 'bg-status-confirmed'
      case 'cancelled':
        return 'bg-status-cancelled'
      case 'no_show':
        return 'bg-status-noshow'
      default:
        return 'bg-status-pending'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Završeno'
      case 'confirmed':
        return 'Potvrđeno'
      case 'cancelled':
        return 'Otkazano'
      case 'no_show':
        return 'Nije došao'
      default:
        return 'Na čekanju'
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClass = 'inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium'
    switch (status) {
      case 'completed':
        return <span className={`${baseClass} bg-status-completed text-white`}>Završeno</span>
      case 'confirmed':
        return <span className={`${baseClass} bg-status-confirmed text-white`}>Potvrđeno</span>
      case 'cancelled':
        return <span className={`${baseClass} bg-status-cancelled text-white`}>Otkazano</span>
      case 'no_show':
        return <span className={`${baseClass} bg-status-noshow text-white`}>Nije došao</span>
      default:
        return <span className={`${baseClass} bg-status-pending text-white`}>Na čekanju</span>
    }
  }

  // Calculate booking height in slots
  const getBookingSlotCount = (booking: Booking): number => {
    return Math.ceil(booking.service.duration_minutes / SLOT_INTERVAL_MINUTES)
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Kalendar</h1>
          <p className="text-base sm:text-lg text-muted-foreground">Pregled i upravljanje terminima</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openBlockDialog} className="flex-1 sm:flex-none">
            <Ban className="mr-2 h-4 w-4" />
            Blokiraj
          </Button>
          <Button onClick={() => openBookingDialogForSlot('09:00')} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Zakaži
          </Button>
        </div>
      </div>

      <Tabs
        value={searchParams.get('tab') || 'calendar'}
        onValueChange={(tab) => {
          const dateStr = format(selectedDate, 'yyyy-MM-dd')
          router.replace(`${pathname}?date=${dateStr}&tab=${tab}`, { scroll: false })
        }}
        className="space-y-4"
      >
        <TabsList className="w-full sm:w-auto bg-transparent gap-2 p-0">
          <TabsTrigger
            value="calendar"
            className="flex-1 sm:flex-none gap-2 h-11 px-4 font-bold uppercase tracking-wide border-2 border-transparent data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-foreground data-[state=active]:shadow-[3px_3px_0px_#1B4332] data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-secondary/50"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Dnevni pregled</span>
            <span className="sm:hidden">Dan</span>
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="flex-1 sm:flex-none gap-2 h-11 px-4 font-bold uppercase tracking-wide border-2 border-transparent data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-foreground data-[state=active]:shadow-[3px_3px_0px_#1B4332] data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-secondary/50"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Evidencija</span>
            <span className="sm:hidden">Lista</span>
          </TabsTrigger>
        </TabsList>

        {/* Daily Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => changeDate(subDays(selectedDate, 1))}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => changeDate(addDays(selectedDate, 1))}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="text-center flex-1 px-4">
                  <p className={`text-lg sm:text-xl font-bold ${isToday(selectedDate) ? 'text-primary' : ''}`}>
                    {format(selectedDate, 'EEEE', { locale: srLatn })}
                  </p>
                  <p className="text-muted-foreground">
                    {format(selectedDate, 'd. MMMM yyyy', { locale: srLatn })}
                    {workingHoursBookings.length > 0 && (
                      <span className="ml-2 text-primary font-medium">
                        · {workingHoursBookings.length} {workingHoursBookings.length === 1 ? 'termin' : 'termina'}
                      </span>
                    )}
                  </p>
                </div>

                <Button
                  variant={isToday(selectedDate) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeDate(startOfDay(new Date()))}
                >
                  Danas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
              ) : (
                <div className="relative">
                  {/* Time slots grid */}
                  <div className="divide-y divide-border">
                    {timeSlots.map((slot, index) => {
                      const booking = getBookingForSlot(slot.time)
                      const blocked = isSlotBlocked(slot.time)
                      const isStart = booking && isBookingStart(slot.time, booking)
                      const slotHeight = isStart ? getBookingSlotCount(booking) : 1

                      // Skip rendering if this slot is covered by a multi-slot booking
                      if (booking && !isStart) {
                        return null
                      }

                      return (
                        <div
                          key={slot.time}
                          className={`flex items-stretch min-h-[56px] ${
                            blocked ? 'bg-muted/50' : booking ? '' : 'hover:bg-secondary/30 cursor-pointer'
                          }`}
                          style={isStart ? { minHeight: `${slotHeight * 56}px` } : undefined}
                          onClick={() => {
                            if (!booking && !blocked) {
                              openBookingDialogForSlot(slot.time)
                            }
                          }}
                        >
                          {/* Time column */}
                          <div className="w-16 sm:w-20 flex-shrink-0 p-2 sm:p-3 border-r border-border flex items-start">
                            <span className="font-mono text-sm text-muted-foreground">{slot.time}</span>
                          </div>

                          {/* Content column */}
                          <div className="flex-1 p-2 sm:p-3">
                            {blocked ? (
                              <div className="flex items-center justify-between h-full">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Ban className="h-4 w-4" />
                                  <span className="text-sm">{blocked.reason || 'Blokirano'}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteBlockedSlot(blocked.id)
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : booking && isStart ? (
                              <div
                                className={`h-full rounded-lg p-3 ${getStatusStyle(booking.status)} cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:brightness-110 border-2 border-foreground/20`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSlotBooking(booking)
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground truncate text-base">
                                      {booking.customer.name || booking.customer.phone}
                                    </p>
                                    <p className="text-base font-semibold text-primary truncate">{booking.service.name}</p>
                                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                                      {format(parseISO(booking.start_datetime), 'HH:mm')} - {format(parseISO(booking.end_datetime), 'HH:mm')}
                                      {' · '}{booking.service.duration_minutes} min
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(booking.status)} text-background`}>
                                      {getStatusText(booking.status)}
                                    </span>
                                    {isOnlineBooking(booking) ? (
                                      <span className="flex items-center gap-1 text-[10px] text-cyan-600">
                                        <Globe className="h-3 w-3" />
                                        Dragica
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <UserPen className="h-3 w-3" />
                                        Ručno
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : !blocked ? (
                              <div className="h-full flex items-center justify-between">
                                <div className="flex items-center text-muted-foreground/50">
                                  <Plus className="h-4 w-4 mr-2" />
                                  <span className="text-sm">Slobodno</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openBlockDialogForSlot(slot.time)
                                  }}
                                  title="Blokiraj ovaj termin"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 p-4 border-t border-border text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-status-pending" />
                      <span className="text-muted-foreground">Na čekanju</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-status-confirmed" />
                      <span className="text-muted-foreground">Potvrđeno</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-status-completed" />
                      <span className="text-muted-foreground">Završeno</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-muted" />
                      <span className="text-muted-foreground">Blokirano</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-border pl-4">
                      <Globe className="h-3 w-3 text-cyan-600" />
                      <span className="text-muted-foreground">Dragica (online)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserPen className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Ručno zakazano</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filteri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44">
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
                  className="w-full sm:w-44"
                />
                {(statusFilter !== 'all' || dateFilter) && (
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setStatusFilter('all'); setDateFilter('') }}>
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
                <>
                  {/* Desktop: Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Datum i vreme</TableHead>
                          <TableHead>Klijent</TableHead>
                          <TableHead>Usluga</TableHead>
                          <TableHead>Cena</TableHead>
                          <TableHead>Izvor</TableHead>
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
                            <TableCell>
                              {isOnlineBooking(booking) ? (
                                <span className="flex items-center gap-1 text-xs text-cyan-600">
                                  <Globe className="h-3.5 w-3.5" />
                                  Dragica
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <UserPen className="h-3.5 w-3.5" />
                                  Ručno
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={booking.status}
                                onValueChange={(value) => {
                                  if (value === 'cancelled') {
                                    handleCancel(booking.id)
                                  } else {
                                    handleStatusChange(booking.id, value)
                                  }
                                }}
                              >
                                <SelectTrigger className="w-36 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-status-pending" />
                                      Na čekanju
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="confirmed">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-status-confirmed" />
                                      Potvrđeno
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-status-completed" />
                                      Završeno
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="no_show">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-status-noshow" />
                                      Nije došao
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-status-cancelled" />
                                      Otkazano
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(booking)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handlePermanentDelete(booking.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile: Cards */}
                  <div className="md:hidden space-y-3">
                    {allBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`p-4 rounded-lg bg-secondary/30 border border-border`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">
                              {booking.customer.name || booking.customer.phone}
                            </p>
                            {booking.customer.name && (
                              <p className="text-sm font-mono text-muted-foreground">{booking.customer.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-3 text-sm">
                          <span className="font-mono text-primary font-bold">
                            {format(new Date(booking.start_datetime), 'HH:mm')}
                          </span>
                          <span className="text-muted-foreground">
                            {format(new Date(booking.start_datetime), 'EEE, d. MMM', { locale: srLatn })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm">{booking.service.name}</span>
                          <span className="font-bold text-primary">
                            {booking.service.price.toLocaleString('sr-RS')} RSD
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          {isOnlineBooking(booking) ? (
                            <span className="flex items-center gap-1 text-xs text-cyan-600">
                              <Globe className="h-3.5 w-3.5" />
                              Dragica (online)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <UserPen className="h-3.5 w-3.5" />
                              Ručno zakazano
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Select
                            value={booking.status}
                            onValueChange={(value) => {
                              if (value === 'cancelled') {
                                handleCancel(booking.id)
                              } else {
                                handleStatusChange(booking.id, value)
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1 h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-status-pending" />
                                  Na čekanju
                                </span>
                              </SelectItem>
                              <SelectItem value="confirmed">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-status-confirmed" />
                                  Potvrđeno
                                </span>
                              </SelectItem>
                              <SelectItem value="completed">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-status-completed" />
                                  Završeno
                                </span>
                              </SelectItem>
                              <SelectItem value="no_show">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-status-noshow" />
                                  Nije došao
                                </span>
                              </SelectItem>
                              <SelectItem value="cancelled">
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-status-cancelled" />
                                  Otkazano
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => openEditDialog(booking)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handlePermanentDelete(booking.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Detail Popup */}
      <Dialog open={!!selectedSlotBooking} onOpenChange={(open) => !open && setSelectedSlotBooking(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedSlotBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Detalji termina</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedSlotBooking.start_datetime), 'EEEE, d. MMMM yyyy', { locale: srLatn })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-mono text-lg font-bold">
                      {format(parseISO(selectedSlotBooking.start_datetime), 'HH:mm')} - {format(parseISO(selectedSlotBooking.end_datetime), 'HH:mm')}
                    </span>
                  </div>
                  <p className="font-semibold text-lg">{selectedSlotBooking.customer.name || selectedSlotBooking.customer.phone}</p>
                  {selectedSlotBooking.customer.name && (
                    <p className="text-muted-foreground font-mono">{selectedSlotBooking.customer.phone}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Usluga</span>
                  <span className="font-medium">{selectedSlotBooking.service.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trajanje</span>
                  <span className="font-medium">{selectedSlotBooking.service.duration_minutes} min</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cena</span>
                  <span className="font-bold text-primary">{selectedSlotBooking.service.price.toLocaleString('sr-RS')} RSD</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Izvor</span>
                  {isOnlineBooking(selectedSlotBooking) ? (
                    <span className="flex items-center gap-1.5 font-medium text-cyan-600">
                      <Globe className="h-4 w-4" />
                      Dragica (online)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                      <UserPen className="h-4 w-4" />
                      Ručno zakazano
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selectedSlotBooking.status}
                    onValueChange={(value) => {
                      if (value === 'cancelled') {
                        handleCancel(selectedSlotBooking.id)
                      } else {
                        handleStatusChange(selectedSlotBooking.id, value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-pending" />
                          Na čekanju
                        </span>
                      </SelectItem>
                      <SelectItem value="confirmed">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-confirmed" />
                          Potvrđeno
                        </span>
                      </SelectItem>
                      <SelectItem value="completed">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-completed" />
                          Završeno
                        </span>
                      </SelectItem>
                      <SelectItem value="no_show">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-noshow" />
                          Nije došao
                        </span>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-status-cancelled" />
                          Otkazano
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handlePermanentDelete(selectedSlotBooking.id)}
                  className="w-full sm:w-auto sm:mr-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Obriši
                </Button>
                <Button variant="outline" onClick={() => setSelectedSlotBooking(null)}>
                  Zatvori
                </Button>
                <Button onClick={() => openEditDialog(selectedSlotBooking)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Izmeni
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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

              <DialogFooter className="gap-2">
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

      {/* Block Slot Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Blokiraj termin</DialogTitle>
            <DialogDescription>
              Blokirajte vremenski period kada ne primate termine
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBlockSlot} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-start-date">Početni datum *</Label>
                <Input
                  id="block-start-date"
                  type="date"
                  value={blockForm.start_date}
                  onChange={(e) => setBlockForm({ ...blockForm, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-start-time">Početno vreme *</Label>
                <Input
                  id="block-start-time"
                  type="time"
                  value={blockForm.start_time}
                  onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-end-date">Krajnji datum *</Label>
                <Input
                  id="block-end-date"
                  type="date"
                  value={blockForm.end_date}
                  onChange={(e) => setBlockForm({ ...blockForm, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-end-time">Krajnje vreme *</Label>
                <Input
                  id="block-end-time"
                  type="time"
                  value={blockForm.end_time}
                  onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-reason">Razlog (opciono)</Label>
              <Input
                id="block-reason"
                placeholder="npr. Godišnji odmor, Slobodan dan..."
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Napomena</p>
              <p className="text-sm">
                Blokirani termini neće biti dostupni za zakazivanje klijentima.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={submitting || !blockForm.start_date || !blockForm.end_date}>
                {submitting ? 'Čuvanje...' : 'Blokiraj'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
