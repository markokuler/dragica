'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Users,
  BarChart3,
  ExternalLink,
  UserCog,
  Save,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  Mail,
  Phone,
  Globe,
  CalendarDays,
  CheckCircle2,
  Activity,
  Trash2,
  FileText,
  Building,
  Tag,
  MessageSquare,
  PhoneCall,
  Video,
  StickyNote,
  Bell,
  X,
} from 'lucide-react'

interface Salon {
  id: string
  name: string
  subdomain: string
  slug: string
  email: string
  phone: string
  description: string | null
  logo_url: string | null
  accent_color: string | null
  is_active: boolean
  subscription_status: string
  subscription_expires_at: string | null
  created_at: string
  admin_notes: string | null
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  notes: string | null
  plan_name: string
  plan_id: string | null
  duration_days: number
  created_at: string
}

interface Plan {
  id: string
  name: string
  duration_days: number
  price: number
  is_active: boolean
}

interface Stats {
  bookings: {
    total: number
    thisMonth: number
    lastMonth: number
    lastActivityDate: string | null
  }
  clients: { total: number }
  services: { total: number; active: number }
  engagement: { onlineBookingRate: number; completionRate: number }
  activity: { ownerCreatedAt: string | null; workingDays: number }
}

interface SalonTag {
  id: string
  tag_id: string
  name: string
  color: string
}

interface AvailableTag {
  id: string
  name: string
  color: string
}

interface Contact {
  id: string
  contact_type: string
  description: string
  contact_date: string
  created_at: string
}

interface Reminder {
  id: string
  title: string
  description: string | null
  reminder_date: string
  is_completed: boolean
  tenant_id: string | null
}

const CONTACT_TYPES = [
  { value: 'call', label: 'Poziv', icon: PhoneCall },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Sastanak', icon: Video },
  { value: 'note', label: 'Beleška', icon: StickyNote },
  { value: 'other', label: 'Ostalo', icon: MessageSquare },
]

export default function SalonBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const salonId = params.id as string

  const validTabs = ['pregled', 'crm', 'uplate', 'statistika', 'podesavanja']
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'pregled'

  const [salon, setSalon] = useState<Salon | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)

  // CRM state
  const [tags, setTags] = useState<SalonTag[]>([])
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  // Notes form
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesMessage, setNotesMessage] = useState('')

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    plan_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [savingPayment, setSavingPayment] = useState(false)

  // Contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [contactForm, setContactForm] = useState({
    contact_type: 'call',
    description: '',
    contact_date: new Date().toISOString().split('T')[0],
  })
  const [savingContact, setSavingContact] = useState(false)

  // Reminder dialog
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    reminder_date: new Date().toISOString().split('T')[0],
  })
  const [savingReminder, setSavingReminder] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchSalon()
    fetchStats()
    fetchPayments()
    fetchPlans()
    fetchTags()
    fetchAvailableTags()
    fetchContacts()
    fetchReminders()
  }, [salonId])

  const fetchSalon = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`)
      if (response.ok) {
        const data = await response.json()
        setSalon(data.salon)
        setAdminNotes(data.salon.admin_notes || '')
      } else {
        router.push('/admin/saloni')
      }
    } catch (error) {
      console.error('Error fetching salon:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/payments`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setTotalPaid(data.total_paid || 0)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans?.filter((p: Plan) => p.is_active) || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/tags`)
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching available tags:', error)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const fetchReminders = async () => {
    try {
      const response = await fetch(`/api/admin/reminders?tenantId=${salonId}`)
      if (response.ok) {
        const data = await response.json()
        setReminders(data.reminders || [])
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
  }

  // Notes
  const handleSaveNotes = async () => {
    setSavingNotes(true)
    setNotesMessage('')
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      })
      if (response.ok) {
        setNotesMessage('Sačuvano')
        setTimeout(() => setNotesMessage(''), 3000)
      } else {
        setNotesMessage('Greška')
      }
    } catch {
      setNotesMessage('Greška pri čuvanju')
    } finally {
      setSavingNotes(false)
    }
  }

  // Status toggle
  const toggleSalonStatus = async () => {
    if (!salon) return
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !salon.is_active }),
      })
      if (response.ok) fetchSalon()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  // God Mode
  const handleImpersonate = async () => {
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

  // Tags
  const addTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId }),
      })
      if (response.ok) fetchTags()
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }

  const removeTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/tags?tagId=${tagId}`, {
        method: 'DELETE',
      })
      if (response.ok) fetchTags()
    } catch (error) {
      console.error('Error removing tag:', error)
    }
  }

  // Payment
  const openPaymentDialog = () => {
    setPaymentForm({
      plan_id: plans[0]?.id || '',
      amount: plans[0]?.price?.toString() || '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setPaymentDialogOpen(true)
  }

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    setPaymentForm({
      ...paymentForm,
      plan_id: planId,
      amount: plan?.price?.toString() || paymentForm.amount,
    })
  }

  const handleSavePayment = async () => {
    if (!paymentForm.plan_id || !paymentForm.amount || !paymentForm.payment_date) return
    setSavingPayment(true)
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })
      if (response.ok) {
        setPaymentDialogOpen(false)
        fetchPayments()
        fetchSalon()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška')
      }
    } catch {
      alert('Greška pri čuvanju')
    } finally {
      setSavingPayment(false)
    }
  }

  // Contact
  const handleSaveContact = async () => {
    if (!contactForm.description) return
    setSavingContact(true)
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (response.ok) {
        setContactDialogOpen(false)
        setContactForm({ contact_type: 'call', description: '', contact_date: new Date().toISOString().split('T')[0] })
        fetchContacts()
      }
    } catch {
      alert('Greška pri čuvanju')
    } finally {
      setSavingContact(false)
    }
  }

  const deleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}/contacts/${contactId}`, {
        method: 'DELETE',
      })
      if (response.ok) fetchContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  // Reminder
  const handleSaveReminder = async () => {
    if (!reminderForm.title || !reminderForm.reminder_date) return
    setSavingReminder(true)
    try {
      const response = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reminderForm, tenant_id: salonId }),
      })
      if (response.ok) {
        setReminderDialogOpen(false)
        setReminderForm({ title: '', description: '', reminder_date: new Date().toISOString().split('T')[0] })
        fetchReminders()
      }
    } catch {
      alert('Greška pri čuvanju')
    } finally {
      setSavingReminder(false)
    }
  }

  const toggleReminder = async (reminder: Reminder) => {
    try {
      await fetch(`/api/admin/reminders/${reminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !reminder.is_completed }),
      })
      fetchReminders()
    } catch (error) {
      console.error('Error toggling reminder:', error)
    }
  }

  const deleteReminder = async (reminderId: string) => {
    try {
      await fetch(`/api/admin/reminders/${reminderId}`, { method: 'DELETE' })
      fetchReminders()
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  // Delete salon
  const handleDeleteSalon = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`, { method: 'DELETE' })
      if (response.ok) router.push('/admin/saloni')
      else alert('Greška pri brisanju salona')
    } catch {
      alert('Greška pri brisanju')
    }
  }

  // Subscription status
  const getSubscriptionStatus = () => {
    if (!salon) return { status: 'unknown', color: 'muted', text: 'Nepoznato', daysLeft: 0 }
    if (!salon.subscription_expires_at) return { status: 'none', color: 'muted', text: 'Bez pretplate', daysLeft: 0 }
    const now = new Date()
    const expiry = new Date(salon.subscription_expires_at)
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return { status: 'expired', color: 'destructive', text: 'Istekla', daysLeft }
    if (daysLeft <= 7) return { status: 'expiring', color: 'warning', text: 'Ističe uskoro', daysLeft }
    return { status: 'active', color: 'success', text: 'Aktivna', daysLeft }
  }

  const subscriptionStatus = getSubscriptionStatus()

  const getAccountAge = () => {
    if (!salon) return ''
    const months = Math.floor((new Date().getTime() - new Date(salon.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (months < 1) return 'Manje od mesec dana'
    if (months === 1) return '1 mesec'
    if (months < 12) return `${months} meseci`
    const years = Math.floor(months / 12)
    return years === 1 ? '1 godina' : `${years} godine`
  }

  const getBookingTrend = () => {
    if (!stats) return { trend: 0, isUp: true }
    const current = stats.bookings.thisMonth
    const last = stats.bookings.lastMonth
    if (last === 0) return { trend: current > 0 ? 100 : 0, isUp: true }
    const trend = Math.round(((current - last) / last) * 100)
    return { trend: Math.abs(trend), isUp: trend >= 0 }
  }

  const bookingTrend = getBookingTrend()
  const unusedTags = availableTags.filter((at) => !tags.some((t) => t.tag_id === at.id))

  const getContactIcon = (type: string) => {
    const found = CONTACT_TYPES.find((ct) => ct.value === type)
    return found ? found.icon : MessageSquare
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Salon nije pronađen</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/saloni">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif truncate">{salon.name}</h1>
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white text-xs"
              >
                {tag.name}
                <button onClick={() => removeTag(tag.tag_id)} className="ml-1 hover:text-white/70">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Globe className="h-3 w-3" />
            {salon.subdomain}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleImpersonate}>
            <UserCog className="h-4 w-4 mr-2" />
            God Mode
          </Button>
          <a href={`/book/${salon.slug || salon.subdomain}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Booking
            </Button>
          </a>
          <Badge
            variant={salon.is_active ? 'default' : 'destructive'}
            className={salon.is_active ? 'bg-success hover:bg-success' : ''}
          >
            {salon.is_active ? 'Aktivan' : 'Neaktivan'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pretplata</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold text-${subscriptionStatus.color}`}>
              {subscriptionStatus.text}
            </div>
            {subscriptionStatus.daysLeft !== 0 && (
              <p className="text-xs text-muted-foreground">
                {subscriptionStatus.daysLeft > 0 ? `još ${subscriptionStatus.daysLeft} dana` : `istekla pre ${Math.abs(subscriptionStatus.daysLeft)} dana`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zakazivanja (mesec)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bookings.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {bookingTrend.isUp ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
              {bookingTrend.trend}% vs prošli mesec
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klijenti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clients.total || 0}</div>
            <p className="text-xs text-muted-foreground">registrovanih</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno uplaćeno</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaid.toLocaleString('sr-RS')} RSD</div>
            <p className="text-xs text-muted-foreground">{payments.length} uplata</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pregled">Pregled</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="uplate">Uplate</TabsTrigger>
          <TabsTrigger value="statistika">Statistika</TabsTrigger>
          <TabsTrigger value="podesavanja">Podešavanja</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="pregled" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Osnovne informacije
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{salon.email || 'Nije unet'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{salon.phone || 'Nije unet'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">/book/{salon.slug || salon.subdomain}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Kreiran: {new Date(salon.created_at).toLocaleDateString('sr-RS')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Starost naloga: {getAccountAge()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Status pretplate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={subscriptionStatus.status === 'expired' ? 'destructive' : 'default'} className={subscriptionStatus.status === 'active' ? 'bg-success hover:bg-success' : subscriptionStatus.status === 'expiring' ? 'bg-warning hover:bg-warning text-warning-foreground' : ''}>
                    {subscriptionStatus.text}
                  </Badge>
                </div>
                {salon.subscription_expires_at && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ističe:</span>
                      <span className="text-sm font-medium">{new Date(salon.subscription_expires_at).toLocaleDateString('sr-RS')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Preostalo:</span>
                      <span className={`text-sm font-medium ${subscriptionStatus.daysLeft <= 0 ? 'text-destructive' : subscriptionStatus.daysLeft <= 7 ? 'text-warning' : 'text-success'}`}>
                        {subscriptionStatus.daysLeft > 0 ? `${subscriptionStatus.daysLeft} dana` : 'Istekla'}
                      </span>
                    </div>
                  </>
                )}
                <Button onClick={openPaymentDialog} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Evidentiraj uplatu
                </Button>
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Aktivnost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Poslednje zakazivanje:</span>
                  <span className="text-sm">{stats?.bookings.lastActivityDate ? new Date(stats.bookings.lastActivityDate).toLocaleDateString('sr-RS') : 'Nema'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Aktivnih usluga:</span>
                  <span className="text-sm">{stats?.services.active || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Radnih dana:</span>
                  <span className="text-sm">{stats?.activity.workingDays || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Admin beleške
                </CardTitle>
                <CardDescription>Privatne beleške o salonu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Dodaj beleške o salonu..." rows={4} />
                <div className="flex items-center gap-4">
                  <Button onClick={handleSaveNotes} disabled={savingNotes} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {savingNotes ? 'Čuvanje...' : 'Sačuvaj'}
                  </Button>
                  {notesMessage && <span className={`text-sm ${notesMessage === 'Sačuvano' ? 'text-success' : 'text-destructive'}`}>{notesMessage}</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CRM Tab */}
        <TabsContent value="crm" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tagovi
                </CardTitle>
                <CardDescription>Označi salon za lakše filtriranje</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nema tagova</p>
                  ) : (
                    tags.map((tag) => (
                      <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white">
                        {tag.name}
                        <button onClick={() => removeTag(tag.tag_id)} className="ml-1 hover:text-white/70">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                {unusedTags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Dodaj tag:</p>
                    <div className="flex flex-wrap gap-2">
                      {unusedTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => addTag(tag.id)}
                          className="px-2 py-1 text-xs rounded border border-dashed hover:bg-secondary transition-colors"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          + {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reminders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Podsećanja
                  </CardTitle>
                  <CardDescription>Zakaži podsećanje za ovaj salon</CardDescription>
                </div>
                <Button size="sm" onClick={() => setReminderDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nema podsećanja</p>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((reminder) => {
                      const isOverdue = new Date(reminder.reminder_date) < new Date() && !reminder.is_completed
                      return (
                        <div key={reminder.id} className={`flex items-center gap-3 p-2 rounded-lg ${isOverdue ? 'bg-destructive/10' : 'bg-secondary/30'}`}>
                          <button onClick={() => toggleReminder(reminder)}>
                            {reminder.is_completed ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <div className={`h-5 w-5 rounded-full border-2 ${isOverdue ? 'border-destructive' : 'border-muted-foreground'}`} />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${reminder.is_completed ? 'line-through text-muted-foreground' : ''}`}>{reminder.title}</p>
                            <p className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {new Date(reminder.reminder_date).toLocaleDateString('sr-RS')}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteReminder(reminder.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Istorija kontakata
                </CardTitle>
                <CardDescription>Evidencija komunikacije sa salonom</CardDescription>
              </div>
              <Button onClick={() => setContactDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj
              </Button>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nema zabeleženih kontakata</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {contacts.map((contact) => {
                      const Icon = getContactIcon(contact.contact_type)
                      const typeLabel = CONTACT_TYPES.find((ct) => ct.value === contact.contact_type)?.label || contact.contact_type
                      return (
                        <div key={contact.id} className="relative pl-10">
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="bg-secondary/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-primary">{typeLabel}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(contact.contact_date).toLocaleDateString('sr-RS')}
                                </span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteContact(contact.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm">{contact.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="uplate" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Istorija uplata</CardTitle>
                <CardDescription>Ukupno uplaćeno: {totalPaid.toLocaleString('sr-RS')} RSD ({payments.length} uplata)</CardDescription>
              </div>
              <Button onClick={openPaymentDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nova uplata
              </Button>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nema evidentiranih uplata</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Iznos</TableHead>
                      <TableHead className="hidden md:table-cell">Napomena</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString('sr-RS')}</TableCell>
                        <TableCell>{payment.plan_name}</TableCell>
                        <TableCell className="text-right font-medium">{payment.amount.toLocaleString('sr-RS')} RSD</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{payment.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistika" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Zakazivanja</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Ukupno:</span><span className="font-bold">{stats?.bookings.total || 0}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Ovaj mesec:</span><span className="font-medium">{stats?.bookings.thisMonth || 0}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Prošli mesec:</span><span className="text-muted-foreground">{stats?.bookings.lastMonth || 0}</span></div>
                <div className="flex items-center gap-1 pt-2 border-t">
                  {bookingTrend.isUp ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  <span className={`text-sm font-medium ${bookingTrend.isUp ? 'text-success' : 'text-destructive'}`}>
                    {bookingTrend.trend}% vs prošli mesec
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Korišćenje platforme</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Online zakazivanja:</span>
                    <span className="font-medium">{stats?.engagement.onlineBookingRate || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${stats?.engagement.onlineBookingRate || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Stopa završavanja:</span>
                    <span className="font-medium">{stats?.engagement.completionRate || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-success rounded-full h-2 transition-all" style={{ width: `${stats?.engagement.completionRate || 0}%` }} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Online = zakazano preko platforme (ima link za upravljanje)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Profil salona</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Broj usluga:</span><span className="font-medium">{stats?.services.total || 0}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Aktivnih:</span><span className="text-success">{stats?.services.active || 0}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Radnih dana:</span><span>{stats?.activity.workingDays || 0}</span></div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Poslednja aktivnost:</span>
                  <span className="text-sm">{stats?.bookings.lastActivityDate ? new Date(stats.bookings.lastActivityDate).toLocaleDateString('sr-RS') : 'Nema'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="podesavanja">
          <Card>
            <CardHeader><CardTitle>Podešavanja salona</CardTitle><CardDescription>Status i napredne opcije</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium">Status salona</p>
                  <p className="text-sm text-muted-foreground">{salon.is_active ? 'Salon je aktivan i vidljiv klijentima' : 'Salon je deaktiviran'}</p>
                </div>
                <Switch checked={salon.is_active} onCheckedChange={toggleSalonStatus} />
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="font-medium mb-2">Kreiran</p>
                <p className="text-muted-foreground">{new Date(salon.created_at).toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="font-medium text-destructive mb-2">Opasna zona</p>
                <p className="text-sm text-muted-foreground mb-4">Brisanje salona će trajno ukloniti sve podatke, usluge, zakazivanja i klijente.</p>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Obriši salon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Evidentiraj uplatu</DialogTitle><DialogDescription>Unesi detalje uplate za {salon.name}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan *</Label>
              <Select value={paymentForm.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger><SelectValue placeholder="Izaberi plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name} - {plan.price.toLocaleString('sr-RS')} RSD ({plan.duration_days} dana)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Iznos (RSD) *</Label>
                <Input id="amount" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} onWheel={(e) => (e.target as HTMLInputElement).blur()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Datum uplate *</Label>
                <Input id="payment_date" type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_notes">Napomena</Label>
              <Textarea id="payment_notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Opciona napomena..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Otkaži</Button>
            <Button onClick={handleSavePayment} disabled={savingPayment || !paymentForm.plan_id || !paymentForm.amount}>{savingPayment ? 'Čuvanje...' : 'Evidentiraj'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dodaj kontakt</DialogTitle><DialogDescription>Zabeležite komunikaciju sa salonom</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tip kontakta</Label>
              <Select value={contactForm.contact_type} onValueChange={(v) => setContactForm({ ...contactForm, contact_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_date">Datum</Label>
              <Input id="contact_date" type="date" value={contactForm.contact_date} onChange={(e) => setContactForm({ ...contactForm, contact_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_desc">Opis *</Label>
              <Textarea id="contact_desc" value={contactForm.description} onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })} placeholder="Šta je dogovoreno, o čemu je bila reč..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Otkaži</Button>
            <Button onClick={handleSaveContact} disabled={savingContact || !contactForm.description}>{savingContact ? 'Čuvanje...' : 'Sačuvaj'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo podsećanje</DialogTitle><DialogDescription>Zakazite podsećanje za salon {salon.name}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_title">Naslov *</Label>
              <Input id="reminder_title" value={reminderForm.title} onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} placeholder="npr. Pozovi za produženje" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder_date">Datum *</Label>
              <Input id="reminder_date" type="date" value={reminderForm.reminder_date} onChange={(e) => setReminderForm({ ...reminderForm, reminder_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder_desc">Opis</Label>
              <Textarea id="reminder_desc" value={reminderForm.description} onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })} placeholder="Dodatne informacije..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>Otkaži</Button>
            <Button onClick={handleSaveReminder} disabled={savingReminder || !reminderForm.title || !reminderForm.reminder_date}>{savingReminder ? 'Čuvanje...' : 'Sačuvaj'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši salon {salon.name}?</AlertDialogTitle>
            <AlertDialogDescription>Ova akcija će trajno obrisati salon i sve povezane podatke (usluge, zakazivanja, klijente). Ova akcija se ne može poništiti.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSalon} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Obriši</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
