'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, Phone, PartyPopper } from 'lucide-react'
import DragicaLogo from '@/components/DragicaLogo'
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

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Učitavanje...</div>}>
      <ConfirmationPageContent />
    </Suspense>
  )
}

function ConfirmationPageContent() {
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
          <div className="mx-auto mb-4 animate-bounce">
            <DragicaLogo size="lg" />
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
        <div className="max-w-md w-full bg-white border-4 border-[#1B4332] rounded-xl shadow-[8px_8px_0px_#1B4332] overflow-hidden">
          <div className="bg-[#E76F51] border-b-4 border-[#1B4332] p-6 text-center">
            <h2 className="text-2xl font-extrabold text-white uppercase">Greška!</h2>
          </div>
          <div className="p-6 text-center">
            <p className="font-medium mb-6" style={{ color: POP_COLORS.foreground }}>{error || 'Zakazivanje nije pronađeno'}</p>
            <Link href={`/book/${slug}`}>
              <Button className="font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] hover:shadow-[5px_5px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
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

      {/* Decorative shapes */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#C5E8CB] rounded-full border-4 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] hidden md:block" />
      <div className="absolute bottom-20 right-20 w-20 h-20 bg-[#2D6A4F] rounded-lg border-4 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] rotate-12 hidden md:block" />
      <div className="absolute top-1/4 right-16 w-16 h-16 bg-[#E76F51] rounded-full border-4 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] hidden md:block" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white border-4 border-[#1B4332] rounded-xl shadow-[8px_8px_0px_#1B4332] overflow-hidden">
          {/* Header */}
          <div className="bg-[#40916C] border-b-4 border-[#1B4332] p-6 text-center relative">
            <div className="absolute top-2 left-4">
              <PartyPopper className="w-8 h-8 text-white/80 -rotate-12" />
            </div>
            <div className="absolute top-2 right-4">
              <PartyPopper className="w-8 h-8 text-white/80 rotate-12 scale-x-[-1]" />
            </div>
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white border-4 border-[#1B4332] flex items-center justify-center shadow-[4px_4px_0px_#1B4332]">
              <CheckCircle className="w-10 h-10 text-[#40916C]" />
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
            <div className="bg-[#C5E8CB] border-3 border-[#1B4332] rounded-xl p-4 shadow-[4px_4px_0px_#1B4332]">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#1B4332] flex items-center justify-center shadow-[2px_2px_0px_#1B4332]">
                    <Calendar className="h-5 w-5 text-[#2D6A4F]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1B4332]">
                      {format(new Date(booking.start_datetime), 'EEEE, d. MMMM yyyy', {
                        locale: srLatn,
                      })}
                    </p>
                    <p className="text-sm font-medium text-[#1B4332]/70">Datum</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#1B4332] flex items-center justify-center shadow-[2px_2px_0px_#1B4332]">
                    <Clock className="h-5 w-5 text-[#2D6A4F]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1B4332]">
                      {format(new Date(booking.start_datetime), 'HH:mm')} -{' '}
                      {format(new Date(booking.end_datetime), 'HH:mm')}
                    </p>
                    <p className="text-sm font-medium text-[#1B4332]/70">
                      {booking.service.duration_minutes} minuta
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service & Price */}
            <div className="bg-white border-3 border-[#1B4332] rounded-xl p-4 shadow-[4px_4px_0px_#1B4332]">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#1B4332]">{booking.service.name}</p>
                <p className="text-xl font-extrabold text-[#2D6A4F]">
                  {booking.service.price.toLocaleString('sr-RS')} RSD
                </p>
              </div>
            </div>

            {/* Salon Contact */}
            <div className="space-y-2">
              <h3 className="font-bold uppercase tracking-wide text-sm text-[#1B4332]">Kontakt informacije</h3>
              <div className="flex items-center gap-2 text-sm font-medium text-[#1B4332]/80">
                <Phone className="h-4 w-4" />
                {booking.tenant.phone}
              </div>
              <p className="text-sm font-medium text-[#1B4332]/80">{booking.tenant.email}</p>
            </div>

            {/* Action Button */}
            <Link href={`/book/${slug}`} className="block">
              <Button
                variant="outline"
                className="w-full h-12 font-bold uppercase tracking-wide border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] hover:shadow-[5px_5px_0px_#1B4332] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_#1B4332] active:translate-x-[1px] active:translate-y-[1px] transition-all bg-white"
              >
                Zakaži novi termin
              </Button>
            </Link>

            <p className="text-xs text-center font-medium text-[#1B4332]/60">
              Ako želite da otkažete ili promenite termin, molimo vas da kontaktirate salon direktno.
            </p>
          </div>
        </div>

        {/* Powered by */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[#1B4332]/50">
            <DragicaLogo size="xs" className="opacity-70" />
            Dragica — Tvoja pomoćnica
          </div>
        </div>
      </div>
    </div>
  )
}
