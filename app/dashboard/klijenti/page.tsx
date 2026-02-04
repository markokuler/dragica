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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Users, Phone, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale'

interface Client {
  id: string
  phone: string
  name: string | null
  totalBookings: number
  totalSpent: number
  lastVisit: string | null
  created_at: string
}

interface ClientDetail extends Client {
  bookings: {
    id: string
    start_datetime: string
    status: string
    service: { name: string; price: number }
  }[]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async (searchTerm?: string) => {
    try {
      const url = searchTerm
        ? `/api/dashboard/clients?search=${encodeURIComponent(searchTerm)}`
        : '/api/dashboard/clients'
      const response = await fetch(url)
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    fetchClients(search)
  }

  const handleViewClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/dashboard/clients/${clientId}`)
      const data = await response.json()
      setSelectedClient(data.client)
      setDetailDialogOpen(true)
    } catch (error) {
      console.error('Error fetching client details:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Klijenti</h1>
        <p className="text-muted-foreground">Pregled svih klijenata vašeg salona</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno klijenata</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno poseta</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, c) => sum + c.totalBookings, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupan promet</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString('sr-RS')} RSD
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Pretraga klijenata</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Pretražite po imenu ili broju telefona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Pretraži
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Svi klijenti</CardTitle>
          <CardDescription>{clients.length} klijenata u bazi</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Učitavanje...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Još uvek nema klijenata</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klijenti će se automatski dodati kada zakaže termin
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Ime</TableHead>
                  <TableHead>Poseta</TableHead>
                  <TableHead>Potrošeno</TableHead>
                  <TableHead>Poslednja poseta</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono">{client.phone}</TableCell>
                    <TableCell>{client.name || '-'}</TableCell>
                    <TableCell>{client.totalBookings}</TableCell>
                    <TableCell>{client.totalSpent.toLocaleString('sr-RS')} RSD</TableCell>
                    <TableCell>
                      {client.lastVisit
                        ? format(new Date(client.lastVisit), 'd. MMM yyyy', { locale: srLatn })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClient(client.id)}
                      >
                        Detalji
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Client Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalji klijenta</DialogTitle>
            <DialogDescription>
              {selectedClient?.name || selectedClient?.phone}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-mono text-lg">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ime</p>
                  <p className="text-lg">{selectedClient.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ukupno poseta</p>
                  <p className="text-lg font-bold">{selectedClient.totalBookings}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ukupno potrošeno</p>
                  <p className="text-lg font-bold">
                    {selectedClient.totalSpent.toLocaleString('sr-RS')} RSD
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Istorija zakazivanja</h4>
                {selectedClient.bookings.length === 0 ? (
                  <p className="text-muted-foreground">Nema zakazivanja</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedClient.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <div>
                          <p className="font-medium">{booking.service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.start_datetime), 'd. MMM yyyy HH:mm', {
                              locale: srLatn,
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {booking.service.price.toLocaleString('sr-RS')} RSD
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              booking.status === 'completed'
                                ? 'bg-green-500/10 text-green-500'
                                : booking.status === 'cancelled'
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            {booking.status === 'completed'
                              ? 'Završeno'
                              : booking.status === 'cancelled'
                              ? 'Otkazano'
                              : 'Na čekanju'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
