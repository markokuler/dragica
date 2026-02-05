'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Store,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Plus,
  ChevronRight,
  CreditCard,
  DollarSign,
  Users,
  Bell,
  ZapOff,
  CalendarClock,
  FileText,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface DashboardStats {
  totalSalons: number
  activeSalons: number
  inactiveSalons: number
  totalBookings: number
  bookingsThisMonth: number
  bookingsLastMonth: number
  expiringSubscriptions: number
  expiredSubscriptions: number
  paymentPending: number
  newSalonsThisMonth: number
  dormantSalonsCount: number
  dormantSalons: Array<{
    id: string
    name: string
    last_booking_at: string | null
  }>
  mrr: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  recentSalons: Array<{
    id: string
    name: string
    created_at: string
    subscription_status: string
    subscription_expires_at: string | null
  }>
  recentPayments: Array<{
    id: string
    amount: number
    payment_date: string
    salon_name: string
    plan_name: string
  }>
  expiringSalons: Array<{
    id: string
    name: string
    expires_at: string
    days_left: number
  }>
  dueReminders: Array<{
    id: string
    title: string
    reminder_date: string
    tenant_id: string | null
    salon_name: string | null
  }>
  alerts: Array<{
    id: string
    type: 'expiring' | 'expired' | 'payment_pending'
    salon_name: string
    expires_at: string | null
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Calculate booking trend
  const getBookingTrend = () => {
    if (!stats) return { trend: 0, isUp: true }
    const current = stats.bookingsThisMonth
    const last = stats.bookingsLastMonth
    if (last === 0) return { trend: current > 0 ? 100 : 0, isUp: true }
    const trend = Math.round(((current - last) / last) * 100)
    return { trend: Math.abs(trend), isUp: trend >= 0 }
  }

  // Calculate revenue trend
  const getRevenueTrend = () => {
    if (!stats) return { trend: 0, isUp: true }
    const current = stats.thisMonthRevenue
    const last = stats.lastMonthRevenue
    if (last === 0) return { trend: current > 0 ? 100 : 0, isUp: true }
    const trend = Math.round(((current - last) / last) * 100)
    return { trend: Math.abs(trend), isUp: trend >= 0 }
  }

  const bookingTrend = getBookingTrend()
  const revenueTrend = getRevenueTrend()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif">Pregled</h1>
            <p className="text-muted-foreground">Učitavanje...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Pregled</h1>
          <p className="text-base sm:text-lg text-muted-foreground">Dobrodošli u Admin Panel</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/saloni/novi">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novi salon
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts & Reminders */}
      {stats && (stats.dueReminders.length > 0 || stats.expiringSubscriptions > 0 || stats.expiredSubscriptions > 0) && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Bell className="h-5 w-5" />
              Potrebna pažnja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Due reminders */}
              {stats.dueReminders.map((reminder) => (
                <Link
                  key={reminder.id}
                  href={reminder.tenant_id ? `/admin/saloni/${reminder.tenant_id}` : '/admin/podsecanja'}
                  className="flex items-center justify-between p-3 bg-info/10 rounded-lg hover:bg-info/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-info" />
                    <span className="font-medium">{reminder.title}</span>
                    {reminder.salon_name && (
                      <span className="text-sm text-muted-foreground">({reminder.salon_name})</span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-info border-info">
                    {new Date(reminder.reminder_date).toLocaleDateString('sr-RS')}
                  </Badge>
                </Link>
              ))}

              {/* Expired subscriptions */}
              {stats.expiredSubscriptions > 0 && (
                <Link
                  href="/admin/saloni?status=expired"
                  className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-destructive" />
                    <span className="font-medium">Istekle pretplate</span>
                  </div>
                  <Badge variant="destructive">{stats.expiredSubscriptions}</Badge>
                </Link>
              )}

              {/* Expiring soon */}
              {stats.expiringSubscriptions > 0 && (
                <Link
                  href="/admin/saloni?status=expiring"
                  className="flex items-center justify-between p-3 bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="font-medium">Ističu za 7 dana</span>
                  </div>
                  <Badge className="bg-warning text-warning-foreground">{stats.expiringSubscriptions}</Badge>
                </Link>
              )}

              {/* Dormant salons */}
              {stats.dormantSalonsCount > 0 && (
                <Link
                  href="/admin/saloni?status=dormant"
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ZapOff className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Neaktivni saloni (30+ dana)</span>
                  </div>
                  <Badge variant="secondary">{stats.dormantSalonsCount}</Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats - MRR focused */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.mrr.toLocaleString('sr-RS')} RSD</div>
            <p className="text-xs text-muted-foreground">mesečni prihod</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prihod (mesec)</CardTitle>
            <CreditCard className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.thisMonthRevenue.toLocaleString('sr-RS')}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {revenueTrend.isUp ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              {revenueTrend.trend}% vs prošli mesec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivni saloni</CardTitle>
            <Store className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSalons || 0}</div>
            <p className="text-xs text-muted-foreground">
              od {stats?.totalSalons || 0} ukupno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zakazivanja</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bookingsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {bookingTrend.isUp ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              {bookingTrend.trend}% vs prošli mesec
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second row - Quick numbers */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Novi ovog meseca</p>
                <p className="text-xl font-bold text-success">{stats?.newSalonsThisMonth || 0}</p>
              </div>
              <Sparkles className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ističu uskoro</p>
                <p className="text-xl font-bold text-warning">{stats?.expiringSubscriptions || 0}</p>
              </div>
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Istekle</p>
                <p className="text-xl font-bold text-destructive">{stats?.expiredSubscriptions || 0}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Neaktivni</p>
                <p className="text-xl font-bold">{stats?.dormantSalonsCount || 0}</p>
              </div>
              <ZapOff className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content - 3 columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Ističu uskoro
            </CardTitle>
            <CardDescription>Pretplate koje ističu za 7 dana</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.expiringSalons || stats.expiringSalons.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">
                Nema pretplata koje ističu
              </p>
            ) : (
              <div className="space-y-2">
                {stats.expiringSalons.map((salon) => (
                  <Link
                    key={salon.id}
                    href={`/admin/saloni/${salon.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="font-medium truncate">{salon.name}</span>
                    <Badge
                      variant={salon.days_left <= 2 ? 'destructive' : 'default'}
                      className={salon.days_left <= 2 ? '' : 'bg-warning text-warning-foreground'}
                    >
                      {salon.days_left} {salon.days_left === 1 ? 'dan' : 'dana'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/admin/saloni?status=expiring">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Pogledaj sve
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-success" />
              Poslednje uplate
            </CardTitle>
            <CardDescription>Nedavno evidentirane uplate</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.recentPayments || stats.recentPayments.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">
                Nema uplata
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{payment.salon_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">
                        {payment.amount.toLocaleString('sr-RS')}
                      </p>
                      <p className="text-xs text-muted-foreground">{payment.plan_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/finansije">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Sve uplate
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Salons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-info" />
              Novi saloni
            </CardTitle>
            <CardDescription>Nedavno registrovani</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.recentSalons || stats.recentSalons.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">
                Nema salona
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentSalons.map((salon) => (
                  <Link
                    key={salon.id}
                    href={`/admin/saloni/${salon.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{salon.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(salon.created_at), {
                          addSuffix: true,
                          locale: srLatn,
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        salon.subscription_status === 'active' ? 'default' :
                        salon.subscription_status === 'trial' ? 'secondary' : 'destructive'
                      }
                      className={salon.subscription_status === 'active' ? 'bg-success' : ''}
                    >
                      {salon.subscription_status === 'active' ? 'Aktivan' :
                       salon.subscription_status === 'trial' ? 'Trial' : 'Istekao'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/admin/saloni">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Svi saloni
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Brze akcije</CardTitle>
          <CardDescription>Najčešće korišćene akcije</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/saloni/novi">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Plus className="h-5 w-5 text-primary" />
                <span className="text-xs">Novi salon</span>
              </Button>
            </Link>

            <Link href="/admin/finansije">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <CreditCard className="h-5 w-5 text-success" />
                <span className="text-xs">Evidentiraj uplatu</span>
              </Button>
            </Link>

            <Link href="/admin/izvestaji">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <FileText className="h-5 w-5 text-info" />
                <span className="text-xs">Izveštaji</span>
              </Button>
            </Link>

            <Link href="/admin/aktivnost">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <BarChart3 className="h-5 w-5 text-accent" />
                <span className="text-xs">Aktivnost</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
