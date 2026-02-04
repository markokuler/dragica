'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale'

interface BlockedSlot {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
  created_at: string
}

export default function BlockedSlotsPage() {
  const params = useParams()
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    reason: '',
  })

  useEffect(() => {
    fetchBlockedSlots()
  }, [])

  const fetchBlockedSlots = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${params.id}/blocked-slots`)
      const data = await response.json()
      setBlockedSlots(data.slots || [])
    } catch (error) {
      console.error('Error fetching blocked slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const start_datetime = `${formData.start_date}T${formData.start_time}:00`
      const end_datetime = `${formData.end_date}T${formData.end_time}:00`

      const response = await fetch(`/api/admin/salons/${params.id}/blocked-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_datetime,
          end_datetime,
          reason: formData.reason || null,
        }),
      })

      if (response.ok) {
        setDialogOpen(false)
        setFormData({
          start_date: '',
          start_time: '09:00',
          end_date: '',
          end_time: '17:00',
          reason: '',
        })
        fetchBlockedSlots()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri dodavanju blokiranja')
      }
    } catch (error) {
      console.error('Error saving blocked slot:', error)
      alert('Greška pri dodavanju blokiranja')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (slotId: string) => {
    if (!confirm('Da li ste sigurni da želite da uklonite ovo blokiranje?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/salons/${params.id}/blocked-slots/${slotId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        fetchBlockedSlots()
      }
    } catch (error) {
      console.error('Error deleting blocked slot:', error)
    }
  }

  // Group slots by date
  const groupedSlots = blockedSlots.reduce((acc, slot) => {
    const date = slot.start_datetime.split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(slot)
    return acc
  }, {} as Record<string, BlockedSlot[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/salons/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Blokirani termini</h1>
          <p className="text-muted-foreground">
            Upravljanje blokiranih termina salona
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Blokiraj termin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blokirani termini</CardTitle>
          <CardDescription>
            {blockedSlots.length} blokiran{blockedSlots.length === 1 ? '' : 'ih'} termin
            {blockedSlots.length === 1 ? '' : 'a'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Učitavanje...
            </div>
          ) : blockedSlots.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nema blokiranih termina
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Blokiraj prvi termin
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedSlots)
                .sort()
                .reverse()
                .map((date) => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold mb-3">
                      {format(new Date(date), 'EEEE, d. MMMM yyyy.', {
                        locale: srLatn,
                      })}
                    </h3>
                    <div className="space-y-2">
                      {groupedSlots[date].map((slot) => {
                        const startTime = new Date(slot.start_datetime).toLocaleTimeString(
                          'sr-RS',
                          { hour: '2-digit', minute: '2-digit' }
                        )
                        const endTime = new Date(slot.end_datetime).toLocaleTimeString(
                          'sr-RS',
                          { hour: '2-digit', minute: '2-digit' }
                        )

                        return (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <span className="font-mono text-lg">
                                  {startTime} - {endTime}
                                </span>
                                {slot.reason && (
                                  <span className="text-muted-foreground">
                                    · {slot.reason}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(slot.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Blokiraj termin</DialogTitle>
            <DialogDescription>
              Dodajte vremenski period kada salon neće biti dostupan za zakazivanje
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Početni datum *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Početno vreme *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end_date">Krajnji datum *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">Krajnje vreme *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Razlog (opciono)</Label>
                <Textarea
                  id="reason"
                  placeholder="Npr. Godišnji odmor, renoviranje salona..."
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Otkaži
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Čuvanje...' : 'Blokiraj'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
