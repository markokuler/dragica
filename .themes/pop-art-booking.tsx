'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Clock, ArrowLeft, ChevronLeft, ChevronRight, Coffee, CalendarCheck, Sparkles } from 'lucide-react'
import { format, addDays, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isBefore, isAfter, startOfDay, isSameDay } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface Tenant {
  id: string
  name: string
  email: string
  phone: string
  description: string | null
  logo_url: string | null
  accent_color: string | null
  background_color: string | null
  text_color: string | null
  button_style: string | null
  theme: string | null
  welcome_message: string | null
}

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
}

type Step = 'service' | 'date' | 'time' | 'contact'

// Pop Art color palette
const POP_COLORS = {
  background: '#FFFEF5',
  foreground: '#1A1A2E',
  primary: '#2563EB',
  secondary: '#FDE047',
  accent: '#EF4444',
  success: '#22C55E',
  card: '#FFFFFF',
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [services, setServices] = useState<Service[]>([])

  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [notificationChannel, setNotificationChannel] = useState<'whatsapp' | 'viber' | ''>('')
  const [submitting, setSubmitting] = useState(false)

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpError, setOtpError] = useState('')

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Date range: tomorrow to 3 months from now
  const tomorrow = addDays(startOfDay(new Date()), 1)
  const maxDate = addMonths(tomorrow, 3)

  // Get days for the current month view
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
    fetchTenantData()
  }, [slug])

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedService])

  const fetchTenantData = async () => {
    try {
      const response = await fetch(`/api/public/${slug}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Salon nije pronađen')
        return
      }

      setTenant(data.tenant)
      setServices(data.services)
    } catch (err) {
      setError('Greška pri učitavanju')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedService) return

    setLoadingSlots(true)
    setAvailableSlots([])
    setSelectedTime('')

    try {
      const response = await fetch(
        `/api/public/${slug}/availability?date=${selectedDate}&serviceId=${selectedService.id}`
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

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep('date')
  }

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    setStep('time')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('contact')
  }

  const handleSendOtp = async () => {
    if (!phone || !notificationChannel) {
      setOtpError('Unesite broj telefona i izaberite način obaveštenja')
      return
    }

    setSendingOtp(true)
    setOtpError('')

    try {
      const response = await fetch(`/api/public/${slug}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          notification_channel: notificationChannel,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setOtpError('')
      } else {
        setOtpError(data.error || 'Greška pri slanju koda')
      }
    } catch (err) {
      setOtpError('Greška pri slanju koda')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpCode) {
      setOtpError('Unesite verifikacioni kod')
      return
    }

    setSubmitting(true)
    setOtpError('')

    try {
      const response = await fetch(`/api/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService?.id,
          date: selectedDate,
          time: selectedTime,
          phone,
          name: name || null,
          notification_channel: notificationChannel,
          otp_code: otpCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/book/${slug}/potvrda?id=${data.bookingId}`)
      } else {
        setOtpError(data.error || 'Greška pri zakazivanju')
      }
    } catch (err) {
      setOtpError('Greška pri zakazivanju')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: POP_COLORS.background }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white border-4 border-[#1A1A2E] flex items-center justify-center shadow-[5px_5px_0px_#1A1A2E] animate-bounce relative overflow-visible">
            <Coffee className="w-10 h-10 text-[#2563EB]" />
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-[#22C55E] border-3 border-[#1A1A2E] flex items-center justify-center shadow-[2px_2px_0px_#1A1A2E]">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <Sparkles className="w-4 h-4 text-[#FDE047] absolute -bottom-1 -left-1 animate-pulse" />
          </div>
          <p className="text-lg font-bold" style={{ color: POP_COLORS.foreground }}>Učitavanje...</p>
          <p className="text-sm font-medium opacity-60 italic">Tvoja pomoćnica</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4" style={{ backgroundColor: POP_COLORS.background }}>
        <div className="text-center p-6 bg-white border-4 border-[#1A1A2E] rounded-xl shadow-[6px_6px_0px_#1A1A2E]">
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: POP_COLORS.accent }}>Greška!</h2>
          <p className="font-medium" style={{ color: POP_COLORS.foreground }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: POP_COLORS.background, color: POP_COLORS.foreground }}>
      {/* Pop Art Background Pattern */}
      <div className="fixed inset-0 dots-pattern pointer-events-none opacity-50" />

      {/* Header */}
      <header className="shrink-0 px-4 py-4 md:py-3 border-b-4 border-[#1A1A2E] bg-[#FDE047] relative z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt="Logo" className="w-12 h-12 md:w-10 md:h-10 object-contain rounded-lg border-2 border-[#1A1A2E] shadow-[2px_2px_0px_#1A1A2E]" />
          ) : (
            <div className="w-12 h-12 md:w-10 md:h-10 rounded-lg bg-white border-3 border-[#1A1A2E] flex items-center justify-center shadow-[3px_3px_0px_#1A1A2E] relative overflow-visible">
              <Coffee className="w-5 h-5 text-[#2563EB]" />
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded bg-[#22C55E] border-2 border-[#1A1A2E] flex items-center justify-center">
                <CalendarCheck className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-base font-extrabold truncate" style={{ color: POP_COLORS.foreground }}>
              {tenant?.name}
            </h1>
            {tenant?.welcome_message && (
              <p className="text-sm md:text-xs font-medium opacity-70 truncate">{tenant.welcome_message}</p>
            )}
          </div>
          {/* Progress dots */}
          <div className="flex gap-2 md:gap-1.5">
            {['service', 'date', 'time', 'contact'].map((s, i) => {
              const steps = ['service', 'date', 'time', 'contact']
              const currentIndex = steps.indexOf(step)
              const isCompleted = currentIndex > i
              const isCurrent = step === s
              return (
                <div
                  key={s}
                  className="w-3 h-3 md:w-2.5 md:h-2.5 rounded-full border-2 border-[#1A1A2E] transition-colors"
                  style={{
                    backgroundColor: isCompleted ? POP_COLORS.success : isCurrent ? POP_COLORS.primary : '#FFFFFF',
                  }}
                />
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto px-4 py-5 md:py-4">

            {/* Step 1: Service Selection */}
            {step === 'service' && (
              <div className="space-y-4 md:space-y-3">
                <div className="text-center mb-5 md:mb-4">
                  <h2 className="text-2xl md:text-xl font-extrabold uppercase tracking-wide">Izaberite uslugu</h2>
                </div>
                {services.length === 0 ? (
                  <p className="text-center font-medium py-8 opacity-70">Nema dostupnih usluga</p>
                ) : (
                  <div className="space-y-3 md:space-y-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="w-full p-4 md:p-3 rounded-lg border-3 border-[#1A1A2E] bg-white text-left transition-all shadow-[4px_4px_0px_#1A1A2E] hover:shadow-[5px_5px_0px_#1A1A2E] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base md:text-sm font-bold">{service.name}</p>
                            <p className="text-sm md:text-xs font-medium opacity-60 mt-0.5">
                              <Clock className="inline h-3.5 w-3.5 md:h-3 md:w-3 mr-1" />
                              {service.duration_minutes} min
                            </p>
                          </div>
                          <p className="text-lg md:text-base font-extrabold" style={{ color: POP_COLORS.primary }}>
                            {service.price.toLocaleString('sr-RS')} RSD
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Date Selection */}
            {step === 'date' && selectedService && (
              <div className="space-y-4 md:space-y-3">
                <button
                  onClick={() => setStep('service')}
                  className="flex items-center gap-1 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nazad
                </button>

                <div className="text-center">
                  <h2 className="text-2xl md:text-xl font-extrabold uppercase tracking-wide">Izaberite datum</h2>
                  <p className="text-sm md:text-xs font-medium opacity-60 mt-1">{selectedService.name}</p>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    disabled={!canGoPrevMonth()}
                    className="p-2 md:p-1.5 rounded-lg border-2 border-[#1A1A2E] bg-white disabled:opacity-30 shadow-[2px_2px_0px_#1A1A2E] hover:shadow-[3px_3px_0px_#1A1A2E] transition-all"
                  >
                    <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
                  </button>
                  <span className="font-bold text-base md:text-sm capitalize">
                    {format(currentMonth, 'LLLL yyyy', { locale: srLatn })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    disabled={!canGoNextMonth()}
                    className="p-2 md:p-1.5 rounded-lg border-2 border-[#1A1A2E] bg-white disabled:opacity-30 shadow-[2px_2px_0px_#1A1A2E] hover:shadow-[3px_3px_0px_#1A1A2E] transition-all"
                  >
                    <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
                  </button>
                </div>

                {/* Calendar Card */}
                <div className="bg-white border-3 border-[#1A1A2E] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A2E]">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((day, i) => (
                      <div key={i} className="text-center text-sm md:text-xs font-bold py-2 md:py-1 opacity-50">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const isCurrentMonth = isSameMonth(day, currentMonth)
                      const isSelectable = isDateSelectable(day)
                      const isToday = isSameDay(day, new Date())

                      return (
                        <button
                          key={dateStr}
                          onClick={() => isSelectable && isCurrentMonth && handleDateSelect(dateStr)}
                          disabled={!isSelectable || !isCurrentMonth}
                          className={`aspect-square flex items-center justify-center text-base md:text-sm rounded-lg transition-all disabled:cursor-not-allowed font-bold
                            ${isToday ? 'bg-[#FDE047] border-2 border-[#1A1A2E]' : ''}
                            ${isSelectable && isCurrentMonth ? 'hover:bg-[#2563EB] hover:text-white' : ''}
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
            )}

            {/* Step 3: Time Selection */}
            {step === 'time' && selectedService && selectedDate && (
              <div className="space-y-4 md:space-y-3">
                <button
                  onClick={() => { setSelectedTime(''); setStep('date') }}
                  className="flex items-center gap-1 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nazad
                </button>

                <div className="text-center">
                  <h2 className="text-2xl md:text-xl font-extrabold uppercase tracking-wide">Izaberite vreme</h2>
                  <p className="text-sm md:text-xs font-medium opacity-60 mt-1">
                    {format(new Date(selectedDate), 'EEEE, d. MMM', { locale: srLatn })}
                  </p>
                </div>

                {loadingSlots ? (
                  <p className="text-center py-8 font-bold opacity-70">Učitavanje...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-white border-3 border-[#1A1A2E] rounded-xl p-6 shadow-[4px_4px_0px_#1A1A2E]">
                    <p className="font-bold opacity-70 mb-3">Nema dostupnih termina</p>
                    <button
                      onClick={() => setStep('date')}
                      className="text-base md:text-sm font-bold underline"
                      style={{ color: POP_COLORS.primary }}
                    >
                      Izaberite drugi datum
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className="py-3.5 md:py-2.5 text-base md:text-sm font-bold border-2 border-[#1A1A2E] bg-white rounded-lg transition-all shadow-[3px_3px_0px_#1A1A2E] hover:shadow-[4px_4px_0px_#1A1A2E] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[1px_1px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Contact Info */}
            {step === 'contact' && selectedService && selectedDate && selectedTime && (
              <div className="space-y-4 md:space-y-3">
                <button
                  onClick={() => setStep('time')}
                  className="flex items-center gap-1 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nazad
                </button>

                {/* Summary */}
                <div className="p-4 md:p-3 rounded-xl bg-[#FDE047] border-3 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E]">
                  <div className="flex items-center justify-between">
                    <span className="text-base md:text-sm font-bold">{selectedService.name}</span>
                    <span className="text-base md:text-sm font-extrabold" style={{ color: POP_COLORS.primary }}>
                      {selectedService.price.toLocaleString('sr-RS')} RSD
                    </span>
                  </div>
                  <p className="text-sm md:text-xs font-medium opacity-70 mt-1">
                    {format(new Date(selectedDate), 'EEE, d. MMM', { locale: srLatn })} u {selectedTime}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-3">
                  {/* Phone & Name */}
                  <div className="space-y-3 md:space-y-2 md:grid md:grid-cols-2 md:gap-3">
                    <div>
                      <label className="text-sm md:text-xs font-bold uppercase tracking-wide mb-1.5 md:mb-1 block">Telefon *</label>
                      <Input
                        type="tel"
                        placeholder="+381 60 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={otpSent}
                        className="h-12 md:h-10 text-base md:text-sm border-2 border-[#1A1A2E] bg-white shadow-[3px_3px_0px_#1A1A2E] font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-sm md:text-xs font-bold uppercase tracking-wide mb-1.5 md:mb-1 block">Ime (opciono)</label>
                      <Input
                        placeholder="Vaše ime"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={otpSent}
                        className="h-12 md:h-10 text-base md:text-sm border-2 border-[#1A1A2E] bg-white shadow-[3px_3px_0px_#1A1A2E] font-medium"
                      />
                    </div>
                  </div>

                  {/* Channel Selection */}
                  <div>
                    <label className="text-sm md:text-xs font-bold uppercase tracking-wide mb-2 md:mb-1.5 block">Pošalji kod putem *</label>
                    <div className="grid grid-cols-2 gap-3 md:gap-2">
                      <button
                        type="button"
                        onClick={() => !otpSent && setNotificationChannel('whatsapp')}
                        disabled={otpSent}
                        className={`flex items-center justify-center gap-2 py-3.5 md:py-2.5 border-3 border-[#1A1A2E] rounded-lg text-base md:text-sm font-bold transition-all disabled:cursor-not-allowed shadow-[3px_3px_0px_#1A1A2E]
                          ${notificationChannel === 'whatsapp' ? 'bg-[#25D366] text-white' : 'bg-white hover:bg-[#25D366]/10'}
                        `}
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-4 md:w-4" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => !otpSent && setNotificationChannel('viber')}
                        disabled={otpSent}
                        className={`flex items-center justify-center gap-2 py-3.5 md:py-2.5 border-3 border-[#1A1A2E] rounded-lg text-base md:text-sm font-bold transition-all disabled:cursor-not-allowed shadow-[3px_3px_0px_#1A1A2E]
                          ${notificationChannel === 'viber' ? 'bg-[#7360F2] text-white' : 'bg-white hover:bg-[#7360F2]/10'}
                        `}
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-4 md:w-4" fill="currentColor">
                          <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.182.518 6.792.434 10.049c-.084 3.256-.19 9.365 5.752 11.091l.007.001s-.007 1.317-.007 1.771c0 0-.063.866.518 1.052.55.186.916-.348 1.468-.932.303-.32.723-.793 1.04-1.155 2.86.252 5.063-.293 5.32-.384.58-.187 3.86-.602 4.394-4.903.555-4.464-.258-7.273-1.715-8.552-.084-.093-.163-.18-.253-.27l.003-.003c-.587-.589-3.098-2.584-8.35-2.756 0 0-.415-.028-1.213-.007zm.133 1.765c.686-.013 1.055.01 1.055.01 4.357.143 6.531 1.72 7.033 2.235.075.073.141.147.216.22h.002c1.175 1.038 1.871 3.538 1.395 7.346-.427 3.487-3.054 3.8-3.537 3.955-.207.072-2.102.54-4.495.38 0 0-1.78 2.155-2.336 2.715-.09.09-.196.134-.27.12-.105-.018-.134-.123-.133-.27l.015-2.938-.001-.003c-4.818-1.397-4.538-6.582-4.473-9.16.066-2.577.633-4.713 2.041-6.096 1.95-1.713 5.507-2.18 7.377-2.316.127-.1.27-.015.406-.015-.036-.022-.036-.064-.026-.093h.001c-.1.006-.168.022-.27.028zm1.167 2.348c-.11 0-.2.09-.2.2 0 .11.09.2.2.2 1.54.014 2.88.58 3.9 1.612 1.03 1.018 1.61 2.364 1.64 3.868.001.11.09.198.2.198h.01c.11 0 .2-.09.198-.2-.032-1.62-.666-3.073-1.777-4.196-1.1-1.11-2.554-1.728-4.17-1.742-.006 0-.006.06-.002.06zm-3.5 1.15c-.156-.004-.326.013-.495.05-.556.13-.96.395-.972.405-.41.29-.74.633-.997 1.003-.256.37-.442.794-.567 1.21-.062.208-.1.414-.1.616 0 .253.055.496.16.728.16.34.367.74.617 1.189.518.94 1.192 2.038 2.06 2.946.16.17.325.34.508.516.184.176.38.352.595.528.9.762 2.024 1.385 3.054 1.885.534.256.998.454 1.376.595.233.094.477.184.73.264.253.08.52.146.804.146h.05c.206-.008.4-.05.58-.11.36-.124.69-.333.95-.605l.01-.01c.11-.12.21-.246.29-.378.08-.13.14-.27.17-.41.03-.15.04-.3.01-.45-.03-.15-.1-.29-.21-.4l-.023-.02c-.32-.298-.66-.557-.99-.788-.35-.23-.71-.43-1.04-.573-.126-.053-.31-.08-.5-.07-.188.01-.38.06-.534.18l-.64.49c-.174.14-.404.15-.59.07 0 0-.766-.34-1.567-.898-.802-.557-1.63-1.33-1.888-2.024-.04-.12-.02-.26.09-.37l.434-.48c.11-.12.17-.27.19-.42.02-.15-.003-.3-.07-.44-.16-.345-.372-.72-.6-1.09-.23-.37-.48-.73-.72-1.04-.12-.15-.27-.27-.43-.34-.16-.07-.33-.1-.5-.1h.01zm3.17.627c-.11 0-.198.09-.198.2 0 .11.088.2.198.2.96.008 1.797.37 2.457 1.016.658.647 1.043 1.51 1.057 2.455.002.11.093.198.202.198h.008c.11-.002.198-.092.197-.202-.015-1.06-.448-2.03-1.184-2.77-.73-.74-1.68-1.167-2.737-1.177v.08zm.313 1.418c-.11-.006-.204.08-.21.19-.005.11.08.204.19.21.52.034.96.25 1.29.595.32.345.51.81.51 1.325 0 .11.09.2.2.2.11 0 .2-.09.2-.2 0-.63-.23-1.2-.62-1.63-.4-.43-.94-.68-1.56-.72v.03z"/>
                        </svg>
                        Viber
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {otpError && (
                    <div className="p-3 md:p-2 rounded-lg border-3 border-[#1A1A2E] text-sm md:text-xs text-center font-bold bg-[#EF4444] text-white shadow-[3px_3px_0px_#1A1A2E]">
                      {otpError}
                    </div>
                  )}

                  {/* Before OTP */}
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full py-3.5 md:py-2.5 text-base md:text-sm font-bold text-white rounded-lg transition-all disabled:opacity-50 border-3 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] hover:shadow-[5px_5px_0px_#1A1A2E] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] uppercase tracking-wide"
                      style={{ backgroundColor: POP_COLORS.primary }}
                      disabled={sendingOtp || !phone || !notificationChannel}
                    >
                      {sendingOtp ? 'Slanje...' : 'Pošalji verifikacioni kod'}
                    </button>
                  )}

                  {/* After OTP */}
                  {otpSent && (
                    <>
                      <div className="p-3 md:p-2 rounded-lg border-3 border-[#1A1A2E] text-sm md:text-xs text-center font-bold shadow-[3px_3px_0px_#1A1A2E]" style={{ backgroundColor: POP_COLORS.success, color: 'white' }}>
                        Kod poslat na {notificationChannel === 'whatsapp' ? 'WhatsApp' : 'Viber'}
                      </div>

                      <div>
                        <label className="text-sm md:text-xs font-bold uppercase tracking-wide mb-1.5 md:mb-1 block">Verifikacioni kod *</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="h-14 md:h-12 text-center text-2xl md:text-xl tracking-widest font-mono font-bold border-3 border-[#1A1A2E] bg-white shadow-[3px_3px_0px_#1A1A2E]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 md:py-2.5 text-base md:text-sm font-bold text-white rounded-lg transition-all disabled:opacity-50 border-3 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] hover:shadow-[5px_5px_0px_#1A1A2E] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] uppercase tracking-wide"
                        style={{ backgroundColor: POP_COLORS.success }}
                        disabled={submitting || otpCode.length !== 6}
                      >
                        {submitting ? 'Zakazivanje...' : 'Potvrdi i zakaži'}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); setOtpError('') }}
                        className="w-full text-sm md:text-xs font-bold opacity-60 hover:opacity-100 py-2 md:py-1 underline"
                      >
                        Pošalji novi kod
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 py-3 md:py-2 text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-sm md:text-xs font-bold opacity-50">
          <div className="w-5 h-5 rounded bg-white border-2 border-[#1A1A2E]/30 flex items-center justify-center relative">
            <Coffee className="w-3 h-3 text-[#2563EB]" />
          </div>
          Dragica — Tvoja pomoćnica
        </div>
      </footer>
    </div>
  )
}
