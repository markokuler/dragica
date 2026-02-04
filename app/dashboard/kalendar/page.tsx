'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Trash2, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale'

interface WorkingHours {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface BlockedSlot {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
}

interface Booking {
  id: string
  start_datetime: string
  end_datetime: string
  status: string
  service: { name: string }
  customer: { name: string | null; phone: string }
}

const DAYS = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota']

export default function CalendarPage() {
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const [hoursDialogOpen, setHoursDialogOpen] = useState(false)
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [hoursForm, setHoursForm] = useState({ start_time: '09:00', end_time: '17:00' })
  const [blockedForm, setBlockedForm] = useState({
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    reason: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [hoursRes, slotsRes, bookingsRes] = await Promise.all([
        fetch('/api/dashboard/working-hours'),
        fetch('/api/dashboard/blocked-slots'),
        fetch('/api/dashboard/bookings?upcoming=true&limit=10'),
      ])

      if (hoursRes.ok) {
        const data = await hoursRes.json()
        setWorkingHours(data.hours || [])
      }
      if (slotsRes.ok) {
        const data = await slotsRes.json()
        setBlockedSlots(data.slots || [])
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setUpcomingBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHours = (day: number) => {
    setSelectedDay(day)
    setHoursForm({ start_time: '09:00', end_time: '17:00' })
    setHoursDialogOpen(true)
  }

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDay === null) return

    try {
      const response = await fetch('/api/dashboard/working-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: selectedDay,
          ...hoursForm,
        }),
      })

      if (response.ok) {
        setHoursDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri dodavanju radnog vremena')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteHours = async (id: string) => {
    if (!confirm('Da li ste sigurni?')) return

    try {
      const response = await fetch(`/api/dashboard/working-hours/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) fetchData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleBlockedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/dashboard/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_datetime: `${blockedForm.start_date}T${blockedForm.start_time}:00`,
          end_datetime: `${blockedForm.end_date}T${blockedForm.end_time}:00`,
          reason: blockedForm.reason || null,
        }),
      })

      if (response.ok) {
        setBlockedDialogOpen(false)
        setBlockedForm({ start_date: '', start_time: '09:00', end_date: '', end_time: '17:00', reason: '' })
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri blokiranju termina')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteBlocked = async (id: string) => {
    if (!confirm('Da li ste sigurni?')) return

    try {
      const response = await fetch(`/api/dashboard/blocked-slots/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) fetchData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getHoursForDay = (day: number) => {
    return workingHours.filter((h) => h.day_of_week === day && h.is_active)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Kalendar</h1>
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kalendar</h1>
        <p className="text-muted-foreground">Upravljajte radnim vremenom i blokiranim terminima</p>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Radno vreme</TabsTrigger>
          <TabsTrigger value="blocked">Blokirani termini</TabsTrigger>
          <TabsTrigger value="upcoming">Predstojeći termini</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4">
            {DAYS.map((dayName, dayIndex) => {
              const hoursForDay = getHoursForDay(dayIndex)
              return (
                <Card key={dayIndex}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{dayName}</CardTitle>
                        <CardDescription>
                          {hoursForDay.length === 0 ? 'Neradni dan' : `${hoursForDay.length} termin(a)`}
                        </CardDescription>
                      </div>
                      <Button size="sm" onClick={() => handleAddHours(dayIndex)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Dodaj
                      </Button>
                    </div>
                  </CardHeader>
                  {hoursForDay.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {hoursForDay.map((hour) => (
                          <div key={hour.id} className="flex items-center justify-between p-2 rounded bg-muted">
                            <span className="font-mono">
                              {hour.start_time} - {hour.end_time}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteHours(hour.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setBlockedDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Blokiraj termin
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Blokirani termini</CardTitle>
              <CardDescription>Periodi kada niste dostupni za zakazivanje</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedSlots.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nema blokiranih termina</p>
              ) : (
                <div className="space-y-3">
                  {blockedSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">
                          {format(new Date(slot.start_datetime), 'd. MMM yyyy HH:mm', { locale: srLatn })} -{' '}
                          {format(new Date(slot.end_datetime), 'd. MMM yyyy HH:mm', { locale: srLatn })}
                        </p>
                        {slot.reason && <p className="text-sm text-muted-foreground">{slot.reason}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBlocked(slot.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predstojeći termini</CardTitle>
              <CardDescription>Naredna zakazivanja</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nema predstojećih termina</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">{booking.customer.name || booking.customer.phone}</p>
                        <p className="text-sm text-muted-foreground">{booking.service.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {format(new Date(booking.start_datetime), 'HH:mm')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.start_datetime), 'EEE, d. MMM', { locale: srLatn })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Working Hours Dialog */}
      <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj radno vreme</DialogTitle>
            <DialogDescription>
              {selectedDay !== null && `Dodavanje za ${DAYS[selectedDay]}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHoursSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Početak</Label>
                <Input
                  type="time"
                  value={hoursForm.start_time}
                  onChange={(e) => setHoursForm({ ...hoursForm, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kraj</Label>
                <Input
                  type="time"
                  value={hoursForm.end_time}
                  onChange={(e) => setHoursForm({ ...hoursForm, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setHoursDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit">Dodaj</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Blocked Slot Dialog */}
      <Dialog open={blockedDialogOpen} onOpenChange={setBlockedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blokiraj termin</DialogTitle>
            <DialogDescription>Dodajte period kada nećete raditi</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBlockedSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Početni datum</Label>
                  <Input
                    type="date"
                    value={blockedForm.start_date}
                    onChange={(e) => setBlockedForm({ ...blockedForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Početno vreme</Label>
                  <Input
                    type="time"
                    value={blockedForm.start_time}
                    onChange={(e) => setBlockedForm({ ...blockedForm, start_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Krajnji datum</Label>
                  <Input
                    type="date"
                    value={blockedForm.end_date}
                    onChange={(e) => setBlockedForm({ ...blockedForm, end_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Krajnje vreme</Label>
                  <Input
                    type="time"
                    value={blockedForm.end_time}
                    onChange={(e) => setBlockedForm({ ...blockedForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Razlog (opciono)</Label>
                <Textarea
                  placeholder="Npr. Godišnji odmor"
                  value={blockedForm.reason}
                  onChange={(e) => setBlockedForm({ ...blockedForm, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBlockedDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit">Blokiraj</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
