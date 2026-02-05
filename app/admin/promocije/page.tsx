'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Percent,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react'

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  description: string | null
  created_at: string
}

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    max_uses: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setForm({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        max_uses: coupon.max_uses?.toString() || '',
        valid_from: coupon.valid_from,
        valid_until: coupon.valid_until || '',
        description: coupon.description || '',
      })
    } else {
      setEditingCoupon(null)
      setForm({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        description: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.discount_value) return

    setSaving(true)
    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons'

      const response = await fetch(url, {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (response.ok) {
        setDialogOpen(false)
        fetchCoupons()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška')
      }
    } catch {
      alert('Greška pri čuvanju')
    } finally {
      setSaving(false)
    }
  }

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      fetchCoupons()
    } catch (error) {
      console.error('Error toggling coupon:', error)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      await fetch(`/api/admin/coupons/${deletingId}`, { method: 'DELETE' })
      fetchCoupons()
    } catch (error) {
      console.error('Error deleting coupon:', error)
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false
    return new Date(coupon.valid_until) < new Date()
  }

  const isMaxedOut = (coupon: Coupon) => {
    if (!coupon.max_uses) return false
    return coupon.current_uses >= coupon.max_uses
  }

  // Stats
  const activeCoupons = coupons.filter(c => c.is_active && !isExpired(c) && !isMaxedOut(c)).length
  const totalUses = coupons.reduce((sum, c) => sum + c.current_uses, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Promocije</h1>
          <p className="text-muted-foreground">Upravljanje kuponima i popustima</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novi kupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ukupno kupona</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aktivnih</p>
                <p className="text-2xl font-bold text-success">{activeCoupons}</p>
              </div>
              <Check className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ukupno korišćeno</p>
                <p className="text-2xl font-bold">{totalUses}</p>
              </div>
              <Percent className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Isteklih</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {coupons.filter(c => isExpired(c) || isMaxedOut(c)).length}
                </p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Svi kuponi</CardTitle>
          <CardDescription>Lista svih kreiranih kupona</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Učitavanje...</p>
          ) : coupons.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nema kreiranih kupona
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Popust</TableHead>
                    <TableHead>Korišćeno</TableHead>
                    <TableHead className="hidden md:table-cell">Važi do</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon)
                    const maxed = isMaxedOut(coupon)

                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCode(coupon.code)}
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {coupon.discount_type === 'percentage' ? (
                              <>
                                <Percent className="h-3 w-3" />
                                {coupon.discount_value}%
                              </>
                            ) : (
                              <>
                                {coupon.discount_value.toLocaleString('sr-RS')} RSD
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {coupon.current_uses}
                          {coupon.max_uses && ` / ${coupon.max_uses}`}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {coupon.valid_until
                            ? new Date(coupon.valid_until).toLocaleDateString('sr-RS')
                            : 'Neograničeno'}
                        </TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant="secondary">Istekao</Badge>
                          ) : maxed ? (
                            <Badge variant="secondary">Iskorišćen</Badge>
                          ) : coupon.is_active ? (
                            <Badge className="bg-success">Aktivan</Badge>
                          ) : (
                            <Badge variant="destructive">Neaktivan</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={coupon.is_active}
                              onCheckedChange={() => toggleCouponStatus(coupon)}
                              disabled={expired || maxed}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDialog(coupon)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(coupon.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Izmeni kupon' : 'Novi kupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Izmenite detalje kupona' : 'Kreirajte novi kupon za popust'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kod kupona *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="npr. POPUST20"
                className="uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tip popusta *</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v: 'percentage' | 'fixed') =>
                    setForm({ ...form, discount_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Procenat (%)</SelectItem>
                    <SelectItem value="fixed">Fiksni iznos (RSD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  Vrednost * {form.discount_type === 'percentage' ? '(%)' : '(RSD)'}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === 'percentage' ? '20' : '500'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Važi od *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Važi do</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_uses">Maksimalan broj korišćenja</Label>
              <Input
                id="max_uses"
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Ostavite prazno za neograničeno"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Opcioni opis kupona..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.code || !form.discount_value}>
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši kupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija se ne može poništiti. Kupon će biti trajno obrisan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
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
