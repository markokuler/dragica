'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, Phone, Coffee, CalendarCheck, PartyPopper, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'
import Link from 'next/link'

interface BookingDetails {
  id: string
  start_datetime: string
  end_datetime: string
  service: {
    name: string
    duration_minutes: number
    price: number
  }
  tenant: {
    name: string
    phone: string
    email: string
    accent_color: string | null
  }
}

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

export default function ConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const bookingId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails()
    }
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/public/${slug}/booking/${bookingId}`)
      const data = await response.json()

      if (response.ok) {
        setBooking(data.booking)
      } else {
        setError(data.error || 'Zakazivanje nije pronađeno')
      }
    } catch (err) {
      setError('Greška pri učitavanju')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: POP_COLORS.background }}>
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

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: POP_COLORS.background }}>
        <div className="max-w-md w-full bg-white border-4 border-[#1A1A2E] rounded-xl shadow-[8px_8px_0px_#1A1A2E] overflow-hidden">
          <div className="bg-[#EF4444] border-b-4 border-[#1A1A2E] p-6 text-center">
            <h2 className="text-2xl font-extrabold text-white uppercase">Greška!</h2>
          </div>
          <div className="p-6 text-center">
            <p className="font-medium mb-6" style={{ color: POP_COLORS.foreground }}>{error || 'Zakazivanje nije pronađeno'}</p>
            <Link href={`/book/${slug}`}>
              <Button className="font-bold uppercase tracking-wide border-3 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] hover:shadow-[5px_5px_0px_#1A1A2E] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                Zakaži novi termin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: POP_COLORS.background }}>
      {/* Pop Art Background Pattern */}
      <div className="fixed inset-0 dots-pattern pointer-events-none opacity-50" />

      {/* Decorative shapes */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#FDE047] rounded-full border-4 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] hidden md:block" />
      <div className="absolute bottom-20 right-20 w-20 h-20 bg-[#2563EB] rounded-lg border-4 border-[#1A1A2E] shadow-[6px_6px_0px_#1A1A2E] rotate-12 hidden md:block" />
      <div className="absolute top-1/4 right-16 w-16 h-16 bg-[#EF4444] rounded-full border-4 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] hidden md:block" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white border-4 border-[#1A1A2E] rounded-xl shadow-[8px_8px_0px_#1A1A2E] overflow-hidden">
          {/* Header */}
          <div className="bg-[#22C55E] border-b-4 border-[#1A1A2E] p-6 text-center relative">
            <div className="absolute top-2 left-4">
              <PartyPopper className="w-8 h-8 text-white/80 -rotate-12" />
            </div>
            <div className="absolute top-2 right-4">
              <PartyPopper className="w-8 h-8 text-white/80 rotate-12 scale-x-[-1]" />
            </div>
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white border-4 border-[#1A1A2E] flex items-center justify-center shadow-[4px_4px_0px_#1A1A2E]">
              <CheckCircle className="w-10 h-10 text-[#22C55E]" />
            </div>
            <h1 className="text-2xl font-extrabold text-white uppercase tracking-wide">
              Zakazano!
            </h1>
            <p className="text-white/90 font-medium mt-1">
              Termin u salonu {booking.tenant.name}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Booking Details Card */}
            <div className="bg-[#FDE047] border-3 border-[#1A1A2E] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A2E]">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#1A1A2E] flex items-center justify-center shadow-[2px_2px_0px_#1A1A2E]">
                    <Calendar className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E]">
                      {format(new Date(booking.start_datetime), 'EEEE, d. MMMM yyyy', {
                        locale: srLatn,
                      })}
                    </p>
                    <p className="text-sm font-medium text-[#1A1A2E]/70">Datum</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#1A1A2E] flex items-center justify-center shadow-[2px_2px_0px_#1A1A2E]">
                    <Clock className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E]">
                      {format(new Date(booking.start_datetime), 'HH:mm')} -{' '}
                      {format(new Date(booking.end_datetime), 'HH:mm')}
                    </p>
                    <p className="text-sm font-medium text-[#1A1A2E]/70">
                      {booking.service.duration_minutes} minuta
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service & Price */}
            <div className="bg-white border-3 border-[#1A1A2E] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A2E]">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#1A1A2E]">{booking.service.name}</p>
                <p className="text-xl font-extrabold text-[#2563EB]">
                  {booking.service.price.toLocaleString('sr-RS')} RSD
                </p>
              </div>
            </div>

            {/* Salon Contact */}
            <div className="space-y-2">
              <h3 className="font-bold uppercase tracking-wide text-sm text-[#1A1A2E]">Kontakt informacije</h3>
              <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A2E]/80">
                <Phone className="h-4 w-4" />
                {booking.tenant.phone}
              </div>
              <p className="text-sm font-medium text-[#1A1A2E]/80">{booking.tenant.email}</p>
            </div>

            {/* Action Button */}
            <Link href={`/book/${slug}`} className="block">
              <Button
                variant="outline"
                className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1A1A2E] shadow-[4px_4px_0px_#1A1A2E] hover:shadow-[5px_5px_0px_#1A1A2E] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] transition-all bg-white"
              >
                Zakaži novi termin
              </Button>
            </Link>

            <p className="text-xs text-center font-medium text-[#1A1A2E]/60">
              Ako želite da otkažete ili promenite termin, molimo vas da kontaktirate salon direktno.
            </p>
          </div>
        </div>

        {/* Powered by */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[#1A1A2E]/50">
            <div className="w-6 h-6 rounded bg-white border-2 border-[#1A1A2E]/30 flex items-center justify-center relative overflow-visible">
              <Coffee className="w-3 h-3 text-[#2563EB]" />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-sm bg-[#22C55E] border border-[#1A1A2E]/30 flex items-center justify-center">
                <CalendarCheck className="w-2 h-2 text-white" />
              </div>
            </div>
            Dragica — Tvoja pomoćnica
          </div>
        </div>
      </div>
    </div>
  )
}
