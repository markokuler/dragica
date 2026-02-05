'use client'

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

// Chart colors matching the design system
const CHART_COLORS = {
  income: '#18C6A0',      // success/teal - distinct for income
  expense: '#EF5050',     // error/red - distinct for expenses
  axis: '#B0B7C3',        // muted-foreground (updated)
  label: '#FFFFFF',       // foreground
  grid: '#3D4556',        // border color (updated)
}

type ChartPeriod = 'days' | 'months'

const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: 'days', label: 'Po danima' },
  { value: 'months', label: 'Po mesecima' },
]

interface FinancialEntry {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string | null
  entry_date: string
  booking_id: string | null
  created_at: string
}

const INCOME_CATEGORIES = ['booking', 'products', 'tips', 'other']
const EXPENSE_CATEGORIES = ['supplies', 'rent', 'utilities', 'salaries', 'marketing', 'other']

const CATEGORY_LABELS: Record<string, string> = {
  booking: 'Zakazivanje',
  products: 'Proizvodi',
  tips: 'Napojnice',
  supplies: 'Materijal',
  rent: 'Kirija',
  utilities: 'Režije',
  salaries: 'Plate',
  marketing: 'Marketing',
  other: 'Ostalo',
}

export default function FinancesPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Učitavanje...</div>}>
      <FinancesPageContent />
    </Suspense>
  )
}

function FinancesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income')
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null)

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>((searchParams.get('period') as ChartPeriod) || 'months')
  const [selectedChartDate, setSelectedChartDate] = useState<Date | null>(null)
  const [transactionFilter, setTransactionFilter] = useState<string>(searchParams.get('month') || 'all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>((searchParams.get('type') as 'all' | 'income' | 'expense') || 'all')
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || 'all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'auto' | 'manual'>((searchParams.get('source') as 'all' | 'auto' | 'manual') || 'all')

  // Date filters
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const firstDayOfWeek = new Date(today)
  firstDayOfWeek.setDate(today.getDate() - today.getDay())

  // Update URL with current filters
  const updateFiltersUrl = useCallback((newFilters: {
    period?: ChartPeriod
    month?: string
    type?: 'all' | 'income' | 'expense'
    category?: string
    source?: 'all' | 'auto' | 'manual'
  }) => {
    const params = new URLSearchParams()
    const period = newFilters.period ?? chartPeriod
    const month = newFilters.month ?? transactionFilter
    const type = newFilters.type ?? typeFilter
    const category = newFilters.category ?? categoryFilter
    const source = newFilters.source ?? sourceFilter

    if (period !== 'months') params.set('period', period)
    if (month !== 'all') params.set('month', month)
    if (type !== 'all') params.set('type', type)
    if (category !== 'all') params.set('category', category)
    if (source !== 'all') params.set('source', source)

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname, chartPeriod, transactionFilter, typeFilter, categoryFilter, sourceFilter])

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/dashboard/finances')
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingEntry
        ? `/api/dashboard/finances/${editingEntry.id}`
        : '/api/dashboard/finances'

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
        setFormData({
          category: '',
          amount: '',
          description: '',
          entry_date: format(new Date(), 'yyyy-MM-dd'),
        })
        fetchEntries()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju unosa')
      }
    } catch (error) {
      console.error('Error:', error)
    }
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

  // Calculate stats
  const calculateStats = (entries: FinancialEntry[], startDate?: Date) => {
    const filtered = startDate
      ? entries.filter((e) => new Date(e.entry_date) >= startDate)
      : entries

    const income = filtered
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const expenses = filtered
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount), 0)

    return { income, expenses, profit: income - expenses }
  }

  const todayStats = calculateStats(
    entries.filter((e) => e.entry_date === format(today, 'yyyy-MM-dd'))
  )
  const weekStats = calculateStats(entries, firstDayOfWeek)
  const monthStats = calculateStats(entries, firstDayOfMonth)

  // Prepare chart data based on selected period
  const chartData = useMemo(() => {
    const now = new Date()
    const data: { name: string; fullName: string; income: number; expense: number; date: Date }[] = []

    if (chartPeriod === 'days') {
      // Last 14 days
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
      // Last 6 months
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

  // Handle chart bar click
  const handleChartClick = (data: { name: string; date: Date } | null) => {
    if (data) {
      if (chartPeriod === 'months') {
        // Set dropdown filter to the clicked month
        setTransactionFilter(data.date.getMonth().toString())
        setSelectedChartDate(null)
      } else {
        // For days, use selectedChartDate since days aren't in dropdown
        setSelectedChartDate(data.date)
        setTransactionFilter('all')
      }
    }
  }

  // Clear chart selection
  const clearChartSelection = () => {
    setSelectedChartDate(null)
  }

  // Filter entries based on selected chart date or dropdown filter
  const filteredEntries = useMemo(() => {
    let filtered = entries

    // If chart date is selected, filter by that
    if (selectedChartDate) {
      if (chartPeriod === 'days') {
        filtered = filtered.filter((e) => isSameDay(new Date(e.entry_date), selectedChartDate))
      } else {
        filtered = filtered.filter((e) => isSameMonth(new Date(e.entry_date), selectedChartDate))
      }
    } else if (transactionFilter !== 'all') {
      // Filter by selected month (0-11)
      const monthIndex = parseInt(transactionFilter, 10)
      const now = new Date()
      const year = now.getFullYear()
      filtered = filtered.filter((e) => {
        const entryDate = new Date(e.entry_date)
        return entryDate.getMonth() === monthIndex && entryDate.getFullYear() === year
      })
    }

    // Filter by type (income/expense)
    if (typeFilter !== 'all') {
      filtered = filtered.filter((e) => e.type === typeFilter)
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((e) => e.category === categoryFilter)
    }

    // Filter by source (auto = has booking_id, manual = no booking_id)
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'auto') {
        filtered = filtered.filter((e) => e.booking_id !== null)
      } else {
        filtered = filtered.filter((e) => e.booking_id === null)
      }
    }

    return filtered
  }, [entries, selectedChartDate, chartPeriod, transactionFilter, typeFilter, categoryFilter, sourceFilter])


  return (
    <div className="space-y-4 md:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Finansije</h1>
          <p className="text-base sm:text-lg text-muted-foreground hidden md:block">Pregled prihoda i rashoda</p>
          {/* Compact stats for mobile */}
          <p className="text-sm text-muted-foreground md:hidden">
            Ovaj mesec: <span className={`font-semibold ${monthStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{monthStats.profit.toLocaleString('sr-RS')} RSD</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none h-10" onClick={() => openDialog('expense')}>
            <ArrowDownRight className="mr-1 sm:mr-2 h-4 w-4 text-destructive" />
            <span className="hidden sm:inline">Dodaj </span>Rashod
          </Button>
          <Button className="flex-1 sm:flex-none h-10" onClick={() => openDialog('income')}>
            <ArrowUpRight className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Dodaj </span>Prihod
          </Button>
        </div>
      </div>

      {/* Stats Cards - hidden on mobile */}
      <div className="hidden md:grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Danas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${todayStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {todayStats.profit.toLocaleString('sr-RS')} RSD
            </div>
            <p className="text-sm text-muted-foreground">
              +{todayStats.income.toLocaleString('sr-RS')} | -{todayStats.expenses.toLocaleString('sr-RS')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ova nedelja</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${weekStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {weekStats.profit.toLocaleString('sr-RS')} RSD
            </div>
            <p className="text-sm text-muted-foreground">
              +{weekStats.income.toLocaleString('sr-RS')} | -{weekStats.expenses.toLocaleString('sr-RS')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ovaj mesec</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {monthStats.profit.toLocaleString('sr-RS')} RSD
            </div>
            <p className="text-sm text-muted-foreground">
              +{monthStats.income.toLocaleString('sr-RS')} | -{monthStats.expenses.toLocaleString('sr-RS')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateStats(entries).profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {calculateStats(entries).profit.toLocaleString('sr-RS')} RSD
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
            updateFiltersUrl({ period: v as ChartPeriod })
          }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
                  contentStyle={{
                    backgroundColor: '#1E2330',
                    border: '1px solid #2E3545',
                    borderRadius: '8px',
                    color: CHART_COLORS.label,
                  }}
                  labelStyle={{ color: CHART_COLORS.label, fontWeight: 600 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div style={{
                          backgroundColor: '#1E2330',
                          border: '1px solid #2E3545',
                          borderRadius: '8px',
                          padding: '12px',
                          color: CHART_COLORS.label,
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: '8px' }}>{data.fullName}</p>
                          <p style={{ color: CHART_COLORS.income }}>
                            Prihod: {data.income.toLocaleString('sr-RS')} RSD
                          </p>
                          <p style={{ color: CHART_COLORS.expense }}>
                            Rashod: {data.expense.toLocaleString('sr-RS')} RSD
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
                  onClick={(data) => {
                    const clickedData = chartData.find((d) => d.name === data.name)
                    if (clickedData) handleChartClick(clickedData)
                  }}
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill={CHART_COLORS.expense}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const clickedData = chartData.find((d) => d.name === data.name)
                    if (clickedData) handleChartClick(clickedData)
                  }}
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
                        onClick={clearChartSelection}
                        className="ml-2 text-primary hover:underline"
                      >
                        (poništi filter)
                      </button>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Select
                  value={selectedChartDate ? 'chart' : transactionFilter}
                  onValueChange={(v) => {
                    if (v !== 'chart') {
                      setSelectedChartDate(null)
                      setTransactionFilter(v)
                      updateFiltersUrl({ month: v })
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Mesec" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi meseci</SelectItem>
                    <SelectItem value="0">Januar</SelectItem>
                  <SelectItem value="1">Februar</SelectItem>
                  <SelectItem value="2">Mart</SelectItem>
                  <SelectItem value="3">April</SelectItem>
                  <SelectItem value="4">Maj</SelectItem>
                  <SelectItem value="5">Jun</SelectItem>
                  <SelectItem value="6">Jul</SelectItem>
                  <SelectItem value="7">Avgust</SelectItem>
                  <SelectItem value="8">Septembar</SelectItem>
                  <SelectItem value="9">Oktobar</SelectItem>
                  <SelectItem value="10">Novembar</SelectItem>
                  <SelectItem value="11">Decembar</SelectItem>
                  {chartPeriod === 'days' && selectedChartDate && (
                    <SelectItem value="chart" disabled>
                      {format(selectedChartDate, 'd. MMM', { locale: srLatn })}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v) => {
                setTypeFilter(v as 'all' | 'income' | 'expense')
                setCategoryFilter('all') // Reset category when type changes
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

              <Select value={sourceFilter} onValueChange={(v) => {
                setSourceFilter(v as 'all' | 'auto' | 'manual')
                updateFiltersUrl({ source: v as 'all' | 'auto' | 'manual' })
              }}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Izvor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi izvori</SelectItem>
                  <SelectItem value="auto">Dragica</SelectItem>
                  <SelectItem value="manual">Ručni unos</SelectItem>
                </SelectContent>
              </Select>

              {(transactionFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || sourceFilter !== 'all' || selectedChartDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="col-span-2 sm:col-span-1 w-full sm:w-auto"
                  onClick={() => {
                    setTransactionFilter('all')
                    setTypeFilter('all')
                    setCategoryFilter('all')
                    setSourceFilter('all')
                    setSelectedChartDate(null)
                    router.replace(pathname, { scroll: false })
                  }}
                >
                  Poništi filtere
                </Button>
              )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Učitavanje...</p>
              ) : filteredEntries.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nema unosa</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredEntries.slice(0, 20).map((entry) => (
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
                        {Number(entry.amount).toLocaleString('sr-RS')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

      {/* Add Entry Dialog */}
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
                  required
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
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false)
                setEditingEntry(null)
              }}>
                Otkaži
              </Button>
              <Button type="submit">{editingEntry ? 'Sačuvaj' : 'Dodaj'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
