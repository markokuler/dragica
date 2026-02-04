'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale'

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

  const incomeEntries = entries.filter((e) => e.type === 'income')
  const expenseEntries = entries.filter((e) => e.type === 'expense')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finansije</h1>
          <p className="text-muted-foreground">Pregled prihoda i rashoda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openDialog('expense')}>
            <ArrowDownRight className="mr-2 h-4 w-4 text-red-500" />
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateStats(entries).profit.toLocaleString('sr-RS')} RSD
            </div>
            <p className="text-xs text-muted-foreground">{entries.length} unosa</p>
          </CardContent>
        </Card>
      </div>

      {/* Entries Lists */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Sve transakcije</TabsTrigger>
          <TabsTrigger value="income">Prihodi</TabsTrigger>
          <TabsTrigger value="expenses">Rashodi</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Sve transakcije</CardTitle>
              <CardDescription>{entries.length} unosa</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Učitavanje...</p>
              ) : entries.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nema unosa</p>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-4">
                        {entry.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
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
                          entry.type === 'income' ? 'text-green-500' : 'text-red-500'
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
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Prihodi</CardTitle>
              <CardDescription>{incomeEntries.length} unosa</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeEntries.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nema prihoda</p>
              ) : (
                <div className="space-y-3">
                  {incomeEntries.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted"
                    >
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
                      <p className="font-bold text-green-500">
                        +{Number(entry.amount).toLocaleString('sr-RS')} RSD
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Rashodi</CardTitle>
              <CardDescription>{expenseEntries.length} unosa</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseEntries.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nema rashoda</p>
              ) : (
                <div className="space-y-3">
                  {expenseEntries.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted"
                    >
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
                      <p className="font-bold text-red-500">
                        -{Number(entry.amount).toLocaleString('sr-RS')} RSD
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
