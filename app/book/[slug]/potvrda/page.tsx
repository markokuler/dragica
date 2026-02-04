'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, Phone, MapPin } from 'lucide-react'
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

  const accentColor = booking?.tenant.accent_color || '#ec4899'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Greška</CardTitle>
            <CardDescription>{error || 'Zakazivanje nije pronađeno'}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href={`/book/${slug}`}>
              <Button>Zakaži novi termin</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: accentColor + '20' }}
          >
            <CheckCircle className="h-8 w-8" style={{ color: accentColor }} />
          </div>
          <CardTitle className="text-2xl">Termin je zakazan!</CardTitle>
          <CardDescription>
            Uspešno ste zakazali termin u salonu {booking.tenant.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Details */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5" style={{ color: accentColor }} />
              <div>
                <p className="font-medium">
                  {format(new Date(booking.start_datetime), 'EEEE, d. MMMM yyyy', {
                    locale: srLatn,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Datum</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5" style={{ color: accentColor }} />
              <div>
                <p className="font-medium">
                  {format(new Date(booking.start_datetime), 'HH:mm')} -{' '}
                  {format(new Date(booking.end_datetime), 'HH:mm')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.service.duration_minutes} minuta
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="font-medium">{booking.service.name}</p>
              <p className="text-lg font-bold" style={{ color: accentColor }}>
                {booking.service.price.toLocaleString('sr-RS')} RSD
              </p>
            </div>
          </div>

          {/* Salon Contact */}
          <div className="space-y-2">
            <h3 className="font-medium">Kontakt informacije</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {booking.tenant.phone}
            </p>
            <p className="text-sm text-muted-foreground">{booking.tenant.email}</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Link href={`/book/${slug}`} className="block">
              <Button variant="outline" className="w-full">
                Zakaži novi termin
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ako želite da otkažete ili promenite termin, molimo vas da kontaktirate salon
            direktno.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
