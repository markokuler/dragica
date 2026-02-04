'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, ExternalLink, Copy, Check } from 'lucide-react'

interface Salon {
  id: string
  name: string
  slug: string
  subdomain: string
  email: string
  phone: string
  description: string | null
  accent_color: string | null
  is_active: boolean
}

export default function SettingsPage() {
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    accent_color: '#ec4899',
  })

  useEffect(() => {
    fetchSalon()
  }, [])

  const fetchSalon = async () => {
    try {
      const response = await fetch('/api/dashboard/salon')
      const data = await response.json()
      if (data.salon) {
        setSalon(data.salon)
        setFormData({
          name: data.salon.name,
          email: data.salon.email,
          phone: data.salon.phone,
          description: data.salon.description || '',
          accent_color: data.salon.accent_color || '#ec4899',
        })
      }
    } catch (error) {
      console.error('Error fetching salon:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/dashboard/salon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setSalon(data.salon)
        alert('Podešavanja su uspešno sačuvana')
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju podešavanja')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Greška pri čuvanju podešavanja')
    } finally {
      setSaving(false)
    }
  }

  const bookingUrl = salon
    ? `${salon.subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dragica.vercel.app'}`
    : ''

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${bookingUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Podešavanja</h1>
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Podešavanja</h1>
        <p className="text-muted-foreground">Upravljajte podešavanjima vašeg salona</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Osnovne informacije</CardTitle>
              <CardDescription>Ažurirajte informacije o vašem salonu</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naziv salona *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    placeholder="Opišite vaš salon..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent_color">Akcentna boja</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      placeholder="#ec4899"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ova boja će se koristiti na vašoj stranici za zakazivanje
                  </p>
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Booking URL */}
          <Card>
            <CardHeader>
              <CardTitle>Stranica za zakazivanje</CardTitle>
              <CardDescription>Vaša javna stranica za zakazivanje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-mono break-all">{bookingUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleCopyUrl}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Kopirano
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Kopiraj
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`https://${bookingUrl}`, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Otvori
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Podelite ovaj link sa klijentima da bi mogli da zakažu termine online
              </p>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informacije o nalogu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Subdomen</p>
                <p className="font-mono">{salon?.subdomain}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Slug</p>
                <p className="font-mono">{salon?.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    salon?.is_active
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {salon?.is_active ? 'Aktivan' : 'Neaktivan'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Pomoć</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ako imate pitanja ili vam je potrebna pomoć, kontaktirajte nas na{' '}
                <a href="mailto:podrska@dragica.rs" className="text-primary underline">
                  podrska@dragica.rs
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
