'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Trash2, Ban, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Salon {
  id: string
  name: string
  slug: string
  subdomain: string
  email: string
  phone: string
  description: string | null
  logo_url: string | null
  accent_color: string | null
  is_active: boolean
  created_at: string
}

export default function SalonSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    accent_color: '',
  })

  useEffect(() => {
    fetchSalon()
  }, [])

  const fetchSalon = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${params.id}`)
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
      const response = await fetch(`/api/admin/salons/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Salon je uspešno ažuriran')
        fetchSalon()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri ažuriranju salona')
      }
    } catch (error) {
      console.error('Error updating salon:', error)
      alert('Greška pri ažuriranju salona')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!salon) return

    const action = salon.is_active ? 'deaktivirati' : 'aktivirati'
    if (!confirm(`Da li ste sigurni da želite da ${action} ovaj salon?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/salons/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !salon.is_active,
        }),
      })

      if (response.ok) {
        fetchSalon()
      }
    } catch (error) {
      console.error('Error toggling salon status:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Da li ste sigurni da želite da TRAJNO OBRIŠETE ovaj salon?\n\nOvo će obrisati sve podatke vezane za salon (usluge, radno vreme, zakazivanja, itd.).\n\nOva akcija se ne može poništiti!')) {
      return
    }

    if (!confirm('Poslednje upozorenje: Da li ste APSOLUTNO SIGURNI?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/salons/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Salon je uspešno obrisan')
        router.push('/admin')
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri brisanju salona')
      }
    } catch (error) {
      console.error('Error deleting salon:', error)
      alert('Greška pri brisanju salona')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Salon nije pronađen</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/salons/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Podešavanja salona</h1>
          <p className="text-muted-foreground">{salon.name}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Osnovne informacije</CardTitle>
              <CardDescription>
                Ažurirajte osnovne informacije o salonu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naziv salona *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
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
                      onChange={(e) =>
                        setFormData({ ...formData, accent_color: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) =>
                        setFormData({ ...formData, accent_color: e.target.value })
                      }
                      placeholder="#ec4899"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brzi linkovi</CardTitle>
              <CardDescription>
                Prečice ka često korišćenim funkcijama
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/salons/${params.id}/services`}>
                <Button variant="outline" className="w-full justify-start">
                  Upravljaj uslugama
                </Button>
              </Link>
              <Link href={`/admin/salons/${params.id}/hours`}>
                <Button variant="outline" className="w-full justify-start">
                  Podesi radno vreme
                </Button>
              </Link>
              <Link href={`/admin/salons/${params.id}/blocked-slots`}>
                <Button variant="outline" className="w-full justify-start">
                  Blokiraj termine
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status salona</CardTitle>
              <CardDescription>
                Trenutni status: {salon.is_active ? 'Aktivan' : 'Neaktivan'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {salon.is_active
                  ? 'Salon je trenutno aktivan i klijenti mogu zakazivati termine.'
                  : 'Salon je neaktivan. Klijenti ne mogu zakazivati nove termine.'}
              </p>
              <Button
                variant={salon.is_active ? 'outline' : 'default'}
                className="w-full"
                onClick={handleToggleActive}
              >
                {salon.is_active ? (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Deaktiviraj salon
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aktiviraj salon
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-500">Opasna zona</CardTitle>
              <CardDescription>
                Nepovratne akcije
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Brisanje salona će trajno obrisati sve podatke vezane za salon.
                Ova akcija se ne može poništiti.
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Obriši salon trajno
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <label className="font-medium text-muted-foreground">
                  Subdomen
                </label>
                <p className="font-mono">{salon.subdomain}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">
                  Slug
                </label>
                <p className="font-mono">{salon.slug}</p>
              </div>
              <div>
                <label className="font-medium text-muted-foreground">
                  Kreiran
                </label>
                <p>{new Date(salon.created_at).toLocaleDateString('sr-RS')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
