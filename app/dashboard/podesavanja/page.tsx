'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Save, ExternalLink, Copy, Check, Upload, X, Eye, Palette, Image, Type, Settings, Paintbrush, Clock, Plus, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

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
  logo_url: string | null
  banner_url: string | null
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

interface WorkingHours {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface BlockedSlot {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
}

const DAYS = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub']
const DAYS_FULL = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota']

const COLOR_THEMES = [
  {
    name: 'Zlatna',
    accent: '#CDA661',
    light: { bg: '#ffffff', text: '#1a1a1a' },
    dark: { bg: '#181920', text: '#ffffff' }
  },
  {
    name: 'Ljubičasta',
    accent: '#6054BA',
    light: { bg: '#ffffff', text: '#1a1a1a' },
    dark: { bg: '#181920', text: '#ffffff' }
  },
  {
    name: 'Plava',
    accent: '#468EE3',
    light: { bg: '#ffffff', text: '#1a1a1a' },
    dark: { bg: '#181920', text: '#ffffff' }
  },
  {
    name: 'Tirkizna',
    accent: '#18C6A0',
    light: { bg: '#ffffff', text: '#1a1a1a' },
    dark: { bg: '#181920', text: '#ffffff' }
  },
  {
    name: 'Roze',
    accent: '#ec4899',
    light: { bg: '#ffffff', text: '#1a1a1a' },
    dark: { bg: '#181920', text: '#ffffff' }
  },
  {
    name: 'Crvena',
    accent: '#EF5050',
    light: { bg: '#ffffff', text: '#1a1a1a' },
    dark: { bg: '#181920', text: '#ffffff' }
  },
]

export default function SettingsPage() {
  const [salon, setSalon] = useState<Salon | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  // Working hours state
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false)
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null)
  const [editingBlockedId, setEditingBlockedId] = useState<string | null>(null)
  const [hoursForm, setHoursForm] = useState({ start_time: '09:00', end_time: '17:00' })
  const [blockedForm, setBlockedForm] = useState({
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    reason: '',
  })

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // General settings form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    accent_color: '#CDA661',
  })

  // Branding settings
  const [brandingData, setBrandingData] = useState({
    name: '',
    description: '',
    logo_url: null as string | null,
    banner_url: null as string | null,
    accent_color: '#CDA661',
    background_color: '#181920',
    text_color: '#ffffff',
    button_style: 'rounded',
    theme: 'dark',
    welcome_message: '',
  })
  const [selectedThemeMode, setSelectedThemeMode] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    fetchSalon()
    fetchServices()
    fetchWorkingHours()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/dashboard/services')
      const data = await response.json()
      if (data.services) {
        setServices(data.services.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchWorkingHours = async () => {
    try {
      const [hoursRes, slotsRes] = await Promise.all([
        fetch('/api/dashboard/working-hours'),
        fetch('/api/dashboard/blocked-slots'),
      ])
      if (hoursRes.ok) {
        const data = await hoursRes.json()
        setWorkingHours(data.hours || [])
      }
      if (slotsRes.ok) {
        const data = await slotsRes.json()
        setBlockedSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Error fetching working hours:', error)
    }
  }

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
          accent_color: data.salon.accent_color || '#CDA661',
        })
        setBrandingData({
          name: data.salon.name,
          description: data.salon.description || '',
          logo_url: data.salon.logo_url,
          banner_url: data.salon.banner_url,
          accent_color: data.salon.accent_color || '#CDA661',
          background_color: data.salon.background_color || '#181920',
          text_color: data.salon.text_color || '#ffffff',
          button_style: data.salon.button_style || 'rounded',
          theme: data.salon.theme || 'dark',
          welcome_message: data.salon.welcome_message || '',
        })
      }
    } catch (error) {
      console.error('Error fetching salon:', error)
    } finally {
      setLoading(false)
    }
  }

  // General settings submit
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

  // Branding settings submit
  const handleSaveBranding = async () => {
    setSavingBranding(true)

    try {
      const response = await fetch('/api/dashboard/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingData),
      })

      if (response.ok) {
        alert('Podešavanja brendiranja su sačuvana!')
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju')
      }
    } catch (error) {
      alert('Greška pri čuvanju')
    } finally {
      setSavingBranding(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setBrandingData((prev) => ({
          ...prev,
          [type === 'logo' ? 'logo_url' : 'banner_url']: data.url,
        }))
      } else {
        alert(data.error || 'Greška pri uploadu')
      }
    } catch (error) {
      alert('Greška pri uploadu')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (type: 'logo' | 'banner') => {
    setBrandingData((prev) => ({
      ...prev,
      [type === 'logo' ? 'logo_url' : 'banner_url']: null,
    }))
  }

  // Working hours handlers
  const getHoursForDay = (day: number) => workingHours.filter((h) => h.day_of_week === day && h.is_active)

  const handleAddHours = (day: number) => {
    setSelectedDay(day)
    setEditingHoursId(null)
    setHoursForm({ start_time: '09:00', end_time: '17:00' })
    setHoursDialogOpen(true)
  }

  const handleEditHours = (hour: WorkingHours) => {
    setSelectedDay(hour.day_of_week)
    setEditingHoursId(hour.id)
    setHoursForm({ start_time: hour.start_time, end_time: hour.end_time })
    setHoursDialogOpen(true)
  }

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDay === null) return

    try {
      const url = editingHoursId
        ? `/api/dashboard/working-hours/${editingHoursId}`
        : '/api/dashboard/working-hours'

      const response = await fetch(url, {
        method: editingHoursId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: selectedDay, ...hoursForm }),
      })

      if (response.ok) {
        setHoursDialogOpen(false)
        setEditingHoursId(null)
        fetchWorkingHours()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteHours = async (id: string) => {
    if (!confirm('Da li ste sigurni?')) return
    try {
      const response = await fetch(`/api/dashboard/working-hours/${id}`, { method: 'DELETE' })
      if (response.ok) fetchWorkingHours()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddBlocked = () => {
    setEditingBlockedId(null)
    setBlockedForm({ start_date: '', start_time: '09:00', end_date: '', end_time: '17:00', reason: '' })
    setBlockedDialogOpen(true)
  }

  const handleEditBlocked = (slot: BlockedSlot) => {
    const startDate = new Date(slot.start_datetime)
    const endDate = new Date(slot.end_datetime)
    setEditingBlockedId(slot.id)
    setBlockedForm({
      start_date: format(startDate, 'yyyy-MM-dd'),
      start_time: format(startDate, 'HH:mm'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      end_time: format(endDate, 'HH:mm'),
      reason: slot.reason || '',
    })
    setBlockedDialogOpen(true)
  }

  const handleBlockedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingBlockedId
        ? `/api/dashboard/blocked-slots/${editingBlockedId}`
        : '/api/dashboard/blocked-slots'

      const response = await fetch(url, {
        method: editingBlockedId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_datetime: `${blockedForm.start_date}T${blockedForm.start_time}:00`,
          end_datetime: `${blockedForm.end_date}T${blockedForm.end_time}:00`,
          reason: blockedForm.reason || null,
        }),
      })

      if (response.ok) {
        setBlockedDialogOpen(false)
        setEditingBlockedId(null)
        setBlockedForm({ start_date: '', start_time: '09:00', end_date: '', end_time: '17:00', reason: '' })
        fetchWorkingHours()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteBlocked = async (id: string) => {
    if (!confirm('Da li ste sigurni?')) return
    try {
      const response = await fetch(`/api/dashboard/blocked-slots/${id}`, { method: 'DELETE' })
      if (response.ok) fetchWorkingHours()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const applyTheme = (theme: (typeof COLOR_THEMES)[0], mode: 'light' | 'dark') => {
    const variant = mode === 'light' ? theme.light : theme.dark
    setBrandingData((prev) => ({
      ...prev,
      accent_color: theme.accent,
      background_color: variant.bg,
      text_color: variant.text,
      theme: mode,
    }))
    setSelectedThemeMode(mode)
  }

  const bookingUrl = salon
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://dragica-web-app.vercel.app'}/book/${salon.slug || salon.subdomain}`
    : ''

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookingUrl)
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

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Opšte
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            Radno vreme
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Paintbrush className="h-4 w-4" />
            Brendiranje
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
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
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-sm font-mono break-all text-primary">{bookingUrl}</p>
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
                      onClick={() => window.open(bookingUrl, '_blank')}
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
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
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
        </TabsContent>

        {/* Working Hours Tab */}
        <TabsContent value="hours" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Nedeljni raspored</CardTitle>
                <CardDescription>Radno vreme za svaki dan u nedelji</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
                  const hoursForDay = getHoursForDay(dayIndex)
                  return (
                    <div key={dayIndex} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-12 text-sm font-medium">{DAYS[dayIndex]}</span>
                        {hoursForDay.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Neradni dan</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {hoursForDay.map((hour) => (
                              <div key={hour.id} className="flex items-center gap-1">
                                <span className="text-sm font-mono text-primary">
                                  {hour.start_time}-{hour.end_time}
                                </span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditHours(hour)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteHours(hour.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleAddHours(dayIndex)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Blocked Slots */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Blokirani termini</CardTitle>
                  <CardDescription>Periodi nedostupnosti</CardDescription>
                </div>
                <Button size="sm" onClick={handleAddBlocked}>
                  <Plus className="mr-1 h-4 w-4" />
                  Dodaj
                </Button>
              </CardHeader>
              <CardContent>
                {blockedSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nema blokiranih termina</p>
                ) : (
                  <div className="space-y-2">
                    {blockedSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(slot.start_datetime), 'd. MMM HH:mm', { locale: srLatn })} - {format(new Date(slot.end_datetime), 'd. MMM HH:mm', { locale: srLatn })}
                          </p>
                          {slot.reason && <p className="text-xs text-muted-foreground">{slot.reason}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditBlocked(slot)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteBlocked(slot.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Branding Settings Card */}
            <Card>
                <CardHeader>
                  <CardTitle>Izgled stranice za zakazivanje</CardTitle>
                  <CardDescription>Prilagodite izgled vaše javne stranice</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Images Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Slike
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label>Logo</Label>
                        <p className="text-xs text-muted-foreground">Preporučeno: 200x200px</p>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, 'logo')
                          }}
                        />

                        {brandingData.logo_url ? (
                          <div className="relative inline-block">
                            <img
                              src={brandingData.logo_url}
                              alt="Logo"
                              className="w-24 h-24 object-contain rounded-lg border border-border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => handleRemoveImage('logo')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadingLogo ? 'Uploadovanje...' : 'Dodaj logo'}
                          </Button>
                        )}
                      </div>

                      {/* Banner Upload */}
                      <div className="space-y-2">
                        <Label>Banner slika</Label>
                        <p className="text-xs text-muted-foreground">Preporučeno: 1200x400px</p>
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, 'banner')
                          }}
                        />

                        {brandingData.banner_url ? (
                          <div className="relative">
                            <img
                              src={brandingData.banner_url}
                              alt="Banner"
                              className="w-full h-24 object-cover rounded-lg border border-border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => handleRemoveImage('banner')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={uploadingBanner}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadingBanner ? 'Uploadovanje...' : 'Dodaj banner'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Colors Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Tema boja
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {COLOR_THEMES.map((theme) => (
                        <div key={theme.name} className="space-y-2">
                          <p className="text-sm font-medium">{theme.name}</p>
                          <div className="flex gap-2">
                            {/* Light variant */}
                            <button
                              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                                brandingData.accent_color === theme.accent && selectedThemeMode === 'light'
                                  ? 'border-primary'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              style={{ backgroundColor: theme.light.bg }}
                              onClick={() => applyTheme(theme, 'light')}
                            >
                              <div
                                className="w-6 h-6 rounded-full mx-auto mb-1"
                                style={{ backgroundColor: theme.accent }}
                              />
                              <span className="text-xs" style={{ color: theme.light.text }}>
                                Svetla
                              </span>
                            </button>
                            {/* Dark variant */}
                            <button
                              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                                brandingData.accent_color === theme.accent && selectedThemeMode === 'dark'
                                  ? 'border-primary'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              style={{ backgroundColor: theme.dark.bg }}
                              onClick={() => applyTheme(theme, 'dark')}
                            >
                              <div
                                className="w-6 h-6 rounded-full mx-auto mb-1"
                                style={{ backgroundColor: theme.accent }}
                              />
                              <span className="text-xs" style={{ color: theme.dark.text }}>
                                Tamna
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Text Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Tekst
                    </h3>

                    <div className="space-y-2">
                      <Label>Poruka dobrodošlice</Label>
                      <Textarea
                        placeholder="Dobrodošli u naš salon! Zakažite svoj termin online."
                        value={brandingData.welcome_message}
                        onChange={(e) =>
                          setBrandingData({ ...brandingData, welcome_message: e.target.value })
                        }
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Prikazuje se na vrhu stranice za zakazivanje
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSaveBranding} disabled={savingBranding}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingBranding ? 'Čuvanje...' : 'Sačuvaj izmene'}
                  </Button>
                </CardContent>
              </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Pregled
                </CardTitle>
                <CardDescription>Kako će izgledati vaša stranica za zakazivanje</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg overflow-hidden border border-border min-h-[400px]"
                  style={{
                    backgroundColor: brandingData.background_color,
                    color: brandingData.text_color,
                  }}
                >
                  {/* Banner */}
                  {brandingData.banner_url ? (
                    <img
                      src={brandingData.banner_url}
                      alt="Banner"
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-32"
                      style={{ backgroundColor: brandingData.accent_color }}
                    />
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Logo & Name */}
                    <div className="flex items-center gap-4 mb-6">
                      {brandingData.logo_url ? (
                        <img
                          src={brandingData.logo_url}
                          alt="Logo"
                          className="w-16 h-16 object-contain rounded"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded flex items-center justify-center text-white text-xl font-bold"
                          style={{ backgroundColor: brandingData.accent_color }}
                        >
                          {brandingData.name?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{brandingData.name || salon?.name}</h3>
                        {brandingData.welcome_message && (
                          <p className="text-sm opacity-70">{brandingData.welcome_message}</p>
                        )}
                      </div>
                    </div>

                    {/* Services */}
                    <div className="space-y-3 mb-6">
                      {(services.length > 0 ? services : [{ id: '0', name: 'Primer usluge', duration_minutes: 60, price: 2000 }]).map((service) => (
                        <div
                          key={service.id}
                          className="p-4 rounded-lg border"
                          style={{ borderColor: brandingData.accent_color }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm opacity-70">{service.duration_minutes} min</p>
                            </div>
                            <p className="font-medium">{service.price.toLocaleString('sr-RS')} RSD</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <button
                      className="w-full py-3 px-6 text-white font-medium rounded-lg"
                      style={{ backgroundColor: brandingData.accent_color }}
                    >
                      Zakaži termin
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Working Hours Dialog */}
      <Dialog open={hoursDialogOpen} onOpenChange={(open) => {
        setHoursDialogOpen(open)
        if (!open) setEditingHoursId(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingHoursId ? 'Izmeni radno vreme' : 'Dodaj radno vreme'}</DialogTitle>
            <DialogDescription>
              {selectedDay !== null && `${DAYS_FULL[selectedDay]}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHoursSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Početak</Label>
                <Input
                  type="time"
                  value={hoursForm.start_time}
                  onChange={(e) => setHoursForm({ ...hoursForm, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kraj</Label>
                <Input
                  type="time"
                  value={hoursForm.end_time}
                  onChange={(e) => setHoursForm({ ...hoursForm, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setHoursDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit">{editingHoursId ? 'Sačuvaj' : 'Dodaj'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Blocked Slot Dialog */}
      <Dialog open={blockedDialogOpen} onOpenChange={(open) => {
        setBlockedDialogOpen(open)
        if (!open) setEditingBlockedId(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBlockedId ? 'Izmeni blokadu' : 'Blokiraj termin'}</DialogTitle>
            <DialogDescription>Period kada nećete biti dostupni</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBlockedSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Početni datum</Label>
                  <Input
                    type="date"
                    value={blockedForm.start_date}
                    onChange={(e) => setBlockedForm({ ...blockedForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vreme</Label>
                  <Input
                    type="time"
                    value={blockedForm.start_time}
                    onChange={(e) => setBlockedForm({ ...blockedForm, start_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Krajnji datum</Label>
                  <Input
                    type="date"
                    value={blockedForm.end_date}
                    onChange={(e) => setBlockedForm({ ...blockedForm, end_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vreme</Label>
                  <Input
                    type="time"
                    value={blockedForm.end_time}
                    onChange={(e) => setBlockedForm({ ...blockedForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Razlog (opciono)</Label>
                <Input
                  placeholder="Npr. Godišnji odmor"
                  value={blockedForm.reason}
                  onChange={(e) => setBlockedForm({ ...blockedForm, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBlockedDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit">{editingBlockedId ? 'Sačuvaj' : 'Blokiraj'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
