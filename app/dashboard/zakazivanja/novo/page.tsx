'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
}

export default function NewBookingPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    service_id: '',
    customer_phone: '',
    customer_name: '',
    date: '',
    time: '',
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/dashboard/services')
      const data = await response.json()
      setServices((data.services || []).filter((s: Service) => s.is_active))
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const start_datetime = `${formData.date}T${formData.time}:00`

      const response = await fetch('/api/dashboard/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: formData.service_id,
          customer_phone: formData.customer_phone,
          customer_name: formData.customer_name || null,
          start_datetime,
        }),
      })

      if (response.ok) {
        router.push('/dashboard/zakazivanja')
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

  const selectedService = services.find((s) => s.id === formData.service_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/zakazivanja">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo zakazivanje</h1>
          <p className="text-muted-foreground">Ručno zakazivanje termina</p>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Detalji zakazivanja</CardTitle>
          <CardDescription>
            Popunite informacije o novom terminu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Učitavanje...</p>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nemate aktivnih usluga. Dodajte uslugu da biste mogli da zakazujete termine.
              </p>
              <Link href="/dashboard/usluge">
                <Button>Dodaj uslugu</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Usluga *</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  required
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
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ime klijenta (opciono)</Label>
                <Input
                  id="name"
                  placeholder="Marija Petrović"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Vreme *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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

              <div className="flex gap-3 pt-4">
                <Link href="/dashboard/zakazivanja" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Otkaži
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Kreiranje...' : 'Zakaži termin'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
