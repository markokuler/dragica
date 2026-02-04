'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Phone, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { srLatn } from 'date-fns/locale'

interface Tenant {
  id: string
  name: string
  email: string
  phone: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
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

type Step = 'service' | 'datetime' | 'contact' | 'confirm'

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
  const [submitting, setSubmitting] = useState(false)

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i + 1)
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE, d. MMM', { locale: srLatn }),
      dayName: format(date, 'EEEE', { locale: srLatn }),
    }
  })

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
    setStep('datetime')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('contact')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

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
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to confirmation page with booking ID
        router.push(`/book/${slug}/potvrda?id=${data.bookingId}`)
      } else {
        alert(data.error || 'Greška pri zakazivanju')
      }
    } catch (err) {
      alert('Greška pri zakazivanju')
    } finally {
      setSubmitting(false)
    }
  }

  // Branding values with defaults
  const accentColor = tenant?.accent_color || '#ec4899'
  const backgroundColor = tenant?.background_color || '#ffffff'
  const textColor = tenant?.text_color || '#000000'
  const buttonStyle = tenant?.button_style || 'rounded'

  // Button border radius based on style
  const getButtonRadius = () => {
    switch (buttonStyle) {
      case 'pill':
        return '9999px'
      case 'square':
        return '0px'
      default:
        return '0.5rem'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <p style={{ color: textColor }} className="opacity-70">Učitavanje...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Greška</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor, color: textColor }}>
      {/* Header with Banner */}
      <header className="border-b" style={{ borderColor: accentColor + '30' }}>
        {/* Banner Image */}
        {tenant?.banner_url ? (
          <div className="w-full h-32 md:h-48 overflow-hidden">
            <img
              src={tenant.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-full h-24 md:h-32"
            style={{ backgroundColor: accentColor }}
          />
        )}

        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt="Logo"
                className="w-16 h-16 object-contain rounded-lg"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: accentColor }}
              >
                {tenant?.name?.charAt(0) || 'S'}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold" style={{ color: accentColor }}>
                {tenant?.name}
              </h1>
              {tenant?.welcome_message ? (
                <p className="mt-1 opacity-70">{tenant.welcome_message}</p>
              ) : tenant?.description ? (
                <p className="mt-1 opacity-70">{tenant.description}</p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['service', 'datetime', 'contact'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s || ['service', 'datetime', 'contact'].indexOf(step) > i
                    ? 'text-white'
                    : ''
                }`}
                style={{
                  backgroundColor:
                    step === s || ['service', 'datetime', 'contact'].indexOf(step) > i
                      ? accentColor
                      : backgroundColor === '#ffffff' ? '#e5e7eb' : '#374151',
                  color:
                    step === s || ['service', 'datetime', 'contact'].indexOf(step) > i
                      ? '#ffffff'
                      : textColor,
                }}
              >
                {['service', 'datetime', 'contact'].indexOf(step) > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className="w-12 h-0.5 mx-2"
                  style={{ backgroundColor: backgroundColor === '#ffffff' ? '#e5e7eb' : '#374151' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        {step === 'service' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Izaberite uslugu</h2>
              <p className="opacity-70">Koju uslugu želite da zakažete?</p>
            </div>

            {services.length === 0 ? (
              <Card style={{ backgroundColor: backgroundColor === '#ffffff' ? '#f9fafb' : '#1f2937' }}>
                <CardContent className="py-8 text-center">
                  <p className="opacity-70">Nema dostupnih usluga</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    style={{
                      backgroundColor: backgroundColor === '#ffffff' ? '#ffffff' : '#1f2937',
                      borderColor: accentColor + '30',
                    }}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm opacity-70">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {service.duration_minutes} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: accentColor }}>
                          {service.price.toLocaleString('sr-RS')} RSD
                        </p>
                        <ArrowRight className="h-4 w-4 opacity-50 ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 'datetime' && selectedService && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setStep('service')}
              className="mb-2"
              style={{ color: textColor }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazad
            </Button>

            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold">Izaberite termin</h2>
              <p className="opacity-70">
                {selectedService.name} • {selectedService.duration_minutes} min
              </p>
            </div>

            {/* Date Selection */}
            <div>
              <Label className="mb-2 block">Datum</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.value}
                    className="h-auto py-3 flex flex-col items-center border transition-all"
                    style={{
                      backgroundColor:
                        selectedDate === date.value
                          ? accentColor
                          : backgroundColor === '#ffffff' ? '#ffffff' : '#1f2937',
                      color: selectedDate === date.value ? '#ffffff' : textColor,
                      borderColor: selectedDate === date.value ? accentColor : accentColor + '30',
                      borderRadius: getButtonRadius(),
                    }}
                    onClick={() => setSelectedDate(date.value)}
                  >
                    <span className="text-xs opacity-70">{date.dayName}</span>
                    <span className="font-medium">{date.label.split(', ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <Label className="mb-2 block">Vreme</Label>
                {loadingSlots ? (
                  <p className="text-center py-8 opacity-70">Učitavanje termina...</p>
                ) : availableSlots.length === 0 ? (
                  <Card style={{ backgroundColor: backgroundColor === '#ffffff' ? '#f9fafb' : '#1f2937' }}>
                    <CardContent className="py-8 text-center">
                      <p className="opacity-70">
                        Nema dostupnih termina za ovaj dan
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        className="py-2 px-3 text-sm border transition-all"
                        style={{
                          backgroundColor:
                            selectedTime === time
                              ? accentColor
                              : backgroundColor === '#ffffff' ? '#ffffff' : '#1f2937',
                          color: selectedTime === time ? '#ffffff' : textColor,
                          borderColor: selectedTime === time ? accentColor : accentColor + '30',
                          borderRadius: getButtonRadius(),
                        }}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 'contact' && selectedService && selectedDate && selectedTime && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setStep('datetime')}
              className="mb-2"
              style={{ color: textColor }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nazad
            </Button>

            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold">Vaši podaci</h2>
              <p className="opacity-70">Unesite kontakt informacije</p>
            </div>

            {/* Booking Summary */}
            <Card style={{ backgroundColor: backgroundColor === '#ffffff' ? '#f9fafb' : '#1f2937' }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Calendar className="h-10 w-10" style={{ color: accentColor }} />
                  <div>
                    <p className="font-medium">{selectedService.name}</p>
                    <p className="text-sm opacity-70">
                      {format(new Date(selectedDate), 'EEEE, d. MMMM yyyy', { locale: srLatn })}
                    </p>
                    <p className="text-sm opacity-70">
                      {selectedTime} • {selectedService.duration_minutes} min •{' '}
                      {selectedService.price.toLocaleString('sr-RS')} RSD
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Broj telefona *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+381 60 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    backgroundColor: backgroundColor === '#ffffff' ? '#ffffff' : '#1f2937',
                    borderColor: accentColor + '30',
                    color: textColor,
                  }}
                />
                <p className="text-xs opacity-70">
                  Poslaćemo vam SMS sa potvrdom
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ime (opciono)</Label>
                <Input
                  id="name"
                  placeholder="Vaše ime"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    backgroundColor: backgroundColor === '#ffffff' ? '#ffffff' : '#1f2937',
                    borderColor: accentColor + '30',
                    color: textColor,
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 font-medium text-white transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: accentColor,
                  borderRadius: getButtonRadius(),
                }}
                disabled={submitting}
              >
                {submitting ? 'Zakazivanje...' : 'Zakaži termin'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6" style={{ borderColor: accentColor + '30' }}>
        <div className="container mx-auto px-4 text-center text-sm opacity-70">
          <p>
            <Phone className="inline h-3 w-3 mr-1" />
            {tenant?.phone} • {tenant?.email}
          </p>
          <p className="mt-2">Powered by Dragica</p>
        </div>
      </footer>
    </div>
  )
}
