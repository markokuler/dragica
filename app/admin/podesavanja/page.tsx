'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Edit2,
  Trash2,
  User,
  Settings2,
  CreditCard,
  Users,
  Info,
  AlertTriangle,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Plan {
  id: string
  name: string
  duration_days: number
  price: number
  is_trial: boolean
  is_active: boolean
  usage_count?: number
}

interface AdminSettings {
  email: string
  name: string
}

interface AppSettings {
  default_trial_days: number
  default_working_hours_start: string
  default_working_hours_end: string
  default_slot_duration: number
  max_booking_advance_days: number
  reminder_hours_before: number
  app_name: string
  support_email: string
}

export default function PodesavanjaPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('plans')

  // Plan dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    duration_days: '',
    price: '',
    is_trial: false,
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({})

  // Admin settings
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    email: '',
    name: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')

  // App settings
  const [appSettings, setAppSettings] = useState<AppSettings>({
    default_trial_days: 14,
    default_working_hours_start: '09:00',
    default_working_hours_end: '20:00',
    default_slot_duration: 30,
    max_booking_advance_days: 90,
    reminder_hours_before: 24,
    app_name: 'Dragica',
    support_email: 'podrska@dragica.rs',
  })
  const [savingApp, setSavingApp] = useState(false)
  const [appMessage, setAppMessage] = useState('')

  useEffect(() => {
    fetchPlans()
    fetchAdminSettings()
    fetchAppSettings()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/account')
      if (response.ok) {
        const data = await response.json()
        setAdminSettings(data)
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error)
    }
  }

  const fetchAppSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/app')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setAppSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error fetching app settings:', error)
    }
  }

  // Plan functions
  const validatePlanForm = () => {
    const errors: Record<string, string> = {}

    if (!planForm.name.trim()) {
      errors.name = 'Naziv je obavezan'
    }

    const days = parseInt(planForm.duration_days)
    if (!planForm.duration_days || isNaN(days) || days < 1) {
      errors.duration_days = 'Trajanje mora biti najmanje 1 dan'
    }

    if (planForm.is_trial && days > 30) {
      errors.duration_days = 'Trial plan ne može trajati duže od 30 dana'
    }

    const price = parseFloat(planForm.price)
    if (!planForm.is_trial && (isNaN(price) || price < 0)) {
      errors.price = 'Cena mora biti pozitivan broj'
    }

    if (!planForm.is_trial && price === 0) {
      errors.price = 'Plaćeni plan mora imati cenu veću od 0'
    }

    setPlanErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openCreateDialog = () => {
    setEditingPlan(null)
    setPlanForm({
      name: '',
      duration_days: '',
      price: '',
      is_trial: false,
      is_active: true,
    })
    setPlanErrors({})
    setPlanDialogOpen(true)
  }

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      duration_days: plan.duration_days.toString(),
      price: plan.price.toString(),
      is_trial: plan.is_trial,
      is_active: plan.is_active,
    })
    setPlanErrors({})
    setPlanDialogOpen(true)
  }

  const handleTrialToggle = (checked: boolean) => {
    setPlanForm({
      ...planForm,
      is_trial: checked,
      price: checked ? '0' : planForm.price,
    })
  }

  const handleSavePlan = async () => {
    if (!validatePlanForm()) return

    setSubmitting(true)

    try {
      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans'

      const response = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          duration_days: parseInt(planForm.duration_days),
          price: planForm.is_trial ? 0 : parseFloat(planForm.price),
          is_trial: planForm.is_trial,
          is_active: planForm.is_active,
        }),
      })

      if (response.ok) {
        setPlanDialogOpen(false)
        fetchPlans()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju plana')
      }
    } catch (error) {
      alert('Greška pri čuvanju plana')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async (plan: Plan) => {
    if (plan.is_trial) {
      alert('Trial plan ne može biti obrisan jer je sistemski plan')
      return
    }

    if (plan.usage_count && plan.usage_count > 0) {
      alert(`Plan je u upotrebi kod ${plan.usage_count} salon(a) i ne može se obrisati`)
      return
    }

    if (!confirm('Da li ste sigurni da želite da obrišete ovaj plan?')) return

    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPlans()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri brisanju plana')
      }
    } catch (error) {
      alert('Greška pri brisanju plana')
    }
  }

  // Admin account functions
  const handleSaveAdminProfile = async () => {
    setSavingAdmin(true)
    setAdminMessage('')

    try {
      const response = await fetch('/api/admin/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminSettings),
      })

      if (response.ok) {
        setAdminMessage('Podaci sačuvani')
        setTimeout(() => setAdminMessage(''), 3000)
      } else {
        const data = await response.json()
        setAdminMessage(data.error || 'Greška pri čuvanju')
      }
    } catch (error) {
      setAdminMessage('Greška pri čuvanju')
    } finally {
      setSavingAdmin(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAdminMessage('Lozinke se ne poklapaju')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setAdminMessage('Lozinka mora imati najmanje 8 karaktera')
      return
    }

    setSavingAdmin(true)
    setAdminMessage('')

    try {
      const response = await fetch('/api/admin/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        setAdminMessage('Lozinka promenjena')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setAdminMessage(''), 3000)
      } else {
        const data = await response.json()
        setAdminMessage(data.error || 'Greška pri promeni lozinke')
      }
    } catch (error) {
      setAdminMessage('Greška pri promeni lozinke')
    } finally {
      setSavingAdmin(false)
    }
  }

  // App settings functions
  const handleSaveAppSettings = async () => {
    setSavingApp(true)
    setAppMessage('')

    try {
      const response = await fetch('/api/admin/settings/app', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appSettings),
      })

      if (response.ok) {
        setAppMessage('Podešavanja sačuvana')
        setTimeout(() => setAppMessage(''), 3000)
      } else {
        const data = await response.json()
        setAppMessage(data.error || 'Greška pri čuvanju')
      }
    } catch (error) {
      setAppMessage('Greška pri čuvanju')
    } finally {
      setSavingApp(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Podešavanja</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Upravljanje planovima, nalogom i sistemskim podešavanjima
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 hidden sm:inline" />
              <span>Planovi</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4 hidden sm:inline" />
              <span>Admin nalog</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 hidden sm:inline" />
              <span>Sistem</span>
            </TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Planovi pretplate</CardTitle>
                  <CardDescription>Upravljanje dostupnim planovima za salone</CardDescription>
                </div>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novi plan
                </Button>
              </CardHeader>
              <CardContent className="p-0 md:pt-0">
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Učitavanje...</p>
                ) : plans.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nema planova</p>
                ) : (
                  <>
                    {/* Desktop: Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Naziv</TableHead>
                            <TableHead>Trajanje</TableHead>
                            <TableHead>Cena</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Koristi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Akcije</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plans.map((plan) => (
                            <TableRow
                              key={plan.id}
                              className="h-14 cursor-pointer hover:bg-secondary/50"
                              onClick={() => openEditDialog(plan)}
                            >
                              <TableCell className="font-medium">{plan.name}</TableCell>
                              <TableCell>{plan.duration_days} dana</TableCell>
                              <TableCell>
                                {plan.price > 0
                                  ? `${plan.price.toLocaleString('sr-RS')} RSD`
                                  : 'Besplatno'}
                              </TableCell>
                              <TableCell>
                                {plan.is_trial ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
                                    Trial
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    Plaćeni
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  {plan.usage_count || 0}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  plan.is_active
                                    ? 'bg-success/10 text-success'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {plan.is_active ? 'Aktivan' : 'Neaktivan'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); openEditDialog(plan) }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan) }}
                                          disabled={plan.is_trial || (plan.usage_count || 0) > 0}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {plan.is_trial
                                        ? 'Trial plan je sistemski i ne može se obrisati'
                                        : (plan.usage_count || 0) > 0
                                        ? `Plan koristi ${plan.usage_count} salon(a)`
                                        : 'Obriši plan'}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile: Cards */}
                    <div className="md:hidden p-4 space-y-3">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className="p-4 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                          onClick={() => openEditDialog(plan)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{plan.name}</h3>
                              <p className="text-sm text-muted-foreground">{plan.duration_days} dana</p>
                            </div>
                            <span className="text-lg font-bold text-primary">
                              {plan.price > 0
                                ? `${plan.price.toLocaleString('sr-RS')} RSD`
                                : 'Besplatno'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              {plan.is_trial ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
                                  Trial
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  Plaćeni
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                plan.is_active
                                  ? 'bg-success/10 text-success'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {plan.is_active ? 'Aktivan' : 'Neaktivan'}
                              </span>
                            </div>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {plan.usage_count || 0} salona
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Plan Info Card */}
            <Card className="border-info/30 bg-info/5">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">O planovima pretplate</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• <strong>Trial plan</strong> - besplatan, koristi se za nove salone (automatski 0 RSD)</li>
                      <li>• <strong>Plaćeni plan</strong> - mora imati cenu veću od 0 RSD</li>
                      <li>• Planovi koji su u upotrebi ne mogu se obrisati</li>
                      <li>• Deaktivirani planovi nisu vidljivi pri izboru, ali postojeće pretplate ostaju</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Account Tab */}
          <TabsContent value="account" className="space-y-4">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profil administratora</CardTitle>
                <CardDescription>Vaši osnovni podaci</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Ime i prezime</Label>
                    <Input
                      id="admin-name"
                      value={adminSettings.name}
                      onChange={(e) => setAdminSettings({ ...adminSettings, name: e.target.value })}
                      placeholder="Vaše ime"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email adresa</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminSettings.email}
                      onChange={(e) => setAdminSettings({ ...adminSettings, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                {adminMessage && (
                  <p className={`text-sm ${adminMessage.includes('Greška') || adminMessage.includes('ne poklapaju') ? 'text-destructive' : 'text-success'}`}>
                    {adminMessage}
                  </p>
                )}

                <Button onClick={handleSaveAdminProfile} disabled={savingAdmin}>
                  {savingAdmin ? 'Čuvanje...' : 'Sačuvaj profil'}
                </Button>
              </CardContent>
            </Card>

            {/* Password Card */}
            <Card>
              <CardHeader>
                <CardTitle>Promena lozinke</CardTitle>
                <CardDescription>Ažurirajte lozinku za pristup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Trenutna lozinka</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova lozinka</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Potvrdi novu lozinku</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Lozinka mora imati najmanje 8 karaktera</p>
                <Button
                  onClick={handleChangePassword}
                  disabled={savingAdmin || !passwordForm.currentPassword || !passwordForm.newPassword}
                  variant="outline"
                >
                  {savingAdmin ? 'Čuvanje...' : 'Promeni lozinku'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-4">
            {/* Default Values Card */}
            <Card>
              <CardHeader>
                <CardTitle>Podrazumevane vrednosti za nove salone</CardTitle>
                <CardDescription>Ove vrednosti se primenjuju kada se kreira novi salon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="trial-days">Trial period (dana)</Label>
                    <Input
                      id="trial-days"
                      type="number"
                      value={appSettings.default_trial_days}
                      onChange={(e) => setAppSettings({ ...appSettings, default_trial_days: parseInt(e.target.value) || 14 })}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work-start">Početak radnog vremena</Label>
                    <Select
                      value={appSettings.default_working_hours_start}
                      onValueChange={(value) => setAppSettings({ ...appSettings, default_working_hours_start: value })}
                    >
                      <SelectTrigger id="work-start">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['07:00', '08:00', '09:00', '10:00', '11:00'].map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work-end">Kraj radnog vremena</Label>
                    <Select
                      value={appSettings.default_working_hours_end}
                      onValueChange={(value) => setAppSettings({ ...appSettings, default_working_hours_end: value })}
                    >
                      <SelectTrigger id="work-end">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slot-duration">Trajanje slota (min)</Label>
                    <Select
                      value={appSettings.default_slot_duration.toString()}
                      onValueChange={(value) => setAppSettings({ ...appSettings, default_slot_duration: parseInt(value) })}
                    >
                      <SelectTrigger id="slot-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[15, 30, 45, 60].map(duration => (
                          <SelectItem key={duration} value={duration.toString()}>{duration} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advance-days">Max. zakazivanje unapred (dana)</Label>
                    <Input
                      id="advance-days"
                      type="number"
                      value={appSettings.max_booking_advance_days}
                      onChange={(e) => setAppSettings({ ...appSettings, max_booking_advance_days: parseInt(e.target.value) || 90 })}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminder-hours">Podsetnik pre termina (sati)</Label>
                    <Select
                      value={appSettings.reminder_hours_before.toString()}
                      onValueChange={(value) => setAppSettings({ ...appSettings, reminder_hours_before: parseInt(value) })}
                    >
                      <SelectTrigger id="reminder-hours">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 6, 12, 24, 48].map(hours => (
                          <SelectItem key={hours} value={hours.toString()}>
                            {hours} {hours === 1 ? 'sat' : hours < 5 ? 'sata' : 'sati'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* App Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informacije o aplikaciji</CardTitle>
                <CardDescription>Osnovne informacije i kontakt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">Naziv aplikacije</Label>
                    <Input
                      id="app-name"
                      value={appSettings.app_name}
                      onChange={(e) => setAppSettings({ ...appSettings, app_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Email za podršku</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={appSettings.support_email}
                      onChange={(e) => setAppSettings({ ...appSettings, support_email: e.target.value })}
                    />
                  </div>
                </div>

                {appMessage && (
                  <p className={`text-sm ${appMessage.includes('Greška') ? 'text-destructive' : 'text-success'}`}>
                    {appMessage}
                  </p>
                )}

                <Button onClick={handleSaveAppSettings} disabled={savingApp}>
                  {savingApp ? 'Čuvanje...' : 'Sačuvaj podešavanja'}
                </Button>
              </CardContent>
            </Card>

            {/* Warning Card */}
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Napomena</p>
                    <p className="text-muted-foreground">
                      Podrazumevane vrednosti se primenjuju samo na nove salone.
                      Postojeći saloni zadržavaju svoje pojedinačne postavke.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Plan Dialog */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Izmeni plan' : 'Novi plan pretplate'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? 'Izmenite detalje plana pretplate'
                  : 'Kreirajte novi plan pretplate'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naziv plana *</Label>
                <Input
                  id="name"
                  placeholder="npr. Mesečni"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className={planErrors.name ? 'border-destructive' : ''}
                />
                {planErrors.name && (
                  <p className="text-xs text-destructive">{planErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Trajanje (dana) *</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={planForm.duration_days}
                  onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className={planErrors.duration_days ? 'border-destructive' : ''}
                />
                {planErrors.duration_days && (
                  <p className="text-xs text-destructive">{planErrors.duration_days}</p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <Label htmlFor="is_trial" className="cursor-pointer">Trial plan</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trial planovi su besplatni (cena = 0 RSD)
                  </p>
                </div>
                <Switch
                  id="is_trial"
                  checked={planForm.is_trial}
                  onCheckedChange={handleTrialToggle}
                  disabled={editingPlan?.is_trial}
                />
              </div>

              {!planForm.is_trial && (
                <div className="space-y-2">
                  <Label htmlFor="price">Cena (RSD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="2990"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className={planErrors.price ? 'border-destructive' : ''}
                  />
                  {planErrors.price && (
                    <p className="text-xs text-destructive">{planErrors.price}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Aktivan</Label>
                <Switch
                  id="is_active"
                  checked={planForm.is_active}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Otkaži
              </Button>
              <Button onClick={handleSavePlan} disabled={submitting}>
                {submitting ? 'Čuvanje...' : 'Sačuvaj'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
