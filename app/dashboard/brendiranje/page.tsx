'use client'

import { useEffect, useState, useRef } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Upload, X, Eye, Palette, Image, Type } from 'lucide-react'

interface BrandingSettings {
  name: string
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

const BUTTON_STYLES = [
  { value: 'rounded', label: 'Zaobljeni' },
  { value: 'square', label: 'Kvadratni' },
  { value: 'pill', label: 'Ovalni' },
]

const THEMES = [
  { value: 'light', label: 'Svetla' },
  { value: 'dark', label: 'Tamna' },
  { value: 'auto', label: 'Automatska' },
]

const COLOR_PRESETS = [
  { name: 'Roze', accent: '#ec4899', bg: '#ffffff', text: '#000000' },
  { name: 'Ljubičasta', accent: '#8b5cf6', bg: '#ffffff', text: '#000000' },
  { name: 'Plava', accent: '#3b82f6', bg: '#ffffff', text: '#000000' },
  { name: 'Zelena', accent: '#10b981', bg: '#ffffff', text: '#000000' },
  { name: 'Narandžasta', accent: '#f97316', bg: '#ffffff', text: '#000000' },
  { name: 'Crvena', accent: '#ef4444', bg: '#ffffff', text: '#000000' },
  { name: 'Tamna', accent: '#ec4899', bg: '#1a1a1a', text: '#ffffff' },
  { name: 'Elegantna', accent: '#d4af37', bg: '#1a1a1a', text: '#ffffff' },
]

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/dashboard/salon')
      const data = await response.json()
      if (data.salon) {
        setSettings({
          name: data.salon.name,
          description: data.salon.description,
          logo_url: data.salon.logo_url,
          banner_url: data.salon.banner_url,
          accent_color: data.salon.accent_color || '#ec4899',
          background_color: data.salon.background_color || '#ffffff',
          text_color: data.salon.text_color || '#000000',
          button_style: data.salon.button_style || 'rounded',
          theme: data.salon.theme || 'light',
          welcome_message: data.salon.welcome_message,
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)

    try {
      const response = await fetch('/api/dashboard/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert('Podešavanja su sačuvana!')
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju')
      }
    } catch (error) {
      alert('Greška pri čuvanju')
    } finally {
      setSaving(false)
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
        setSettings((prev) =>
          prev
            ? { ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: data.url }
            : null
        )
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
    setSettings((prev) =>
      prev ? { ...prev, [type === 'logo' ? 'logo_url' : 'banner_url']: null } : null
    )
  }

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            accent_color: preset.accent,
            background_color: preset.bg,
            text_color: preset.text,
          }
        : null
    )
  }

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Brendiranje</h1>
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brendiranje</h1>
          <p className="text-muted-foreground">
            Prilagodite izgled vaše stranice za zakazivanje
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <div className="space-y-6">
          <Tabs defaultValue="images" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="images">
                <Image className="mr-2 h-4 w-4" />
                Slike
              </TabsTrigger>
              <TabsTrigger value="colors">
                <Palette className="mr-2 h-4 w-4" />
                Boje
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="mr-2 h-4 w-4" />
                Tekst
              </TabsTrigger>
            </TabsList>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4">
              {/* Logo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Logo</CardTitle>
                  <CardDescription>
                    Preporučena veličina: 200x200px
                  </CardDescription>
                </CardHeader>
                <CardContent>
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

                  {settings.logo_url ? (
                    <div className="relative inline-block">
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        className="w-32 h-32 object-contain rounded-lg border"
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
                </CardContent>
              </Card>

              {/* Banner Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Banner slika</CardTitle>
                  <CardDescription>
                    Preporučena veličina: 1200x400px
                  </CardDescription>
                </CardHeader>
                <CardContent>
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

                  {settings.banner_url ? (
                    <div className="relative">
                      <img
                        src={settings.banner_url}
                        alt="Banner"
                        className="w-full h-32 object-cover rounded-lg border"
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4">
              {/* Color Presets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gotove teme</CardTitle>
                  <CardDescription>Brzo primenite kombinaciju boja</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        className="p-2 rounded-lg border hover:border-primary transition-colors text-center"
                        style={{ backgroundColor: preset.bg }}
                        onClick={() => applyPreset(preset)}
                      >
                        <div
                          className="w-6 h-6 rounded-full mx-auto mb-1"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: preset.text }}
                        >
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prilagođene boje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Akcentna</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.accent_color || '#ec4899'}
                          onChange={(e) =>
                            setSettings({ ...settings, accent_color: e.target.value })
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={settings.accent_color || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, accent_color: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Pozadina</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.background_color || '#ffffff'}
                          onChange={(e) =>
                            setSettings({ ...settings, background_color: e.target.value })
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={settings.background_color || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, background_color: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tekst</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.text_color || '#000000'}
                          onChange={(e) =>
                            setSettings({ ...settings, text_color: e.target.value })
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={settings.text_color || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, text_color: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Button Style & Theme */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stil dugmadi</Label>
                      <Select
                        value={settings.button_style || 'rounded'}
                        onValueChange={(value) =>
                          setSettings({ ...settings, button_style: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUTTON_STYLES.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <Select
                        value={settings.theme || 'light'}
                        onValueChange={(value) =>
                          setSettings({ ...settings, theme: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEMES.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value}>
                              {theme.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Poruka dobrodošlice</CardTitle>
                  <CardDescription>
                    Prikazuje se na vrhu stranice za zakazivanje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Dobrodošli u naš salon! Zakažite svoj termin online."
                    value={settings.welcome_message || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, welcome_message: e.target.value })
                    }
                    rows={3}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Pregled
            </CardTitle>
            <CardDescription>Kako će izgledati vaša stranica</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-lg overflow-hidden border"
              style={{
                backgroundColor: settings.background_color || '#ffffff',
                color: settings.text_color || '#000000',
              }}
            >
              {/* Banner */}
              {settings.banner_url ? (
                <img
                  src={settings.banner_url}
                  alt="Banner"
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div
                  className="w-full h-24"
                  style={{ backgroundColor: settings.accent_color || '#ec4899' }}
                />
              )}

              {/* Content */}
              <div className="p-4">
                {/* Logo & Name */}
                <div className="flex items-center gap-3 mb-4">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="w-12 h-12 object-contain rounded"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: settings.accent_color || '#ec4899' }}
                    >
                      {settings.name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{settings.name}</h3>
                    {settings.welcome_message && (
                      <p className="text-xs opacity-70">{settings.welcome_message}</p>
                    )}
                  </div>
                </div>

                {/* Sample Service */}
                <div
                  className="p-3 rounded mb-3 border"
                  style={{ borderColor: settings.accent_color || '#ec4899' }}
                >
                  <p className="font-medium text-sm">Primer usluge</p>
                  <p className="text-xs opacity-70">60 min • 2.000 RSD</p>
                </div>

                {/* Sample Button */}
                <button
                  className={`w-full py-2 px-4 text-white text-sm font-medium ${
                    settings.button_style === 'pill'
                      ? 'rounded-full'
                      : settings.button_style === 'square'
                      ? 'rounded-none'
                      : 'rounded-lg'
                  }`}
                  style={{ backgroundColor: settings.accent_color || '#ec4899' }}
                >
                  Zakaži termin
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
