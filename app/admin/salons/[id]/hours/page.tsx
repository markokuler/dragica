'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface WorkingHours {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

const DAYS = [
  'Nedelja',
  'Ponedeljak',
  'Utorak',
  'Sreda',
  'Četvrtak',
  'Petak',
  'Subota',
]

export default function WorkingHoursPage() {
  const params = useParams()
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '17:00',
  })

  useEffect(() => {
    fetchWorkingHours()
  }, [])

  const fetchWorkingHours = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${params.id}/hours`)
      const data = await response.json()
      setWorkingHours(data.hours || [])
    } catch (error) {
      console.error('Error fetching working hours:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHours = (day: number) => {
    setSelectedDay(day)
    setFormData({ start_time: '09:00', end_time: '17:00' })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDay === null) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/salons/${params.id}/hours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_of_week: selectedDay,
          start_time: formData.start_time,
          end_time: formData.end_time,
        }),
      })

      if (response.ok) {
        setDialogOpen(false)
        setSelectedDay(null)
        fetchWorkingHours()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri dodavanju radnog vremena')
      }
    } catch (error) {
      console.error('Error saving working hours:', error)
      alert('Greška pri dodavanju radnog vremena')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (hourId: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovo radno vreme?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/salons/${params.id}/hours/${hourId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        fetchWorkingHours()
      }
    } catch (error) {
      console.error('Error deleting working hours:', error)
    }
  }

  const getHoursForDay = (day: number) => {
    return workingHours.filter((h) => h.day_of_week === day && h.is_active)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/salons/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Radno vreme</h1>
          <p className="text-muted-foreground">
            Podešavanje radnog vremena salona
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {DAYS.map((dayName, dayIndex) => {
          const hoursForDay = getHoursForDay(dayIndex)

          return (
            <Card key={dayIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{dayName}</CardTitle>
                    <CardDescription>
                      {hoursForDay.length === 0
                        ? 'Neradni dan'
                        : `${hoursForDay.length} radno${
                            hoursForDay.length === 1 ? '' : 'g'
                          } vreme${hoursForDay.length === 1 ? '' : 'na'}`}
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAddHours(dayIndex)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj vreme
                  </Button>
                </div>
              </CardHeader>
              {hoursForDay.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {hoursForDay.map((hour) => (
                      <div
                        key={hour.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-lg">
                            {hour.start_time} - {hour.end_time}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(hour.id)}
                        >
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj radno vreme</DialogTitle>
            <DialogDescription>
              {selectedDay !== null && `Dodavanje radnog vremena za ${DAYS[selectedDay]}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Početak *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="end_time">Kraj *</Label>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Otkaži
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Čuvanje...' : 'Dodaj'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
