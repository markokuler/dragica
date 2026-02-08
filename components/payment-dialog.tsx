'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tag } from 'lucide-react'
import { format } from 'date-fns'

interface Plan {
  id: string
  name: string
  duration_days: number
  price: number
  is_trial: boolean
}

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  max_uses: number | null
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
}

interface SalonOption {
  id: string
  name: string
}

export interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salon?: { id: string; name: string } | null
  onSuccess?: () => void
}

export function PaymentDialog({ open, onOpenChange, salon, onSuccess }: PaymentDialogProps) {
  const [salons, setSalons] = useState<SalonOption[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    salon_id: '',
    plan_id: '',
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    coupon_id: '',
  })

  // Fetch data when dialog opens
  useEffect(() => {
    if (!open) return

    // Reset form
    setForm({
      salon_id: salon?.id || '',
      plan_id: '',
      amount: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      coupon_id: '',
    })

    const fetchData = async () => {
      const fetches: Promise<void>[] = [
        fetch('/api/admin/plans').then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            setPlans(data.plans || [])
          }
        }),
        fetch('/api/admin/coupons').then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            setCoupons(data.coupons || [])
          }
        }),
      ]

      // Only fetch salons if no salon prop
      if (!salon) {
        fetches.push(
          fetch('/api/admin/salons').then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setSalons((data.salons || []).map((s: SalonOption) => ({ id: s.id, name: s.name })))
            }
          })
        )
      }

      await Promise.all(fetches)
    }

    fetchData()
  }, [open, salon])

  const validCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (!c.is_active) return false
      if (c.valid_until && new Date(c.valid_until) < new Date()) return false
      if (c.max_uses && c.current_uses >= c.max_uses) return false
      return true
    })
  }, [coupons])

  const calculateDiscountedPrice = (price: number, coupon: Coupon | undefined) => {
    if (!coupon) return price
    if (coupon.discount_type === 'percentage') {
      return Math.round(price * (1 - coupon.discount_value / 100))
    }
    return Math.max(0, price - coupon.discount_value)
  }

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    const selectedCoupon = validCoupons.find((c) => c.id === form.coupon_id)
    const basePrice = plan?.price || 0
    const finalPrice = calculateDiscountedPrice(basePrice, selectedCoupon)
    setForm({
      ...form,
      plan_id: planId,
      amount: plan ? finalPrice.toString() : '',
    })
  }

  const handleCouponChange = (couponId: string) => {
    const actualId = couponId === 'none' ? '' : couponId
    const plan = plans.find((p) => p.id === form.plan_id)
    const selectedCoupon = actualId ? validCoupons.find((c) => c.id === actualId) : undefined
    const basePrice = plan?.price || 0
    const finalPrice = calculateDiscountedPrice(basePrice, selectedCoupon)
    setForm({
      ...form,
      coupon_id: actualId,
      amount: plan ? finalPrice.toString() : form.amount,
    })
  }

  const handleSubmit = async () => {
    const tenantId = salon?.id || form.salon_id
    if (!tenantId || !form.plan_id) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          plan_id: form.plan_id,
          amount: parseFloat(form.amount),
          payment_date: form.payment_date,
          notes: form.notes || null,
          coupon_id: form.coupon_id || null,
        }),
      })

      if (response.ok) {
        onOpenChange(false)
        onSuccess?.()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri evidentiranju uplate')
      }
    } catch {
      alert('Greška pri evidentiranju uplate')
    } finally {
      setSubmitting(false)
    }
  }

  const tenantId = salon?.id || form.salon_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Evidentiraj uplatu</DialogTitle>
          <DialogDescription>
            {salon ? salon.name : 'Izaberite salon i unesite detalje uplate'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Salon selector — only if no salon prop */}
          {!salon && (
            <div className="space-y-2">
              <Label>Salon *</Label>
              <Select value={form.salon_id} onValueChange={(v) => setForm({ ...form, salon_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Izaberi salon" />
                </SelectTrigger>
                <SelectContent>
                  {salons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Plan selector */}
          <div className="space-y-2">
            <Label>Plan *</Label>
            <Select value={form.plan_id} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Izaberi plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.filter((p) => !p.is_trial).map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {plan.price.toLocaleString('sr-RS')} RSD ({plan.duration_days} dana)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coupon selector */}
          {validCoupons.length > 0 && form.plan_id && (
            <div className="space-y-2">
              <Label>Kupon (opciono)</Label>
              <Select value={form.coupon_id || 'none'} onValueChange={handleCouponChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Bez kupona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bez kupona</SelectItem>
                  {validCoupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      <span className="flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        {coupon.code} —{' '}
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : `${coupon.discount_value.toLocaleString('sr-RS')} RSD`}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Discount breakdown */}
          {form.coupon_id && form.plan_id && (() => {
            const plan = plans.find((p) => p.id === form.plan_id)
            const coupon = validCoupons.find((c) => c.id === form.coupon_id)
            if (!plan || !coupon) return null
            const originalPrice = plan.price
            const discountedPrice = calculateDiscountedPrice(originalPrice, coupon)
            const savings = originalPrice - discountedPrice
            return (
              <div className="rounded-lg bg-success/5 border border-success/20 p-3 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Originalna cena:</span>
                  <span className="line-through">{originalPrice.toLocaleString('sr-RS')} RSD</span>
                </div>
                <div className="flex justify-between text-success font-medium">
                  <span>Popust ({coupon.code}):</span>
                  <span>-{savings.toLocaleString('sr-RS')} RSD</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-success/20 pt-1">
                  <span>Konačna cena:</span>
                  <span>{discountedPrice.toLocaleString('sr-RS')} RSD</span>
                </div>
              </div>
            )
          })()}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="pd-amount">Iznos (RSD) *</Label>
            <Input
              id="pd-amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="pd-date">Datum uplate *</Label>
            <Input
              id="pd-date"
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="pd-notes">Napomena</Label>
            <Textarea
              id="pd-notes"
              placeholder="Opciona napomena..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Otkaži
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.plan_id || !tenantId}>
            {submitting ? 'Čuvanje...' : 'Evidentiraj'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
