'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  Upload,
  Download,
  Power,
  PowerOff,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  Store,
  Copy,
  ExternalLink,
  MessageCircle,
  MessageSquare,
  Check,
} from 'lucide-react'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface Salon {
  id: string
  name: string
  subdomain: string
  slug: string
  email: string
  phone: string
  is_active: boolean
  subscription_status: string
  subscription_expires_at: string | null
  created_at: string
}

interface Plan {
  id: string
  name: string
  duration_days: number
  price: number
  is_trial: boolean
}

export default function SaloniPage() {
  const router = useRouter()
  const [salons, setSalons] = useState<Salon[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState('all')

  // CSV Import
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    plan_id: '',
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // New salon dialog
  const [newSalonDialogOpen, setNewSalonDialogOpen] = useState(false)
  const [newSalonForm, setNewSalonForm] = useState({
    name: '',
    subdomain: '',
    email: '',
    phone: '',
    ownerEmail: '',
    trialDays: '30',
    description: '',
  })
  const [creatingSalon, setCreatingSalon] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [salonsRes, plansRes] = await Promise.all([
        fetch('/api/admin/salons'),
        fetch('/api/admin/plans'),
      ])

      if (salonsRes.ok) {
        const data = await salonsRes.json()
        setSalons(data.salons || [])
      }

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate days remaining for a salon
  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 0
    const now = new Date()
    return Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Stats
  const stats = useMemo(() => {
    const expired = salons.filter(s => getDaysRemaining(s.subscription_expires_at) <= 0).length
    const expiring = salons.filter(s => {
      const days = getDaysRemaining(s.subscription_expires_at)
      return days > 0 && days <= 7
    }).length
    const active = salons.filter(s => getDaysRemaining(s.subscription_expires_at) > 7).length
    const total = salons.length

    return { expired, expiring, active, total }
  }, [salons])

  // Filter salons
  const filteredSalons = useMemo(() => {
    let filtered = salons

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          s.subdomain.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s =>
        statusFilter === 'active' ? s.is_active : !s.is_active
      )
    }

    // Subscription filter
    if (subscriptionFilter !== 'all') {
      if (subscriptionFilter === 'expired') {
        filtered = filtered.filter(s => getDaysRemaining(s.subscription_expires_at) <= 0)
      } else if (subscriptionFilter === 'expiring') {
        filtered = filtered.filter(s => {
          const days = getDaysRemaining(s.subscription_expires_at)
          return days > 0 && days <= 7
        })
      } else if (subscriptionFilter === 'ok') {
        filtered = filtered.filter(s => getDaysRemaining(s.subscription_expires_at) > 7)
      } else if (subscriptionFilter === 'trial') {
        filtered = filtered.filter(s => s.subscription_status === 'trial')
      }
    }

    // Sort: expired first, then expiring, then by name
    return filtered.sort((a, b) => {
      const daysA = getDaysRemaining(a.subscription_expires_at)
      const daysB = getDaysRemaining(b.subscription_expires_at)

      // Expired and expiring first
      if (daysA <= 0 && daysB > 0) return -1
      if (daysB <= 0 && daysA > 0) return 1
      if (daysA <= 7 && daysB > 7) return -1
      if (daysB <= 7 && daysA > 7) return 1

      // Then by name
      return a.name.localeCompare(b.name)
    })
  }, [salons, search, statusFilter, subscriptionFilter])

  const toggleSalonStatus = async (salon: Salon) => {
    try {
      const response = await fetch(`/api/admin/salons/${salon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !salon.is_active }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling salon status:', error)
    }
  }

  const handleImpersonate = async (salonId: string) => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: salonId }),
      })
      if (response.ok) {
        window.open('/dashboard', '_blank')
      } else {
        alert('Greška pri aktiviranju God Mode')
      }
    } catch (error) {
      console.error('Error impersonating:', error)
      alert('Greška pri aktiviranju God Mode')
    }
  }

  const copyBookingLink = (salon: Salon) => {
    const url = `${window.location.origin}/book/${salon.slug || salon.subdomain}`
    navigator.clipboard.writeText(url)
    setCopiedId(salon.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[čć]/g, 'c')
      .replace(/[š]/g, 's')
      .replace(/[ž]/g, 'z')
      .replace(/[đ]/g, 'dj')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setNewSalonForm({ ...newSalonForm, name, subdomain: slug })
  }

  const handleCreateSalon = async () => {
    setCreatingSalon(true)
    setCreateError('')

    try {
      const response = await fetch('/api/admin/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSalonForm,
          trialDays: parseInt(newSalonForm.trialDays),
        }),
      })

      if (response.ok) {
        setNewSalonDialogOpen(false)
        setNewSalonForm({
          name: '',
          subdomain: '',
          email: '',
          phone: '',
          ownerEmail: '',
          trialDays: '30',
          description: '',
        })
        fetchData()
      } else {
        const data = await response.json()
        setCreateError(data.error || 'Greška pri kreiranju salona')
      }
    } catch (error) {
      setCreateError('Greška pri kreiranju salona')
    } finally {
      setCreatingSalon(false)
    }
  }

  const openWhatsApp = (salon: Salon) => {
    if (salon.phone) {
      const phone = salon.phone.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${phone}`, '_blank')
    }
  }

  const openBookingPage = (salon: Salon) => {
    window.open(`/book/${salon.slug || salon.subdomain}`, '_blank')
  }

  const downloadCSVTemplate = () => {
    const template = 'naziv,email,telefon,subdomen,vlasnik_email,vlasnik_lozinka\nPrimer Salon,salon@email.com,+381601234567,primer-salon,vlasnik@email.com,lozinka123'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'saloni-template.csv'
    a.click()
  }

  const handleImportCSV = async () => {
    if (!importFile) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', importFile)

    try {
      const response = await fetch('/api/admin/salons/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Uspešno importovano ${data.imported} salona`)
        setImportDialogOpen(false)
        setImportFile(null)
        fetchData()
      } else {
        alert(data.error || 'Greška pri importu')
      }
    } catch (error) {
      alert('Greška pri importu')
    } finally {
      setImporting(false)
    }
  }

  const openPaymentDialog = (salon: Salon) => {
    setSelectedSalon(salon)
    setPaymentForm({
      plan_id: '',
      amount: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    })
    setPaymentDialogOpen(true)
  }

  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    setPaymentForm({
      ...paymentForm,
      plan_id: planId,
      amount: plan ? plan.price.toString() : '',
    })
  }

  const handleRecordPayment = async () => {
    if (!selectedSalon || !paymentForm.plan_id) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: selectedSalon.id,
          plan_id: paymentForm.plan_id,
          amount: parseFloat(paymentForm.amount),
          payment_date: paymentForm.payment_date,
          notes: paymentForm.notes || null,
        }),
      })

      if (response.ok) {
        setPaymentDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri evidentiranju uplate')
      }
    } catch (error) {
      alert('Greška pri evidentiranju uplate')
    } finally {
      setSubmitting(false)
    }
  }

  const getSubscriptionBadge = (status: string, expiresAt: string | null) => {
    const daysRemaining = getDaysRemaining(expiresAt)

    if (status === 'payment_pending') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
          <CreditCard className="h-3 w-3" />
          Uplata kasni
        </span>
      )
    }
    if (daysRemaining <= 0) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
          <AlertTriangle className="h-3 w-3" />
          Istekla
        </span>
      )
    }
    if (daysRemaining <= 7) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
          <Clock className="h-3 w-3" />
          Ističe za {daysRemaining}d
        </span>
      )
    }
    if (status === 'trial') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
          Trial
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
        <CheckCircle className="h-3 w-3" />
        Aktivna
      </span>
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSubscriptionFilter('all')
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Saloni</h1>
          <p className="text-base sm:text-lg text-muted-foreground hidden md:block">
            {stats.total} salona u sistemu
          </p>
          {/* Compact stats for mobile */}
          <p className="text-sm text-muted-foreground md:hidden">
            {stats.expired > 0 && <span className="text-destructive font-semibold">{stats.expired} isteklo</span>}
            {stats.expired > 0 && stats.expiring > 0 && ' · '}
            {stats.expiring > 0 && <span className="text-warning font-semibold">{stats.expiring} ističe</span>}
            {(stats.expired > 0 || stats.expiring > 0) && ' · '}
            <span>{stats.total} ukupno</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button onClick={() => setNewSalonDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novi salon
          </Button>
        </div>
      </div>

      {/* Desktop: Stats Cards */}
      <div className="hidden md:grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all ${subscriptionFilter === 'expired' ? 'ring-2 ring-destructive' : ''} ${stats.expired > 0 ? 'border-destructive/50' : ''}`}
          onClick={() => setSubscriptionFilter(subscriptionFilter === 'expired' ? 'all' : 'expired')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Istekle pretplate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">zahteva akciju</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${subscriptionFilter === 'expiring' ? 'ring-2 ring-warning' : ''} ${stats.expiring > 0 ? 'border-warning/50' : ''}`}
          onClick={() => setSubscriptionFilter(subscriptionFilter === 'expiring' ? 'all' : 'expiring')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ističu uskoro</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">u narednih 7 dana</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${subscriptionFilter === 'ok' ? 'ring-2 ring-success' : ''}`}
          onClick={() => setSubscriptionFilter(subscriptionFilter === 'ok' ? 'all' : 'ok')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivne pretplate</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
            <p className="text-xs text-muted-foreground">sve u redu</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${subscriptionFilter === 'all' && statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={clearFilters}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno salona</CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">u sistemu</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pretraži po nazivu, email-u ili subdomenu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi statusi</SelectItem>
                <SelectItem value="active">Aktivni</SelectItem>
                <SelectItem value="inactive">Neaktivni</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Pretplata" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve pretplate</SelectItem>
                <SelectItem value="expired">Istekle</SelectItem>
                <SelectItem value="expiring">Ističu uskoro</SelectItem>
                <SelectItem value="ok">Aktivne</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'all' || subscriptionFilter !== 'all') && (
              <Button variant="outline" onClick={clearFilters} className="sm:w-auto">
                Poništi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Salons List */}
      <Card>
        <CardHeader className="pb-3 md:hidden">
          <CardTitle>Lista salona</CardTitle>
          <p className="text-sm text-muted-foreground">
            Prikazano: <span className="font-semibold text-foreground">{filteredSalons.length}</span> od {stats.total}
          </p>
        </CardHeader>
        <CardContent className="p-0 md:p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all' || subscriptionFilter !== 'all'
                  ? 'Nema salona koji odgovaraju filterima'
                  : 'Nema salona'}
              </p>
              {!search && statusFilter === 'all' && subscriptionFilter === 'all' && (
                <Button onClick={() => setNewSalonDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj prvi salon
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Naziv</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Pretplata</TableHead>
                      <TableHead>Ističe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalons.map((salon) => {
                      const daysRemaining = getDaysRemaining(salon.subscription_expires_at)
                      return (
                        <TableRow
                          key={salon.id}
                          className="cursor-pointer hover:bg-secondary/50 h-14"
                          onClick={() => router.push(`/admin/saloni/${salon.id}`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-semibold">{salon.name}</p>
                              <p className="text-sm text-muted-foreground">{salon.subdomain}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{salon.email}</TableCell>
                          <TableCell>
                            {getSubscriptionBadge(salon.subscription_status, salon.subscription_expires_at)}
                          </TableCell>
                          <TableCell>
                            {salon.subscription_expires_at ? (
                              <div>
                                <p className="text-sm">{format(new Date(salon.subscription_expires_at), 'd. MMM yyyy', { locale: srLatn })}</p>
                                <p className={`text-xs ${daysRemaining <= 0 ? 'text-destructive' : daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                                  {daysRemaining > 0
                                    ? `još ${daysRemaining} dana`
                                    : daysRemaining === 0
                                    ? 'ističe danas'
                                    : `istekla pre ${Math.abs(daysRemaining)} dana`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                salon.is_active
                                  ? 'bg-success/10 text-success'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {salon.is_active ? 'Aktivan' : 'Neaktivan'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/saloni/${salon.id}`)
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Pregled
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/saloni/${salon.id}?tab=crm`)
                                }}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  CRM
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  openPaymentDialog(salon)
                                }}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Evidentiraj uplatu
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  handleImpersonate(salon.id)
                                }}>
                                  <UserCog className="mr-2 h-4 w-4" />
                                  God Mode
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  copyBookingLink(salon)
                                }}>
                                  {copiedId === salon.id ? (
                                    <>
                                      <Check className="mr-2 h-4 w-4 text-success" />
                                      Kopirano!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Kopiraj booking link
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  openBookingPage(salon)
                                }}>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Otvori booking
                                </DropdownMenuItem>
                                {salon.phone && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    openWhatsApp(salon)
                                  }}>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    WhatsApp
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSalonStatus(salon)
                                }}>
                                  {salon.is_active ? (
                                    <>
                                      <PowerOff className="mr-2 h-4 w-4" />
                                      Deaktiviraj
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-4 w-4" />
                                      Aktiviraj
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden p-4 space-y-3">
                {filteredSalons.map((salon) => {
                  const daysRemaining = getDaysRemaining(salon.subscription_expires_at)
                  return (
                    <div
                      key={salon.id}
                      className="p-4 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => router.push(`/admin/saloni/${salon.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">{salon.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{salon.email}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/saloni/${salon.id}?tab=crm`)
                            }}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              CRM
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              openPaymentDialog(salon)
                            }}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Evidentiraj uplatu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleImpersonate(salon.id)
                            }}>
                              <UserCog className="mr-2 h-4 w-4" />
                              God Mode
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              copyBookingLink(salon)
                            }}>
                              {copiedId === salon.id ? (
                                <>
                                  <Check className="mr-2 h-4 w-4 text-success" />
                                  Kopirano!
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Kopiraj link
                                </>
                              )}
                            </DropdownMenuItem>
                            {salon.phone && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                openWhatsApp(salon)
                              }}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              toggleSalonStatus(salon)
                            }}>
                              {salon.is_active ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deaktiviraj
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Aktiviraj
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSubscriptionBadge(salon.subscription_status, salon.subscription_expires_at)}
                        </div>
                        {salon.subscription_expires_at && (
                          <span className={`text-xs ${daysRemaining <= 0 ? 'text-destructive' : daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {daysRemaining > 0
                              ? `još ${daysRemaining}d`
                              : `pre ${Math.abs(daysRemaining)}d`}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* CSV Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import salona iz CSV</DialogTitle>
            <DialogDescription>
              Učitajte CSV fajl sa listom salona za kreiranje
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Button variant="outline" onClick={downloadCSVTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Preuzmi CSV template
              </Button>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {importFile ? importFile.name : 'Klikni za odabir CSV fajla'}
                </p>
              </label>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Očekivana polja:</p>
              <code className="text-xs">naziv, email, telefon, subdomen, vlasnik_email, vlasnik_lozinka</code>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleImportCSV} disabled={!importFile || importing}>
              {importing ? 'Importovanje...' : 'Importuj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Salon Dialog */}
      <Dialog open={newSalonDialogOpen} onOpenChange={(open) => {
        setNewSalonDialogOpen(open)
        if (!open) setCreateError('')
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novi salon</DialogTitle>
            <DialogDescription>Kreirajte novi salon i vlasnikov nalog</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salon_name">Naziv salona *</Label>
              <Input
                id="salon_name"
                value={newSalonForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="npr. Beauty Studio Milana"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salon_subdomain">Subdomen *</Label>
              <Input
                id="salon_subdomain"
                value={newSalonForm.subdomain}
                onChange={(e) => setNewSalonForm({ ...newSalonForm, subdomain: e.target.value })}
                placeholder="beauty-studio-milana"
              />
              <p className="text-xs text-muted-foreground">/book/{newSalonForm.subdomain || 'subdomen'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salon_email">Email salona</Label>
                <Input
                  id="salon_email"
                  type="email"
                  value={newSalonForm.email}
                  onChange={(e) => setNewSalonForm({ ...newSalonForm, email: e.target.value })}
                  placeholder="salon@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salon_phone">Telefon</Label>
                <Input
                  id="salon_phone"
                  value={newSalonForm.phone}
                  onChange={(e) => setNewSalonForm({ ...newSalonForm, phone: e.target.value })}
                  placeholder="+381..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_email">Email vlasnika *</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={newSalonForm.ownerEmail}
                  onChange={(e) => setNewSalonForm({ ...newSalonForm, ownerEmail: e.target.value })}
                  placeholder="vlasnik@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Trial period</Label>
                <Select value={newSalonForm.trialDays} onValueChange={(v) => setNewSalonForm({ ...newSalonForm, trialDays: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dana</SelectItem>
                    <SelectItem value="14">14 dana</SelectItem>
                    <SelectItem value="30">30 dana</SelectItem>
                    <SelectItem value="45">45 dana</SelectItem>
                    <SelectItem value="60">60 dana</SelectItem>
                    <SelectItem value="90">90 dana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salon_desc">Opis</Label>
              <Textarea
                id="salon_desc"
                value={newSalonForm.description}
                onChange={(e) => setNewSalonForm({ ...newSalonForm, description: e.target.value })}
                placeholder="Kratki opis salona (opciono)"
                rows={2}
              />
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewSalonDialogOpen(false)}>
              Otkaži
            </Button>
            <Button
              onClick={handleCreateSalon}
              disabled={creatingSalon || !newSalonForm.name || !newSalonForm.subdomain || !newSalonForm.ownerEmail}
            >
              {creatingSalon ? 'Kreiranje...' : 'Kreiraj salon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evidentiraj uplatu</DialogTitle>
            <DialogDescription>
              {selectedSalon?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan *</Label>
              <Select value={paymentForm.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Izaberi plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => !p.is_trial).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price.toLocaleString('sr-RS')} RSD ({plan.duration_days} dana)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Iznos (RSD) *</Label>
              <Input
                id="amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Datum uplate *</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Napomena</Label>
              <Textarea
                id="notes"
                placeholder="Opciona napomena..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleRecordPayment} disabled={submitting || !paymentForm.plan_id}>
              {submitting ? 'Čuvanje...' : 'Evidentiraj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
