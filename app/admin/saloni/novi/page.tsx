'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Info } from 'lucide-react'

export default function NoviSalonPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    email: '',
    phone: '',
    description: '',
    ownerEmail: '',
    ownerPassword: '',
    trialDays: '30',
  })

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    setFormData({
      ...formData,
      name,
      slug,
      subdomain: slug,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          trialDays: parseInt(formData.trialDays),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Došlo je do greške')
        setLoading(false)
        return
      }

      router.push('/admin/saloni')
    } catch (err) {
      setError('Došlo je do greške. Molimo pokušajte ponovo.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/saloni">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-serif">Novi salon</h1>
          <p className="text-muted-foreground">Kreirajte novi salon u sistemu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Salon Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informacije o salonu</CardTitle>
              <CardDescription>Osnovne informacije o salonu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv salona *</Label>
                <Input
                  id="name"
                  placeholder="Milana Nails"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomen *</Label>
                <Input
                  id="subdomain"
                  placeholder="milana-nails"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  required
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  URL: {process.env.NEXT_PUBLIC_APP_URL || 'https://dragica.app'}/book/{formData.subdomain || 'subdomen'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email salona *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@milananails.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon salona *</Label>
                <Input
                  id="phone"
                  placeholder="+381 60 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis salona</Label>
                <Textarea
                  id="description"
                  placeholder="Kratak opis salona..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Owner Account & Trial */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nalog vlasnika</CardTitle>
                <CardDescription>Kredencijali za pristup sistemu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Email za prijavu *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="vlasnik@email.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Lozinka *</Label>
                  <Input
                    id="ownerPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.ownerPassword}
                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">Minimum 8 karaktera</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Free Trial</CardTitle>
                <CardDescription>Podešavanje probnog perioda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trialDays">Trajanje trial perioda</Label>
                  <Select
                    value={formData.trialDays}
                    onValueChange={(value) => setFormData({ ...formData, trialDays: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dana</SelectItem>
                      <SelectItem value="14">14 dana</SelectItem>
                      <SelectItem value="30">30 dana (preporučeno)</SelectItem>
                      <SelectItem value="45">45 dana</SelectItem>
                      <SelectItem value="60">60 dana</SelectItem>
                      <SelectItem value="90">90 dana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-2 p-3 bg-info/10 rounded-lg">
                  <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Salon će imati pristup svim funkcijama tokom trial perioda.
                    Nakon isteka, potrebno je evidentirati uplatu za nastavak korišćenja.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Kreiranje...' : 'Kreiraj salon'}
              </Button>

              <Link href="/admin/saloni">
                <Button type="button" variant="outline" className="w-full" disabled={loading}>
                  Otkaži
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
