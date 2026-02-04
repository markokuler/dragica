'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface Booking {
  id: string
  start_datetime: string
  end_datetime: string
  status: string
  service: {
    id: string
    name: string
    price: number
    duration_minutes: number
  }
  customer: {
    id: string
    name: string | null
    phone: string
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, dateFilter])

  const fetchBookings = async () => {
    try {
      let url = '/api/dashboard/bookings?limit=100'
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      if (dateFilter) {
        url += `&startDate=${dateFilter}`
      }

      const response = await fetch(url)
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchBookings()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri promeni statusa')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Da li ste sigurni da želite da otkažete ovaj termin?')) {
      return
    }
    handleStatusChange(bookingId, 'cancelled')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Završeno
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
            <XCircle className="mr-1 h-3 w-3" />
            Otkazano
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Potvrđeno
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
            <Clock className="mr-1 h-3 w-3" />
            Na čekanju
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zakazivanja</h1>
          <p className="text-muted-foreground">Pregled i upravljanje terminima</p>
        </div>
        <Link href="/dashboard/zakazivanja/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo zakazivanje
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filteri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  <SelectItem value="pending">Na čekanju</SelectItem>
                  <SelectItem value="confirmed">Potvrđeno</SelectItem>
                  <SelectItem value="completed">Završeno</SelectItem>
                  <SelectItem value="cancelled">Otkazano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Datum"
              />
            </div>
            {(statusFilter !== 'all' || dateFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all')
                  setDateFilter('')
                }}
              >
                Poništi filtere
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Termini</CardTitle>
          <CardDescription>{bookings.length} zakazivanja</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Učitavanje...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nema zakazivanja</p>
              <Link href="/dashboard/zakazivanja/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Kreiraj prvo zakazivanje
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum i vreme</TableHead>
                  <TableHead>Klijent</TableHead>
                  <TableHead>Usluga</TableHead>
                  <TableHead>Cena</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(booking.start_datetime), 'HH:mm')} -{' '}
                          {format(new Date(booking.end_datetime), 'HH:mm')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.start_datetime), 'EEEE, d. MMM yyyy', {
                            locale: srLatn,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {booking.customer.name || booking.customer.phone}
                        </p>
                        {booking.customer.name && (
                          <p className="text-sm text-muted-foreground font-mono">
                            {booking.customer.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{booking.service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.service.duration_minutes} min
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{booking.service.price.toLocaleString('sr-RS')} RSD</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right">
                      {booking.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                        >
                          Potvrdi
                        </Button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleStatusChange(booking.id, 'completed')}
                          >
                            Završi
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(booking.id)}
                          >
                            Otkaži
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
