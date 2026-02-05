'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  CreditCard,
  Store,
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface AnalyticsData {
  totalRevenue: number
  monthlyRevenue: number
  averageRevenuePerSalon: number
  bookingsThisMonth: number
  bookingsLastMonth: number
  bookingsGrowth: number
  newSalonsThisMonth: number
  churnRate: number
  topSalons: {
    id: string
    name: string
    bookings: number
    revenue: number
  }[]
  revenueByMonth: {
    month: string
    revenue: number
  }[]
  bookingsByDay: {
    date: string
    count: number
  }[]
}

export default function AnalitikaPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Učitavanje analitike...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Analitika</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Pregled performansi platforme
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Poslednjih 7 dana</SelectItem>
            <SelectItem value="30">Poslednjih 30 dana</SelectItem>
            <SelectItem value="90">Poslednjih 90 dana</SelectItem>
            <SelectItem value="365">Poslednjih godinu dana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: Compact Stats */}
      <Card className="md:hidden">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Mesečni prihod</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(data?.monthlyRevenue || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Zakazivanja</p>
              <p className="text-lg font-bold">{data?.bookingsThisMonth || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Novi saloni</p>
              <p className="text-lg font-bold">{data?.newSalonsThisMonth || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ukupan prihod</p>
              <p className="text-lg font-bold text-success">{formatCurrency(data?.totalRevenue || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop: Revenue Stats */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupan prihod</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sve evidentirane uplate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesečni prihod</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ovaj mesec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prosek po salonu</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.averageRevenuePerSalon || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mesečno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novi saloni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.newSalonsThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ovaj mesec
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: Bookings Stats */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zakazivanja ovaj mesec</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.bookingsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.bookingsGrowth !== undefined && (
                <span className={data.bookingsGrowth >= 0 ? 'text-success' : 'text-destructive'}>
                  {data.bookingsGrowth >= 0 ? '+' : ''}{data.bookingsGrowth.toFixed(1)}%
                </span>
              )}{' '}
              u odnosu na prošli mesec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zakazivanja prošli mesec</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.bookingsLastMonth || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.churnRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Saloni koji su odustali
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Salons */}
      <Card>
        <CardHeader>
          <CardTitle>Top saloni</CardTitle>
          <CardDescription>Saloni sa najviše aktivnosti</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.topSalons || data.topSalons.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nema podataka</p>
          ) : (
            <div className="space-y-4">
              {data.topSalons.map((salon, index) => (
                <div
                  key={salon.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{salon.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {salon.bookings} zakazivanja
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-success">
                    {formatCurrency(salon.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Prihod po mesecima</CardTitle>
          <CardDescription>Trend prihoda tokom vremena</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.revenueByMonth || data.revenueByMonth.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nema podataka o prihodima</p>
          ) : (
            <div className="space-y-2">
              {data.revenueByMonth.map((item) => {
                const maxRevenue = Math.max(...data.revenueByMonth.map(r => r.revenue))
                const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={item.month} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-muted-foreground">{item.month}</span>
                    <div className="flex-1 h-8 bg-secondary/30 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-28 text-right text-sm font-medium">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
