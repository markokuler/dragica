'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import DragicaLogo from '@/components/DragicaLogo'
import { format, addDays, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isBefore, isAfter, startOfDay, isSameDay } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface BookingDetails {
  id: string
  start_datetime: string
  end_datetime: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow'
  created_at: string
  service: {
    id: string
    name: string
    duration_minutes: number
    price: number
  }
  customer: {
    id: string
    name: string | null
    phone: string
  }
}

interface TenantInfo {
  name: string
  phone: string
  email: string
  slug: string
}

// Forest Pop color palette (darker variant)
const POP_COLORS = {
  background: '#E4EDE6',
  foreground: '#1B4332',
  primary: '#2D6A4F',
  secondary: '#C5E8CB',
  accent: '#E76F51',
  success: '#40916C',
  card: '#FFFFFF',
}

type ViewMode = 'details' | 'reschedule' | 'cancelled' | 'rescheduled'

export default function ManageBookingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [tenant, setTenant] = useState<TenantInfo | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('details')
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Reschedule state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

  // Date range: tomorrow to 3 months from now
  const tomorrow = addDays(startOfDay(new Date()), 1)
  const maxDate = addMonths(tomorrow, 3)

  const getMonthDays = () => {
    const start = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }

  const monthDays = getMonthDays()

  const canGoPrevMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    return isAfter(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0), tomorrow)
  }

  const canGoNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    return isBefore(nextMonth, maxDate)
  }

  const isDateSelectable = (date: Date) => {
    return !isBefore(date, tomorrow) && !isAfter(date, maxDate)
  }

  useEffect(() => {
    fetchBooking()
  }, [slug, token])

  useEffect(() => {
    if (selectedDate && booking) {
      fetchAvailableSlots()
    }
  }, [selectedDate])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/public/${slug}/manage/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Termin nije pronađen')
        return
      }

      setBooking(data.booking)
      setTenant(data.tenant)
    } catch (err) {
      setError('Greška pri učitavanju')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!booking) return

    setLoadingSlots(true)
    setAvailableSlots([])
    setSelectedTime('')

    try {
      const response = await fetch(
        `/api/public/${slug}/availability?date=${selectedDate}&serviceId=${booking.service.id}`
      )
      const data = await response.json()

      if (response.ok) {
        setAvailableSlots(data.slots || [])
      }
    } catch (err) {
      console.error('Error fetching slots:', err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const response = await fetch(`/api/public/${slug}/manage/${token}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setViewMode('cancelled')
        setShowCancelConfirm(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Greška pri otkazivanju')
      }
    } catch (err) {
      setError('Greška pri otkazivanju')
    } finally {
      setCancelling(false)
    }
  }

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return

    setRescheduling(true)
    try {
      const response = await fetch(`/api/public/${slug}/manage/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, time: selectedTime }),
      })

      if (response.ok) {
        // Refresh booking data
        await fetchBooking()
        setViewMode('rescheduled')
        setSelectedDate('')
        setSelectedTime('')
      } else {
        const data = await response.json()
        setError(data.error || 'Greška pri izmeni termina')
      }
    } catch (err) {
      setError('Greška pri izmeni termina')
    } finally {
      setRescheduling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: '#F59E0B', text: 'white', label: 'Na čekanju' },
      confirmed: { bg: '#2D6A4F', text: 'white', label: 'Potvrđen' },
      completed: { bg: '#40916C', text: 'white', label: 'Završen' },
      cancelled: { bg: '#E76F51', text: 'white', label: 'Otkazan' },
      noshow: { bg: '#8B5CF6', text: 'white', label: 'Nije došao' },
    }
    const style = styles[status] || styles.pending
    return (
      <span
        className="px-3 py-1 rounded-full text-sm font-bold border-2 border-[#1B4332]"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: POP_COLORS.background }}>
        <div className="text-center">
          <div className="mx-auto mb-4 animate-bounce">
            <DragicaLogo size="lg" />
          </div>
          <p className="text-lg font-bold" style={{ color: POP_COLORS.foreground }}>Učitavanje...</p>
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: POP_COLORS.background }}>
        <div className="max-w-md w-full bg-white border-4 border-[#1B4332] rounded-xl shadow-[8px_8px_0px_#1B4332] overflow-hidden">
          <div className="bg-[#E76F51] border-b-4 border-[#1B4332] p-6 text-center">
            <XCircle className="w-12 h-12 text-white mx-auto mb-2" />
            <h2 className="text-2xl font-extrabold text-white uppercase">Greška</h2>
          </div>
          <div className="p-6 text-center">
            <p className="font-medium mb-6" style={{ color: POP_COLORS.foreground }}>{error}</p>
            <Button
              onClick={() => router.push(`/book/${slug}`)}
              className="font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332]"
            >
              Zakaži novi termin
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!booking || !tenant) return null

  const canModify = booking.status === 'pending' || booking.status === 'confirmed'

  // Cancelled confirmation view
  if (viewMode === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: POP_COLORS.background }}>
        <div className="max-w-md w-full bg-white border-4 border-[#1B4332] rounded-xl shadow-[8px_8px_0px_#1B4332] overflow-hidden">
          <div className="bg-[#E76F51] border-b-4 border-[#1B4332] p-6 text-center">
            <XCircle className="w-16 h-16 text-white mx-auto mb-2" />
            <h1 className="text-2xl font-extrabold text-white uppercase">Termin otkazan</h1>
          </div>
          <div className="p-6 text-center space-y-4">
            <p className="font-medium text-[#1B4332]">
              Vaš termin u salonu {tenant.name} je uspešno otkazan.
            </p>
            <Button
              onClick={() => router.push(`/book/${slug}`)}
              className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332]"
            >
              Zakaži novi termin
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Rescheduled confirmation view
  if (viewMode === 'rescheduled') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: POP_COLORS.background }}>
        <div className="max-w-md w-full bg-white border-4 border-[#1B4332] rounded-xl shadow-[8px_8px_0px_#1B4332] overflow-hidden">
          <div className="bg-[#40916C] border-b-4 border-[#1B4332] p-6 text-center">
            <CheckCircle className="w-16 h-16 text-white mx-auto mb-2" />
            <h1 className="text-2xl font-extrabold text-white uppercase">Termin izmenjen!</h1>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-[#C5E8CB] border-3 border-[#1B4332] rounded-xl p-4 shadow-[4px_4px_0px_#1B4332]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#1B4332]" />
                  <span className="font-bold">
                    {format(new Date(booking.start_datetime), 'EEEE, d. MMMM yyyy', { locale: srLatn })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#1B4332]" />
                  <span className="font-bold">
                    {format(new Date(booking.start_datetime), 'HH:mm')} - {format(new Date(booking.end_datetime), 'HH:mm')}
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setViewMode('details')}
              variant="outline"
              className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] bg-white"
            >
              Nazad na detalje
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Reschedule view
  if (viewMode === 'reschedule') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: POP_COLORS.background, color: POP_COLORS.foreground }}>
        {/* Header */}
        <header className="shrink-0 px-4 py-4 border-b-4 border-[#1B4332] bg-[#C5E8CB]">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              onClick={() => { setViewMode('details'); setSelectedDate(''); setSelectedTime('') }}
              className="p-2 rounded-lg border-2 border-[#1B4332] bg-white shadow-[2px_2px_0px_#1B4332]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold">Izmena termina</h1>
              <p className="text-sm font-medium opacity-70">{booking.service.name}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-md mx-auto px-4 py-5">
            {!selectedDate ? (
              // Date selection
              <div className="space-y-4">
                <h2 className="text-xl font-extrabold text-center uppercase">Izaberite novi datum</h2>

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    disabled={!canGoPrevMonth()}
                    className="p-2 rounded-lg border-2 border-[#1B4332] bg-white disabled:opacity-30 shadow-[2px_2px_0px_#1B4332]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-bold capitalize">
                    {format(currentMonth, 'LLLL yyyy', { locale: srLatn })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    disabled={!canGoNextMonth()}
                    className="p-2 rounded-lg border-2 border-[#1B4332] bg-white disabled:opacity-30 shadow-[2px_2px_0px_#1B4332]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Calendar */}
                <div className="bg-white border-3 border-[#1B4332] rounded-xl p-4 shadow-[4px_4px_0px_#1B4332]">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((day, i) => (
                      <div key={i} className="text-center text-sm font-bold py-2 opacity-50">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const isCurrentMonth = isSameMonth(day, currentMonth)
                      const isSelectable = isDateSelectable(day)
                      const isToday = isSameDay(day, new Date())

                      return (
                        <button
                          key={dateStr}
                          onClick={() => isSelectable && isCurrentMonth && setSelectedDate(dateStr)}
                          disabled={!isSelectable || !isCurrentMonth}
                          className={`aspect-square flex items-center justify-center text-base rounded-lg font-bold
                            ${isToday ? 'bg-[#C5E8CB] border-2 border-[#1B4332]' : ''}
                            ${isSelectable && isCurrentMonth ? 'hover:bg-[#2D6A4F] hover:text-white' : ''}
                          `}
                          style={{
                            color: !isCurrentMonth || !isSelectable ? POP_COLORS.foreground + '40' : POP_COLORS.foreground,
                          }}
                        >
                          {format(day, 'd')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Time selection
              <div className="space-y-4">
                <button
                  onClick={() => { setSelectedDate(''); setSelectedTime('') }}
                  className="flex items-center gap-1 text-sm font-bold opacity-70 hover:opacity-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nazad
                </button>

                <div className="text-center">
                  <h2 className="text-xl font-extrabold uppercase">Izaberite vreme</h2>
                  <p className="text-sm font-medium opacity-60 mt-1">
                    {format(new Date(selectedDate), 'EEEE, d. MMM', { locale: srLatn })}
                  </p>
                </div>

                {loadingSlots ? (
                  <p className="text-center py-8 font-bold opacity-70">Učitavanje...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-white border-3 border-[#1B4332] rounded-xl p-6 shadow-[4px_4px_0px_#1B4332]">
                    <p className="font-bold opacity-70 mb-3">Nema dostupnih termina</p>
                    <button
                      onClick={() => setSelectedDate('')}
                      className="text-base font-bold underline"
                      style={{ color: POP_COLORS.primary }}
                    >
                      Izaberite drugi datum
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 text-base font-bold border-2 border-[#1B4332] rounded-lg transition-all shadow-[3px_3px_0px_#1B4332]
                            ${selectedTime === time ? 'bg-[#2D6A4F] text-white' : 'bg-white hover:bg-[#C5E8CB]'}
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>

                    {selectedTime && (
                      <Button
                        onClick={handleReschedule}
                        disabled={rescheduling}
                        className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] bg-[#40916C] hover:bg-[#40916C]/90"
                      >
                        {rescheduling ? 'Izmena...' : 'Potvrdi izmenu'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // Main details view
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: POP_COLORS.background, color: POP_COLORS.foreground }}>
      {/* Header */}
      <header className="shrink-0 px-4 py-4 border-b-4 border-[#1B4332] bg-[#C5E8CB]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <DragicaLogo size="sm" />
          <div className="flex-1">
            <h1 className="text-lg font-extrabold">{tenant.name}</h1>
            <p className="text-sm font-medium opacity-70">Upravljanje terminom</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-md mx-auto px-4 py-5 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg border-3 border-[#1B4332] bg-[#E76F51] text-white font-bold text-center shadow-[3px_3px_0px_#1B4332]">
              {error}
            </div>
          )}

          {/* Booking Details Card */}
          <div className="bg-white border-3 border-[#1B4332] rounded-xl shadow-[4px_4px_0px_#1B4332] overflow-hidden">
            <div className="bg-[#2D6A4F] border-b-3 border-[#1B4332] px-4 py-3">
              <h2 className="text-lg font-extrabold text-white uppercase">{booking.service.name}</h2>
              <p className="text-white/80 font-medium">{booking.service.duration_minutes} min • {booking.service.price.toLocaleString('sr-RS')} RSD</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C5E8CB] border-2 border-[#1B4332] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#1B4332]" />
                </div>
                <div>
                  <p className="font-bold">
                    {format(new Date(booking.start_datetime), 'EEEE, d. MMMM yyyy', { locale: srLatn })}
                  </p>
                  <p className="text-sm font-medium opacity-60">Datum</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C5E8CB] border-2 border-[#1B4332] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#1B4332]" />
                </div>
                <div>
                  <p className="font-bold">
                    {format(new Date(booking.start_datetime), 'HH:mm')} - {format(new Date(booking.end_datetime), 'HH:mm')}
                  </p>
                  <p className="text-sm font-medium opacity-60">Vreme</p>
                </div>
              </div>
            </div>
          </div>

          {/* Salon Contact */}
          <div className="bg-white border-3 border-[#1B4332] rounded-xl p-4 shadow-[4px_4px_0px_#1B4332]">
            <h3 className="font-bold uppercase tracking-wide text-sm mb-3">Kontakt salon</h3>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4" />
              {tenant.phone}
            </div>
            <p className="text-sm font-medium opacity-70 mt-1">{tenant.email}</p>
          </div>

          {/* Action Buttons */}
          {canModify && (
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => setViewMode('reschedule')}
                className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] bg-[#2D6A4F] hover:bg-[#2D6A4F]/90"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Izmeni termin
              </Button>

              {!showCancelConfirm ? (
                <Button
                  onClick={() => setShowCancelConfirm(true)}
                  variant="outline"
                  className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] bg-white hover:bg-[#E76F51]/10 text-[#E76F51]"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Otkaži termin
                </Button>
              ) : (
                <div className="bg-[#E76F51]/10 border-3 border-[#E76F51] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#E76F51]">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold">Da li ste sigurni?</span>
                  </div>
                  <p className="text-sm font-medium">Ova akcija se ne može poništiti.</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCancelConfirm(false)}
                      variant="outline"
                      className="flex-1 h-10 font-bold border-2 border-[#1B4332] bg-white"
                    >
                      Ne
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 h-10 font-bold border-2 border-[#1B4332] bg-[#E76F51] hover:bg-[#E76F51]/90 text-white"
                    >
                      {cancelling ? 'Otkazivanje...' : 'Da, otkaži'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!canModify && (
            <div className="bg-[#C5E8CB]/50 border-3 border-[#1B4332] rounded-xl p-4">
              <p className="font-medium text-center">
                {booking.status === 'cancelled' && 'Ovaj termin je otkazan i ne može se menjati.'}
                {booking.status === 'completed' && 'Ovaj termin je završen i ne može se menjati.'}
                {booking.status === 'noshow' && 'Ovaj termin je označen kao propušten.'}
              </p>
            </div>
          )}

          {/* Book new */}
          <Button
            onClick={() => router.push(`/book/${slug}`)}
            variant="outline"
            className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] bg-white"
          >
            Zakaži novi termin
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 py-3 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-bold opacity-50">
          <DragicaLogo size="xs" className="opacity-70" />
          Dragica — Tvoja pomoćnica
        </div>
      </footer>
    </div>
  )
}
