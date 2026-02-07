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
  MessageCircle,
  Send,
  Heart,
  ChevronDown,
  ChevronUp,
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
  notification_channel: 'whatsapp' | 'viber' | null
}

interface MessageLog {
  id: string
  channel: string
  trigger_type: string | null
  phone: string
  message_text: string
  status: string
  error_message: string | null
  sent_by: string | null
  created_at: string
}

interface MessageTemplate {
  id: string
  trigger_type: string
  channel: string
  name: string
  message_body: string
  is_active: boolean
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
    cancelled: number
    noShow: number
    onlineThisMonth: number
    manualThisMonth: number
    lastActivityDate: string | null
  }
  clients: { total: number }
  services: { total: number; active: number }
  engagement: { onlineBookingRate: number; completionRate: number }
  activity: { ownerCreatedAt: string | null; workingDays: number; blockedSlots: number }
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

interface AdminNote {
  id: string
  text: string
  level: 'info' | 'important' | 'critical'
  created_at: string
}

const NOTE_LEVELS = [
  { value: 'info' as const, label: 'Info', bg: 'bg-emerald-500', text: 'text-white [text-shadow:_0_1px_2px_rgba(0,0,0,0.6)]', border: 'border-emerald-700' },
  { value: 'important' as const, label: 'Važno', bg: 'bg-yellow-400', text: 'text-white [text-shadow:_-1px_-1px_0_rgba(0,0,0,0.8),_1px_-1px_0_rgba(0,0,0,0.8),_-1px_1px_0_rgba(0,0,0,0.8),_1px_1px_0_rgba(0,0,0,0.8)]', border: 'border-yellow-600' },
  { value: 'critical' as const, label: 'Kritično', bg: 'bg-red-500', text: 'text-white [text-shadow:_-1px_-1px_0_rgba(0,0,0,0.8),_1px_-1px_0_rgba(0,0,0,0.8),_-1px_1px_0_rgba(0,0,0,0.8),_1px_1px_0_rgba(0,0,0,0.8)]', border: 'border-red-700' },
]

function parseAdminNotes(raw: string | null): AdminNote[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Plain text from old format — convert to single note
    if (raw.trim()) {
      return [{
        id: crypto.randomUUID(),
        text: raw.trim(),
        level: 'info',
        created_at: new Date().toISOString(),
      }]
    }
  }
  return []
}

const CONTACT_TYPES = [
  { value: 'call', label: 'Poziv', icon: PhoneCall },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'viber', label: 'Viber', icon: MessageCircle },
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
  const [messageLog, setMessageLog] = useState<MessageLog[]>([])
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([])
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [messageChannel, setMessageChannel] = useState<'whatsapp' | 'viber'>('whatsapp')
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [contactFilter, setContactFilter] = useState('all')
  const [showAllContacts, setShowAllContacts] = useState(false)
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [showCompletedReminders, setShowCompletedReminders] = useState(false)

  // Notes
  const [adminNotesList, setAdminNotesList] = useState<AdminNote[]>([])
  const [savingNotes, setSavingNotes] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteLevel, setNewNoteLevel] = useState<AdminNote['level']>('info')

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
    fetchMessageLog()
    fetchMessageTemplates()
  }, [salonId])

  const fetchSalon = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`)
      if (response.ok) {
        const data = await response.json()
        setSalon(data.salon)
        setAdminNotesList(parseAdminNotes(data.salon.admin_notes))
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

  const fetchMessageLog = async () => {
    try {
      const response = await fetch(`/api/admin/messaging/log?tenant_id=${salonId}`)
      if (response.ok) {
        const data = await response.json()
        setMessageLog(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching message log:', error)
    }
  }

  const fetchMessageTemplates = async () => {
    try {
      const response = await fetch('/api/admin/messaging/templates')
      if (response.ok) {
        const data = await response.json()
        setMessageTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const applyTemplate = (template: MessageTemplate) => {
    let text = template.message_body
    if (salon) {
      text = text.replaceAll('{salon_name}', salon.name)
      if (salon.subscription_expires_at) {
        const expiry = new Date(salon.subscription_expires_at)
        text = text.replaceAll('{expiry_date}', expiry.toLocaleDateString('sr-RS'))
        const daysLeft = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        text = text.replaceAll('{days_left}', daysLeft.toString())
      }
    }
    setMessageText(text)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) return
    setSendingMessage(true)
    try {
      const response = await fetch('/api/admin/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: salonId,
          channel: messageChannel,
          message: messageText.trim(),
        }),
      })
      if (response.ok) {
        setMessageDialogOpen(false)
        setMessageText('')
        fetchMessageLog()
        fetchContacts()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri slanju')
      }
    } catch {
      alert('Greška pri slanju poruke')
    } finally {
      setSendingMessage(false)
    }
  }

  const updateNotificationChannel = async (channel: string) => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_channel: channel || null }),
      })
      if (response.ok) fetchSalon()
    } catch (error) {
      console.error('Error updating notification channel:', error)
    }
  }

  // Notes — persist to admin_notes as JSON
  const saveNotesList = async (notes: AdminNote[]) => {
    setSavingNotes(true)
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: JSON.stringify(notes) }),
      })
      if (response.ok) {
        setAdminNotesList(notes)
      } else {
        alert('Greška pri čuvanju beleške')
      }
    } catch {
      alert('Greška pri čuvanju')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleAddNote = () => {
    if (!newNoteText.trim()) return
    const note: AdminNote = {
      id: crypto.randomUUID(),
      text: newNoteText.trim(),
      level: newNoteLevel,
      created_at: new Date().toISOString(),
    }
    const updated = [note, ...adminNotesList]
    saveNotesList(updated)
    setNewNoteText('')
    setNewNoteLevel('info')
    setShowNoteForm(false)
  }

  const handleDeleteNote = (noteId: string) => {
    const updated = adminNotesList.filter(n => n.id !== noteId)
    saveNotesList(updated)
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

  const getCancellationRate = () => {
    if (!stats || stats.bookings.total === 0) return 0
    return Math.round((stats.bookings.cancelled / stats.bookings.total) * 100)
  }

  const getNoShowRate = () => {
    if (!stats || stats.bookings.total === 0) return 0
    return Math.round((stats.bookings.noShow / stats.bookings.total) * 100)
  }

  const getDaysSinceActivity = () => {
    if (!stats?.bookings.lastActivityDate) return null
    const last = new Date(stats.bookings.lastActivityDate)
    const now = new Date()
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getProfileCompleteness = () => {
    if (!salon || !stats) return { score: 0, items: [] as { label: string; done: boolean }[] }
    const items = [
      { label: 'Aktivne usluge', done: (stats.services.active || 0) > 0 },
      { label: 'Radno vreme', done: (stats.activity.workingDays || 0) > 0 },
      { label: 'Opis salona', done: !!salon.description },
      { label: 'Logo', done: !!salon.logo_url },
    ]
    const score = Math.round((items.filter(i => i.done).length / items.length) * 100)
    return { score, items }
  }

  const getHealthScore = () => {
    let score = 0
    if (salon?.is_active) score += 15
    if (subscriptionStatus.status === 'active') score += 25
    else if (subscriptionStatus.status === 'expiring') score += 12
    const days = getDaysSinceActivity()
    if (days !== null && days <= 7) score += 25
    else if (days !== null && days <= 14) score += 12
    if ((stats?.engagement.onlineBookingRate || 0) > 20) score += 15
    else if ((stats?.engagement.onlineBookingRate || 0) > 0) score += 7
    if (contacts.length > 0) {
      const daysSinceContact = Math.floor((new Date().getTime() - new Date(contacts[0].contact_date).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceContact <= 7) score += 10
      else if (daysSinceContact <= 30) score += 5
      if (contacts.length >= 5) score += 10
      else if (contacts.length >= 2) score += 5
    }
    return score
  }

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
            <CardTitle className="text-sm font-medium">Zdravlje odnosa</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const score = getHealthScore()
              const color = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive'
              const bg = score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive'
              return (
                <>
                  <div className={`text-2xl font-bold ${color}`}>{score}/100</div>
                  <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                    <div className={`rounded-full h-1.5 transition-all ${bg}`} style={{ width: `${score}%` }} />
                  </div>
                </>
              )
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sledeća akcija</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const active = reminders.filter(r => !r.is_completed).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
              const overdue = active.filter(r => new Date(r.reminder_date) < new Date())
              if (overdue.length > 0) {
                return (
                  <>
                    <div className="text-lg font-bold text-destructive">Zakasnelo</div>
                    <p className="text-xs text-destructive truncate">{overdue[0].title}</p>
                  </>
                )
              }
              if (active.length > 0) {
                const daysUntil = Math.ceil((new Date(active[0].reminder_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <>
                    <div className="text-lg font-bold">{daysUntil === 0 ? 'Danas' : `Za ${daysUntil} dana`}</div>
                    <p className="text-xs text-muted-foreground truncate">{active[0].title}</p>
                  </>
                )
              }
              return <div className="text-lg font-bold text-muted-foreground">Nema</div>
            })()}
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

            {/* Upcoming Reminders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Podsećanja
                  </CardTitle>
                  <CardDescription>Predstojeća i aktivna</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setReminderDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {(() => {
                  const active = reminders.filter(r => !r.is_completed)
                  if (active.length === 0) {
                    return <p className="text-sm text-muted-foreground text-center py-3">Nema aktivnih podsećanja</p>
                  }
                  return (
                    <div className="space-y-2">
                      {active.slice(0, 3).map((reminder) => {
                        const isOverdue = new Date(reminder.reminder_date) < new Date()
                        return (
                          <div key={reminder.id} className={`flex items-center gap-3 p-2 rounded-lg ${isOverdue ? 'bg-destructive/10' : 'bg-secondary/30'}`}>
                            <button onClick={() => toggleReminder(reminder)}>
                              <div className={`h-4 w-4 rounded-full border-2 ${isOverdue ? 'border-destructive' : 'border-muted-foreground'}`} />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{reminder.title}</p>
                              <p className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {new Date(reminder.reminder_date).toLocaleDateString('sr-RS')}
                                {isOverdue && ' — zakasnelo'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      {active.length > 3 && (
                        <button onClick={() => setActiveTab('crm')} className="text-xs text-primary hover:underline w-full text-center pt-1">
                          + još {active.length - 3} podsećanja
                        </button>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Admin beleške
                  </CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowNoteForm(!showNoteForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {showNoteForm && (
                  <div className="space-y-2 p-3 rounded-lg border border-border bg-secondary/10">
                    <Textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Unesite belešku..."
                      rows={2}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      {NOTE_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setNewNoteLevel(level.value)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border-2 transition-all ${level.bg} ${level.text} ${level.border} ${newNoteLevel === level.value ? 'opacity-100' : 'opacity-50'}`}
                        >
                          {level.label}
                        </button>
                      ))}
                      <div className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => { setShowNoteForm(false); setNewNoteText(''); setNewNoteLevel('info') }}>
                        Otkaži
                      </Button>
                      <Button size="sm" onClick={handleAddNote} disabled={savingNotes || !newNoteText.trim()}>
                        {savingNotes ? 'Čuvanje...' : 'Dodaj'}
                      </Button>
                    </div>
                  </div>
                )}
                {adminNotesList.length === 0 && !showNoteForm ? (
                  <p className="text-sm text-muted-foreground text-center py-3">Nema beleški</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {adminNotesList.map((note) => {
                      const levelConfig = NOTE_LEVELS.find(l => l.value === note.level) || NOTE_LEVELS[0]
                      return (
                        <div key={note.id} className="flex gap-2 p-2 rounded-lg bg-secondary/30 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${levelConfig.bg} ${levelConfig.text} ${levelConfig.border}`}>
                                {levelConfig.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(note.created_at).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteNote(note.id)}
                          >
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
        </TabsContent>

        {/* CRM Tab */}
        <TabsContent value="crm" className="space-y-4">
          {/* Health Strip */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {/* Zdravlje odnosa */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Zdravlje odnosa</span>
              </div>
              {(() => {
                const score = getHealthScore()
                const color = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive'
                return (
                  <>
                    <p className={`text-lg font-bold ${color}`}>{score}/100</p>
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                      <div className={`rounded-full h-1.5 transition-all ${score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${score}%` }} />
                    </div>
                  </>
                )
              })()}
            </Card>

            {/* Pretplata */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Pretplata</span>
              </div>
              <p className={`text-lg font-bold ${subscriptionStatus.status === 'expired' ? 'text-destructive' : subscriptionStatus.status === 'expiring' ? 'text-warning' : 'text-success'}`}>
                {subscriptionStatus.text}
              </p>
              <p className="text-xs text-muted-foreground">
                {subscriptionStatus.daysLeft > 0 ? `još ${subscriptionStatus.daysLeft} dana` : subscriptionStatus.daysLeft < 0 ? `istekla pre ${Math.abs(subscriptionStatus.daysLeft)} dana` : 'Nema'}
              </p>
            </Card>

            {/* Poslednji kontakt */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Poslednji kontakt</span>
              </div>
              {(() => {
                if (contacts.length === 0) return <p className="text-lg font-bold text-muted-foreground">Nikad</p>
                const last = contacts[0]
                const daysSince = Math.floor((new Date().getTime() - new Date(last.contact_date).getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <>
                    <p className={`text-lg font-bold ${daysSince > 30 ? 'text-destructive' : daysSince > 14 ? 'text-warning' : ''}`}>
                      {daysSince === 0 ? 'Danas' : `Pre ${daysSince} dana`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {CONTACT_TYPES.find(ct => ct.value === last.contact_type)?.label || last.contact_type}
                    </p>
                  </>
                )
              })()}
            </Card>

            {/* Sledeća akcija */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Sledeća akcija</span>
              </div>
              {(() => {
                const active = reminders.filter(r => !r.is_completed).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
                const overdue = active.filter(r => new Date(r.reminder_date) < new Date())
                if (overdue.length > 0) {
                  return (
                    <>
                      <p className="text-lg font-bold text-destructive">Zakasnelo</p>
                      <p className="text-xs text-destructive truncate">{overdue[0].title}</p>
                    </>
                  )
                }
                if (active.length > 0) {
                  const daysUntil = Math.ceil((new Date(active[0].reminder_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <>
                      <p className="text-lg font-bold">{daysUntil === 0 ? 'Danas' : `Za ${daysUntil} dana`}</p>
                      <p className="text-xs text-muted-foreground truncate">{active[0].title}</p>
                    </>
                  )
                }
                return <p className="text-lg font-bold text-muted-foreground">Nema</p>
              })()}
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-4 md:grid-cols-12">
            {/* LEFT COLUMN */}
            <div className="md:col-span-5 space-y-4">
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Brze akcije</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={salon.phone ? `tel:${salon.phone}` : undefined} className={!salon.phone ? 'pointer-events-none opacity-50' : ''} onClick={() => { if (salon.phone) { setContactForm({ contact_type: 'call', description: '', contact_date: new Date().toISOString().split('T')[0] }); setContactDialogOpen(true) } }}>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2" disabled={!salon.phone}>
                        <PhoneCall className="h-4 w-4" />
                        Pozovi
                      </Button>
                    </a>
                    <a href={salon.email ? `mailto:${salon.email}` : undefined} className={!salon.email ? 'pointer-events-none opacity-50' : ''} onClick={() => { if (salon.email) { setContactForm({ contact_type: 'email', description: '', contact_date: new Date().toISOString().split('T')[0] }); setContactDialogOpen(true) } }}>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2" disabled={!salon.email}>
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full justify-start gap-2 ${
                        !salon.phone || salon.notification_channel === 'viber'
                          ? 'opacity-40 pointer-events-none'
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                      }`}
                      disabled={!salon.phone || salon.notification_channel === 'viber'}
                      onClick={() => { setMessageChannel('whatsapp'); setMessageText(''); setMessageDialogOpen(true) }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full justify-start gap-2 ${
                        !salon.phone || salon.notification_channel === 'whatsapp'
                          ? 'opacity-40 pointer-events-none'
                          : 'text-purple-600 border-purple-200 hover:bg-purple-50'
                      }`}
                      disabled={!salon.phone || salon.notification_channel === 'whatsapp'}
                      onClick={() => { setMessageChannel('viber'); setMessageText(''); setMessageDialogOpen(true) }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Viber
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => { setContactForm({ contact_type: 'note', description: '', contact_date: new Date().toISOString().split('T')[0] }); setContactDialogOpen(true) }}>
                      <StickyNote className="h-4 w-4" />
                      Beleška
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={openPaymentDialog}>
                      <CreditCard className="h-4 w-4" />
                      Uplata
                    </Button>
                  </div>
                  {/* Notification Channel - toggle chips */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t">
                    <span className="text-[11px] text-muted-foreground mr-1">Kanal:</span>
                    <button
                      onClick={() => updateNotificationChannel(salon.notification_channel === 'whatsapp' ? '' : 'whatsapp')}
                      className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
                        salon.notification_channel === 'whatsapp'
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'border-border text-muted-foreground hover:border-green-300'
                      }`}
                    >
                      WA
                    </button>
                    <button
                      onClick={() => updateNotificationChannel(salon.notification_channel === 'viber' ? '' : 'viber')}
                      className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
                        salon.notification_channel === 'viber'
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'border-border text-muted-foreground hover:border-purple-300'
                      }`}
                    >
                      Viber
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    Tagovi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const assigned = tags.some(t => t.tag_id === tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => assigned ? removeTag(tag.id) : addTag(tag.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all ${
                            assigned
                              ? 'text-white shadow-sm'
                              : 'hover:shadow-sm'
                          }`}
                          style={assigned
                            ? { backgroundColor: tag.color, borderColor: tag.color }
                            : { borderColor: tag.color, backgroundColor: `${tag.color}18`, color: tag.color }
                          }
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Prihod od salona
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Ukupno uplaćeno:</span>
                    <span className="text-sm font-bold">{totalPaid.toLocaleString('sr-RS')} RSD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Broj uplata:</span>
                    <span className="text-sm">{payments.length}</span>
                  </div>
                  {payments.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Poslednja:</span>
                      <span className="text-sm">{new Date(payments[0].payment_date).toLocaleDateString('sr-RS')}</span>
                    </div>
                  )}
                  {payments.length > 0 && payments[0].plan_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Plan:</span>
                      <Badge variant="outline" className="text-xs">{payments[0].plan_name}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN */}
            <div className="md:col-span-7 space-y-4">
              {/* Contact Timeline */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Istorija komunikacije
                    </CardTitle>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setContactDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Filter chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      { value: 'all', label: 'Svi' },
                      { value: 'call', label: 'Pozivi' },
                      { value: 'email', label: 'Email' },
                      { value: 'whatsapp', label: 'WhatsApp' },
                      { value: 'viber', label: 'Viber' },
                      { value: 'note', label: 'Beleške' },
                    ].map(f => (
                      <button
                        key={f.value}
                        onClick={() => setContactFilter(f.value)}
                        className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                          contactFilter === f.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const filtered = contactFilter === 'all' ? contacts : contacts.filter(c => c.contact_type === contactFilter)
                    const displayed = showAllContacts ? filtered : filtered.slice(0, 5)
                    if (filtered.length === 0) {
                      return <p className="text-sm text-muted-foreground text-center py-4">Nema kontakata</p>
                    }
                    return (
                      <>
                        <div className="relative">
                          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
                          <div className="space-y-3">
                            {displayed.map((contact) => {
                              const Icon = getContactIcon(contact.contact_type)
                              const typeLabel = CONTACT_TYPES.find((ct) => ct.value === contact.contact_type)?.label || contact.contact_type
                              const isWhatsApp = contact.contact_type === 'whatsapp'
                              const isViber = contact.contact_type === 'viber'
                              return (
                                <div key={contact.id} className="relative pl-9">
                                  <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center ${isWhatsApp ? 'bg-green-100' : isViber ? 'bg-purple-100' : 'bg-secondary'}`}>
                                    <Icon className={`h-3.5 w-3.5 ${isWhatsApp ? 'text-green-600' : isViber ? 'text-purple-600' : 'text-muted-foreground'}`} />
                                  </div>
                                  <div className="bg-secondary/30 rounded-lg p-2.5">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className={`text-xs font-medium ${isWhatsApp ? 'text-green-600' : isViber ? 'text-purple-600' : 'text-primary'}`}>{typeLabel}</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-muted-foreground">
                                          {new Date(contact.contact_date).toLocaleDateString('sr-RS')}
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => deleteContact(contact.id)}>
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-sm line-clamp-2">{contact.description}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        {filtered.length > 5 && (
                          <button
                            onClick={() => setShowAllContacts(!showAllContacts)}
                            className="text-xs text-primary hover:underline w-full text-center pt-2 flex items-center justify-center gap-1"
                          >
                            {showAllContacts ? <><ChevronUp className="h-3 w-3" /> Prikaži manje</> : <><ChevronDown className="h-3 w-3" /> Prikaži sve ({filtered.length})</>}
                          </button>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Reminders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5" />
                      Podsećanja
                      {(() => {
                        const activeCount = reminders.filter(r => !r.is_completed).length
                        if (activeCount > 0) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{activeCount}</Badge>
                        return null
                      })()}
                    </CardTitle>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setReminderDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const active = reminders.filter(r => !r.is_completed).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime())
                    const completed = reminders.filter(r => r.is_completed)
                    if (active.length === 0 && completed.length === 0) {
                      return <p className="text-sm text-muted-foreground text-center py-3">Nema podsećanja</p>
                    }
                    return (
                      <div className="space-y-2">
                        {active.map((reminder) => {
                          const isOverdue = new Date(reminder.reminder_date) < new Date()
                          return (
                            <div key={reminder.id} className={`flex items-center gap-2.5 p-2 rounded-lg ${isOverdue ? 'bg-destructive/10' : 'bg-secondary/30'}`}>
                              <button onClick={() => toggleReminder(reminder)}>
                                <div className={`h-4 w-4 rounded-full border-2 ${isOverdue ? 'border-destructive' : 'border-muted-foreground'}`} />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{reminder.title}</p>
                                <p className={`text-[10px] ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                  {new Date(reminder.reminder_date).toLocaleDateString('sr-RS')}
                                  {isOverdue && ' — zakasnelo'}
                                </p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => deleteReminder(reminder.id)}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          )
                        })}
                        {completed.length > 0 && (
                          <button
                            onClick={() => setShowCompletedReminders(!showCompletedReminders)}
                            className="text-xs text-muted-foreground hover:text-foreground w-full text-center pt-1 flex items-center justify-center gap-1"
                          >
                            {showCompletedReminders ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            Završena ({completed.length})
                          </button>
                        )}
                        {showCompletedReminders && completed.map((reminder) => (
                          <div key={reminder.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/20 opacity-60">
                            <button onClick={() => toggleReminder(reminder)}>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-through text-muted-foreground truncate">{reminder.title}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(reminder.reminder_date).toLocaleDateString('sr-RS')}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => deleteReminder(reminder.id)}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Message Log */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Poslate poruke
                    {messageLog.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{messageLog.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {messageLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">Nema poslatih poruka</p>
                  ) : (
                    <div className="space-y-2">
                      {(showAllMessages ? messageLog : messageLog.slice(0, 5)).map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/30">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.channel === 'whatsapp' ? 'bg-green-100' : 'bg-purple-100'}`}>
                            <MessageCircle className={`h-3 w-3 ${msg.channel === 'whatsapp' ? 'text-green-600' : 'text-purple-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-medium ${msg.channel === 'whatsapp' ? 'text-green-600' : 'text-purple-600'}`}>
                                {msg.channel === 'whatsapp' ? 'WhatsApp' : 'Viber'}
                              </span>
                              {msg.trigger_type && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">auto</Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <Badge
                                variant={msg.status === 'sent' ? 'default' : 'destructive'}
                                className={`text-[9px] px-1 py-0 h-3.5 ${msg.status === 'sent' ? 'bg-success hover:bg-success' : ''}`}
                              >
                                {msg.status === 'sent' ? 'Poslato' : 'Greška'}
                              </Badge>
                            </div>
                            <p className="text-xs line-clamp-2 text-muted-foreground">{msg.message_text}</p>
                          </div>
                        </div>
                      ))}
                      {messageLog.length > 5 && (
                        <button
                          onClick={() => setShowAllMessages(!showAllMessages)}
                          className="text-xs text-primary hover:underline w-full text-center pt-1 flex items-center justify-center gap-1"
                        >
                          {showAllMessages ? <><ChevronUp className="h-3 w-3" /> Prikaži manje</> : <><ChevronDown className="h-3 w-3" /> Prikaži sve ({messageLog.length})</>}
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
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
          {/* Churn risk banner */}
          {(() => {
            const days = getDaysSinceActivity()
            if (days !== null && days > 14) {
              return (
                <div className={`p-3 rounded-lg flex items-center gap-3 ${days > 30 ? 'bg-destructive/10 border border-destructive/30' : 'bg-warning/10 border border-warning/30'}`}>
                  <Activity className={`h-5 w-5 flex-shrink-0 ${days > 30 ? 'text-destructive' : 'text-warning'}`} />
                  <div>
                    <p className={`text-sm font-medium ${days > 30 ? 'text-destructive' : 'text-warning'}`}>
                      {days > 30 ? 'Rizik od odliva' : 'Smanjena aktivnost'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Poslednje zakazivanje pre {days} dana — {days > 30 ? 'preporučljivo kontaktirati salon' : 'pratiti situaciju'}
                    </p>
                  </div>
                </div>
              )
            }
            return null
          })()}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Aktivnost na platformi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Aktivnost na platformi
                </CardTitle>
                <CardDescription>Koliko salon koristi zakazivanja</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ukupno termina:</span>
                  <span className="font-bold">{stats?.bookings.total || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ovaj mesec:</span>
                  <span className="font-medium">{stats?.bookings.thisMonth || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prošli mesec:</span>
                  <span className="text-muted-foreground">{stats?.bookings.lastMonth || 0}</span>
                </div>
                <div className="flex items-center gap-1 pt-2 border-t">
                  {bookingTrend.isUp ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  <span className={`text-sm font-medium ${bookingTrend.isUp ? 'text-success' : 'text-destructive'}`}>
                    {bookingTrend.trend}% vs prošli mesec
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Poslednja aktivnost:</span>
                  <span className="text-sm">
                    {stats?.bookings.lastActivityDate
                      ? new Date(stats.bookings.lastActivityDate).toLocaleDateString('sr-RS')
                      : 'Nema'}
                    {(() => {
                      const days = getDaysSinceActivity()
                      if (days !== null) return ` (pre ${days}d)`
                      return ''
                    })()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Online vs Ručno */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Online vs ručno zakazivanje
                </CardTitle>
                <CardDescription>Koliko klijenti sami zakazuju</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Online stopa (ukupno):</span>
                    <span className="font-bold">{stats?.engagement.onlineBookingRate || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${stats?.engagement.onlineBookingRate || 0}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Ovaj mesec — online:</span>
                  <span className="font-medium text-primary">{stats?.bookings.onlineThisMonth || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ovaj mesec — ručno:</span>
                  <span className="font-medium">{stats?.bookings.manualThisMonth || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Viša online stopa = klijenti aktivno koriste booking stranicu
                </p>
              </CardContent>
            </Card>

            {/* Kvalitet termina */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Kvalitet termina
                </CardTitle>
                <CardDescription>Stope završavanja, otkazivanja i nedolazaka</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Stopa završavanja:</span>
                    <span className="font-medium">{stats?.engagement.completionRate || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-success rounded-full h-2 transition-all" style={{ width: `${stats?.engagement.completionRate || 0}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Otkazano:</span>
                  <span className={`font-medium ${getCancellationRate() > 20 ? 'text-destructive' : ''}`}>
                    {stats?.bookings.cancelled || 0} ({getCancellationRate()}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nije došao:</span>
                  <span className={`font-medium ${getNoShowRate() > 10 ? 'text-destructive' : ''}`}>
                    {stats?.bookings.noShow || 0} ({getNoShowRate()}%)
                  </span>
                </div>
                {(getCancellationRate() > 20 || getNoShowRate() > 10) && (
                  <p className="text-xs text-destructive pt-1">
                    Visoka stopa otkazivanja/nedolazaka
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Podešavanje profila */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Podešavanje profila
                </CardTitle>
                <CardDescription>Koliko je salon konfigurisao aplikaciju</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const profile = getProfileCompleteness()
                  return (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Kompletnost:</span>
                          <span className="font-bold">{profile.score}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`rounded-full h-2 transition-all ${profile.score === 100 ? 'bg-success' : profile.score >= 50 ? 'bg-primary' : 'bg-warning'}`}
                            style={{ width: `${profile.score}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        {profile.items.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            {item.done ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Blokiranih termina:</span>
                        <span className="font-medium">{stats?.activity.blockedSlots || 0}</span>
                      </div>
                    </>
                  )
                })()}
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

      {/* Message Compose Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className={`h-5 w-5 ${messageChannel === 'whatsapp' ? 'text-green-600' : 'text-purple-600'}`} />
              {messageChannel === 'whatsapp' ? 'WhatsApp poruka' : 'Viber poruka'}
            </DialogTitle>
            <DialogDescription>Pošalji poruku salonu {salon.name} ({salon.phone})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Template selector */}
            {(() => {
              const channelTemplates = messageTemplates.filter(t => t.channel === messageChannel && t.is_active)
              if (channelTemplates.length === 0) return null
              return (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Izaberi šablon:</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {channelTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-secondary transition-colors text-left"
                      >
                        {t.name.replace(` - ${messageChannel === 'whatsapp' ? 'WhatsApp' : 'Viber'}`, '')}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Unesite poruku ili izaberite šablon iznad..."
              rows={5}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMessageDialogOpen(false); setMessageText('') }}>Otkaži</Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className={messageChannel === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}
            >
              {sendingMessage ? 'Slanje...' : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Pošalji
                </>
              )}
            </Button>
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
