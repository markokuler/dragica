'use client'

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, subDays, isSameDay, isSameMonth } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// Chart colors
const CHART_COLORS = {
  income: '#6B9B7A',     // success/green
  expense: '#B85C5C',    // destructive/red
  axis: '#B0B7C3',
  label: '#FAF9F6',
  grid: '#3A5F5F',
}

type ChartPeriod = 'days' | 'months'

interface FinancialEntry {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string | null
  entry_date: string
  payment_id: string | null
  created_at: string
}

// Admin-specific categories
const INCOME_CATEGORIES = ['subscriptions', 'consulting', 'partnerships', 'other']
const EXPENSE_CATEGORIES = ['hosting', 'marketing', 'salaries', 'software', 'office', 'legal', 'other']

const CATEGORY_LABELS: Record<string, string> = {
  subscriptions: 'Pretplate',
  consulting: 'Konsalting',
  partnerships: 'Partnerstva',
  hosting: 'Hosting',
  marketing: 'Marketing',
  salaries: 'Plate',
  software: 'Softver',
  office: 'Kancelarija',
  legal: 'Pravne usluge',
  other: 'Ostalo',
}

export default function AdminFinansijePage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Učitavanje...</div>}>
      <AdminFinansijeContent />
    </Suspense>
  )
}

function AdminFinansijeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>((searchParams.get('period') as ChartPeriod) || 'months')
  const [selectedChartDate, setSelectedChartDate] = useState<Date | null>(null)
  const [monthFilter, setMonthFilter] = useState(searchParams.get('month') || 'all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>((searchParams.get('type') as 'all' | 'income' | 'expense') || 'all')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income')
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<FinancialEntry | null>(null)

  // Update URL with current filters
  const updateFiltersUrl = useCallback((newFilters: {
    period?: ChartPeriod
    month?: string
    type?: 'all' | 'income' | 'expense'
    category?: string
  }) => {
    const params = new URLSearchParams()
    const period = newFilters.period ?? chartPeriod
    const month = newFilters.month ?? monthFilter
    const type = newFilters.type ?? typeFilter
    const category = newFilters.category ?? categoryFilter

    if (period !== 'months') params.set('period', period)
    if (month !== 'all') params.set('month', month)
    if (type !== 'all') params.set('type', type)
    if (category !== 'all') params.set('category', category)

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname, chartPeriod, monthFilter, typeFilter, categoryFilter])

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/admin/finances')
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const firstDayOfWeek = new Date(today)
    firstDayOfWeek.setDate(today.getDate() - today.getDay())
    const firstDayOfMonth = startOfMonth(today)

    const calculateStats = (filtered: FinancialEntry[]) => {
      const income = filtered
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const expenses = filtered
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + Number(e.amount), 0)
      return { income, expenses, profit: income - expenses }
    }

    const todayStats = calculateStats(entries.filter(e => e.entry_date === todayStr))
    const weekStats = calculateStats(entries.filter(e => new Date(e.entry_date) >= firstDayOfWeek))
    const monthStats = calculateStats(entries.filter(e => new Date(e.entry_date) >= firstDayOfMonth))
    const totalStats = calculateStats(entries)

    return { todayStats, weekStats, monthStats, totalStats }
  }, [entries])

  // Prepare chart data
  const chartData = useMemo(() => {
    const now = new Date()
    const data: { name: string; fullName: string; income: number; expense: number; date: Date }[] = []

    if (chartPeriod === 'days') {
      for (let i = 13; i >= 0; i--) {
        const date = subDays(now, i)
        data.push({
          name: format(date, 'd. MMM', { locale: srLatn }),
          fullName: format(date, 'EEEE, d. MMMM yyyy', { locale: srLatn }),
          income: 0,
          expense: 0,
          date,
        })
      }

      entries.forEach((entry) => {
        const entryDate = new Date(entry.entry_date)
        const dayData = data.find((d) => isSameDay(entryDate, d.date))
        if (dayData) {
          if (entry.type === 'income') {
            dayData.income += Number(entry.amount)
          } else {
            dayData.expense += Number(entry.amount)
          }
        }
      })
    } else {
      for (let i = 5; i >= 0; i--) {
        const monthDate = startOfMonth(subMonths(now, i))
        data.push({
          name: format(monthDate, 'MMM', { locale: srLatn }),
          fullName: format(monthDate, 'MMMM yyyy', { locale: srLatn }),
          income: 0,
          expense: 0,
          date: monthDate,
        })
      }

      entries.forEach((entry) => {
        const entryDate = new Date(entry.entry_date)
        const monthData = data.find((m) => isSameMonth(entryDate, m.date))
        if (monthData) {
          if (entry.type === 'income') {
            monthData.income += Number(entry.amount)
          } else {
            monthData.expense += Number(entry.amount)
          }
        }
      })
    }

    return data
  }, [entries, chartPeriod])

  // Handle chart click
  const handleChartClick = (data: { date: Date } | null) => {
    if (data) {
      if (chartPeriod === 'months') {
        const monthStr = `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}`
        setMonthFilter(monthStr)
        setSelectedChartDate(null)
        updateFiltersUrl({ month: monthStr })
      } else {
        setSelectedChartDate(data.date)
        setMonthFilter('all')
      }
    }
  }

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (selectedChartDate) {
      if (chartPeriod === 'days') {
        filtered = filtered.filter(e => isSameDay(new Date(e.entry_date), selectedChartDate))
      } else {
        filtered = filtered.filter(e => isSameMonth(new Date(e.entry_date), selectedChartDate))
      }
    } else if (monthFilter !== 'all') {
      const [year, month] = monthFilter.split('-').map(Number)
      const start = startOfMonth(new Date(year, month - 1))
      const end = endOfMonth(new Date(year, month - 1))
      filtered = filtered.filter(e => {
        const date = new Date(e.entry_date)
        return date >= start && date <= end
      })
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === typeFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category === categoryFilter)
    }

    return filtered.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
  }, [entries, selectedChartDate, chartPeriod, monthFilter, typeFilter, categoryFilter])

  // Get available months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    entries.forEach(e => {
      const date = new Date(e.entry_date)
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    })
    return Array.from(months).sort().reverse()
  }, [entries])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' RSD'
  }

  const openDialog = (type: 'income' | 'expense') => {
    setEditingEntry(null)
    setEntryType(type)
    setFormData({
      category: '',
      amount: '',
      description: '',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
    })
    setDialogOpen(true)
  }

  const openEditDialog = (entry: FinancialEntry) => {
    setEditingEntry(entry)
    setEntryType(entry.type)
    setFormData({
      category: entry.category,
      amount: entry.amount.toString(),
      description: entry.description || '',
      entry_date: entry.entry_date,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category || !formData.amount) return

    setSubmitting(true)

    try {
      const url = editingEntry
        ? `/api/admin/finances/${editingEntry.id}`
        : '/api/admin/finances'

      const response = await fetch(url, {
        method: editingEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entryType,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          entry_date: formData.entry_date,
        }),
      })

      if (response.ok) {
        setDialogOpen(false)
        setEditingEntry(null)
        fetchEntries()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju unosa')
      }
    } catch (error) {
      alert('Greška pri čuvanju unosa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/admin/finances/${entryToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setEntryToDelete(null)
        fetchEntries()
      } else {
        alert('Greška pri brisanju unosa')
      }
    } catch (error) {
      alert('Greška pri brisanju unosa')
    }
  }

  const clearFilters = () => {
    setMonthFilter('all')
    setTypeFilter('all')
    setCategoryFilter('all')
    setSelectedChartDate(null)
    router.replace(pathname, { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Finansije</h1>
          <p className="text-base sm:text-lg text-muted-foreground hidden md:block">
            Pregled prihoda i rashoda platforme
          </p>
          {/* Compact stats for mobile */}
          <p className="text-sm text-muted-foreground md:hidden">
            Ovaj mesec: <span className={`font-semibold ${stats.monthStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.monthStats.profit)}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => openDialog('expense')}>
            <ArrowDownRight className="mr-1 sm:mr-2 h-4 w-4 text-destructive" />
            <span className="hidden sm:inline">Dodaj </span>Rashod
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => openDialog('income')}>
            <ArrowUpRight className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Dodaj </span>Prihod
          </Button>
        </div>
      </div>

      {/* Desktop: Stats Cards */}
      <div className="hidden md:grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Danas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.todayStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.todayStats.profit)}
            </div>
            <p className="text-sm text-muted-foreground">
              +{formatCurrency(stats.todayStats.income)} | -{formatCurrency(stats.todayStats.expenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ova nedelja</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.weekStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.weekStats.profit)}
            </div>
            <p className="text-sm text-muted-foreground">
              +{formatCurrency(stats.weekStats.income)} | -{formatCurrency(stats.weekStats.expenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ovaj mesec</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.monthStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.monthStats.profit)}
            </div>
            <p className="text-sm text-muted-foreground">
              +{formatCurrency(stats.monthStats.income)} | -{formatCurrency(stats.monthStats.expenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(stats.totalStats.profit)}
            </div>
            <p className="text-sm text-muted-foreground">{entries.length} unosa</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Pregled finansija</CardTitle>
            <CardDescription>
              {chartPeriod === 'days' && 'Poslednjih 14 dana'}
              {chartPeriod === 'months' && 'Poslednjih 6 meseci'}
              {chartPeriod === 'days' && selectedChartDate && (
                <span className="ml-2 text-primary">
                  • {format(selectedChartDate, 'd. MMM', { locale: srLatn })}
                </span>
              )}
            </CardDescription>
          </div>
          <Select value={chartPeriod} onValueChange={(v) => {
            setChartPeriod(v as ChartPeriod)
            setSelectedChartDate(null)
            updateFiltersUrl({ period: v as ChartPeriod })
          }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Po danima</SelectItem>
              <SelectItem value="months">Po mesecima</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                onClick={(state) => {
                  if (state && state.activeLabel) {
                    const clickedData = chartData.find((d) => d.name === state.activeLabel)
                    if (clickedData) {
                      handleChartClick(clickedData)
                    }
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.label, fontSize: 12 }}
                  axisLine={{ stroke: CHART_COLORS.axis }}
                  tickLine={{ stroke: CHART_COLORS.axis }}
                />
                <YAxis
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.label, fontSize: 12 }}
                  axisLine={{ stroke: CHART_COLORS.axis }}
                  tickLine={{ stroke: CHART_COLORS.axis }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div style={{
                          backgroundColor: '#3A5F5F',
                          border: '1px solid #2F4F4F',
                          borderRadius: '8px',
                          padding: '12px',
                          color: CHART_COLORS.label,
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: '8px' }}>{data.fullName}</p>
                          <p style={{ color: CHART_COLORS.income }}>
                            Prihod: {formatCurrency(data.income)}
                          </p>
                          <p style={{ color: CHART_COLORS.expense }}>
                            Rashod: {formatCurrency(data.expense)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend
                  wrapperStyle={{ color: CHART_COLORS.label }}
                  formatter={(value) => (
                    <span style={{ color: CHART_COLORS.label }}>
                      {value === 'income' ? 'Prihodi' : 'Rashodi'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill={CHART_COLORS.income}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill={CHART_COLORS.expense}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transakcije</CardTitle>
              <CardDescription>
                {filteredEntries.length} unosa
                {chartPeriod === 'days' && selectedChartDate && (
                  <button
                    onClick={() => setSelectedChartDate(null)}
                    className="ml-2 text-primary hover:underline"
                  >
                    (poništi filter)
                  </button>
                )}
              </CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Select
              value={selectedChartDate ? 'chart' : monthFilter}
              onValueChange={(v) => {
                if (v !== 'chart') {
                  setSelectedChartDate(null)
                  setMonthFilter(v)
                  updateFiltersUrl({ month: v })
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Mesec" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi meseci</SelectItem>
                {availableMonths.map((month) => {
                  const [year, m] = month.split('-')
                  const date = new Date(parseInt(year), parseInt(m) - 1)
                  return (
                    <SelectItem key={month} value={month}>
                      {format(date, 'MMMM yyyy', { locale: srLatn })}
                    </SelectItem>
                  )
                })}
                {chartPeriod === 'days' && selectedChartDate && (
                  <SelectItem value="chart" disabled>
                    {format(selectedChartDate, 'd. MMM', { locale: srLatn })}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => {
              setTypeFilter(v as 'all' | 'income' | 'expense')
              setCategoryFilter('all')
              updateFiltersUrl({ type: v as 'all' | 'income' | 'expense', category: 'all' })
            }}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve</SelectItem>
                <SelectItem value="income">Prihodi</SelectItem>
                <SelectItem value="expense">Rashodi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(v) => {
              setCategoryFilter(v)
              updateFiltersUrl({ category: v })
            }}>
              <SelectTrigger className="w-full sm:w-44 col-span-2 sm:col-span-1">
                <SelectValue placeholder="Kategorija" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve kategorije</SelectItem>
                {typeFilter === 'all' && (
                  <>
                    {INCOME_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </>
                )}
                {typeFilter === 'income' && INCOME_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
                {typeFilter === 'expense' && EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(monthFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || selectedChartDate) && (
              <Button
                variant="outline"
                size="sm"
                className="col-span-2 sm:col-span-1"
                onClick={clearFilters}
              >
                Poništi filtere
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {filteredEntries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nema unosa</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredEntries.slice(0, 30).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => openEditDialog(entry)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {entry.type === 'income' ? (
                      <ArrowUpRight className="h-5 w-5 text-success flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </p>
                      {entry.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{entry.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(entry.entry_date), 'd. MMM yyyy', { locale: srLatn })}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold text-sm sm:text-base flex-shrink-0 ml-2 ${
                      entry.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {entry.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(entry.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry
                ? (entryType === 'income' ? 'Izmeni prihod' : 'Izmeni rashod')
                : (entryType === 'income' ? 'Dodaj prihod' : 'Dodaj rashod')}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? `Izmenite detalje o ${entryType === 'income' ? 'prihodu' : 'rashodu'}`
                : `Unesite detalje o ${entryType === 'income' ? 'prihodu' : 'rashodu'}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Kategorija *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite kategoriju" />
                  </SelectTrigger>
                  <SelectContent>
                    {(entryType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Iznos (RSD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Datum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis (opciono)</Label>
                <Textarea
                  id="description"
                  placeholder="Dodatne napomene..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              {editingEntry && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setDialogOpen(false)
                    setEntryToDelete(editingEntry)
                    setDeleteDialogOpen(true)
                  }}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Obriši
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false)
                setEditingEntry(null)
              }}>
                Otkaži
              </Button>
              <Button type="submit" disabled={submitting || !formData.category || !formData.amount}>
                {submitting ? 'Čuvanje...' : 'Sačuvaj'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši unos?</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da obrišete ovaj unos od{' '}
              <strong>{formatCurrency(entryToDelete?.amount || 0)}</strong>?
              <br /><br />
              Ova akcija se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>
              Otkaži
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
