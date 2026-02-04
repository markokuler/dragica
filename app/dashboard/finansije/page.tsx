'use client'

import { useEffect, useState, useMemo } from 'react'
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
  axis: '#9CA3AF',        // muted-foreground
  label: '#FFFFFF',       // foreground
  grid: '#2E3545',        // border color
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
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income')

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('months')
  const [selectedChartDate, setSelectedChartDate] = useState<Date | null>(null)
  const [transactionFilter, setTransactionFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Date filters
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const firstDayOfWeek = new Date(today)
  firstDayOfWeek.setDate(today.getDate() - today.getDay())

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
      const response = await fetch('/api/dashboard/finances', {
        method: 'POST',
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
        setFormData({
          category: '',
          amount: '',
          description: '',
          entry_date: format(new Date(), 'yyyy-MM-dd'),
        })
        fetchEntries()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri dodavanju unosa')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const openDialog = (type: 'income' | 'expense') => {
    setEntryType(type)
    setFormData({
      category: '',
      amount: '',
      description: '',
      entry_date: format(new Date(), 'yyyy-MM-dd'),
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

    return filtered
  }, [entries, selectedChartDate, chartPeriod, transactionFilter, typeFilter, categoryFilter])


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finansije</h1>
          <p className="text-muted-foreground">Pregled prihoda i rashoda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openDialog('expense')}>
            <ArrowDownRight className="mr-2 h-4 w-4 text-destructive" />
            Dodaj rashod
          </Button>
          <Button onClick={() => openDialog('income')}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Dodaj prihod
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Danas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${todayStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {todayStats.profit.toLocaleString('sr-RS')} RSD
            </div>
            <p className="text-xs text-muted-foreground">
              Prihod: {todayStats.income.toLocaleString('sr-RS')} | Rashod:{' '}
              {todayStats.expenses.toLocaleString('sr-RS')}
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
            <p className="text-xs text-muted-foreground">
              Prihod: {weekStats.income.toLocaleString('sr-RS')} | Rashod:{' '}
              {weekStats.expenses.toLocaleString('sr-RS')}
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
            <p className="text-xs text-muted-foreground">
              Prihod: {monthStats.income.toLocaleString('sr-RS')} | Rashod:{' '}
              {monthStats.expenses.toLocaleString('sr-RS')}
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
            <p className="text-xs text-muted-foreground">{entries.length} unosa</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Pregled finansija</CardTitle>
            <CardDescription>
              {chartPeriod === 'days' && 'Prihodi i rashodi poslednjih 14 dana'}
              {chartPeriod === 'months' && 'Prihodi i rashodi poslednjih 6 meseci'}
              {chartPeriod === 'days' && selectedChartDate && (
                <span className="ml-2 text-primary">
                  • Filtrirano: {format(selectedChartDate, 'd. MMM yyyy', { locale: srLatn })}
                </span>
              )}
            </CardDescription>
          </div>
          <Select value={chartPeriod} onValueChange={(v) => setChartPeriod(v as ChartPeriod)}>
            <SelectTrigger className="w-40">
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
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedChartDate ? 'chart' : transactionFilter}
                  onValueChange={(v) => {
                    if (v !== 'chart') {
                      setSelectedChartDate(null)
                      setTransactionFilter(v)
                    }
                  }}
                >
                  <SelectTrigger className="w-36">
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
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve</SelectItem>
                  <SelectItem value="income">Prihodi</SelectItem>
                  <SelectItem value="expense">Rashodi</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44">
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

              {(transactionFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || selectedChartDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTransactionFilter('all')
                    setTypeFilter('all')
                    setCategoryFilter('all')
                    setSelectedChartDate(null)
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
                <div className="space-y-3">
                  {filteredEntries.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-4">
                        {entry.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">
                            {CATEGORY_LABELS[entry.category] || entry.category}
                          </p>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.entry_date), 'd. MMM yyyy', { locale: srLatn })}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-bold ${
                          entry.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {entry.type === 'income' ? '+' : '-'}
                        {Number(entry.amount).toLocaleString('sr-RS')} RSD
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
              {entryType === 'income' ? 'Dodaj prihod' : 'Dodaj rashod'}
            </DialogTitle>
            <DialogDescription>
              Unesite detalje o {entryType === 'income' ? 'prihodu' : 'rashodu'}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit">Dodaj</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
