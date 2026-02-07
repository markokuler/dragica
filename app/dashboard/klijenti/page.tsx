'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
import { Search, Users, Calendar, DollarSign, Plus, Loader2, ChevronDown, Trash2 } from 'lucide-react'
import { COUNTRY_CODES, formatInternationalPhone, parseInternationalPhone } from '@/lib/phone-utils'
import { format } from 'date-fns'
import { srLatn } from 'date-fns/locale/sr-Latn'

interface Client {
  id: string
  phone: string
  name: string | null
  notes: string | null
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
  return (
    <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Učitavanje...</div>}>
      <ClientsPageContent />
    </Suspense>
  )
}

function ClientsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // Client create/edit dialog state
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [clientForm, setClientForm] = useState({
    phone: '',
    name: '',
    notes: '',
  })
  const [countryCode, setCountryCode] = useState('381')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Dynamic search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      setLoading(true)
      fetchClients(search || undefined)
      if (search) {
        router.replace(`${pathname}?q=${encodeURIComponent(search)}`, { scroll: false })
      } else {
        router.replace(pathname, { scroll: false })
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

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

  const openClientDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setClientForm({
        phone: client.phone,
        name: client.name || '',
        notes: client.notes || '',
      })
      // Parse existing phone to pre-fill dropdown
      const parsed = parseInternationalPhone(client.phone)
      if (parsed) {
        setCountryCode(parsed.countryCode)
        setPhoneNumber(parsed.localNumber)
      } else {
        setCountryCode('381')
        setPhoneNumber(client.phone)
      }
    } else {
      setEditingClient(null)
      setClientForm({ phone: '', name: '', notes: '' })
      setCountryCode('381')
      setPhoneNumber('')
    }
    setShowCountryDropdown(false)
    setClientDialogOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const combinedPhone = formatInternationalPhone(countryCode, phoneNumber)
      const url = editingClient
        ? `/api/dashboard/clients/${editingClient.id}`
        : '/api/dashboard/clients'

      const response = await fetch(url, {
        method: editingClient ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: combinedPhone,
          name: clientForm.name || null,
          notes: clientForm.notes || null,
        }),
      })

      if (response.ok) {
        setClientDialogOpen(false)
        fetchClients(search)
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju klijenta')
      }
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Greška pri čuvanju klijenta')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return

    try {
      const response = await fetch(`/api/dashboard/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchClients(search)
        setDetailDialogOpen(false)
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri brisanju klijenta')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Greška pri brisanju klijenta')
    } finally {
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Klijenti</h1>
          <p className="text-base sm:text-lg text-muted-foreground">Pregled svih klijenata vašeg salona</p>
        </div>
        <Button onClick={() => openClientDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novi klijent
        </Button>
      </div>

      {/* Search - prioritized on mobile */}
      <Card className="md:order-2">
        <CardContent className="pt-4 md:pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ime ili telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {loading && search && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - moved to bottom on mobile */}
      <div className="hidden md:grid gap-4 md:grid-cols-3 md:order-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno klijenata</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno poseta</CardTitle>
            <Calendar className="h-4 w-4 text-info" />
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
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString('sr-RS')} RSD
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Svi klijenti</CardTitle>
          {/* Compact stats for mobile */}
          <p className="text-sm text-muted-foreground md:hidden">
            Ukupno klijenata: <span className="font-semibold text-foreground">{clients.length}</span> · Promet: <span className="font-semibold text-primary">{clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString('sr-RS')} RSD</span>
          </p>
          <CardDescription className="hidden md:block">{clients.length} klijenata u bazi</CardDescription>
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
            <>
              {/* Desktop: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
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
                      <TableRow
                        key={client.id}
                        className="border-border h-14 cursor-pointer hover:bg-secondary/50"
                        onClick={() => handleViewClient(client.id)}
                      >
                        <TableCell className="font-mono">{client.phone}</TableCell>
                        <TableCell>{client.name || '-'}</TableCell>
                        <TableCell>{client.totalBookings}</TableCell>
                        <TableCell className="text-primary font-medium">{client.totalSpent.toLocaleString('sr-RS')} RSD</TableCell>
                        <TableCell>
                          {client.lastVisit
                            ? format(new Date(client.lastVisit), 'd. MMM yyyy', { locale: srLatn })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openClientDialog(client)
                            }}
                          >
                            Izmeni
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClient(client)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden space-y-3">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => handleViewClient(client.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base">
                          {client.name || 'Bez imena'}
                        </h3>
                        <p className="text-sm font-mono text-muted-foreground">{client.phone}</p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {client.totalSpent.toLocaleString('sr-RS')} RSD
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>{client.totalBookings} poseta</span>
                      <span>
                        {client.lastVisit
                          ? format(new Date(client.lastVisit), 'd. MMM yyyy', { locale: srLatn })
                          : 'Nema poseta'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          openClientDialog(client)
                        }}
                      >
                        Izmeni
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClient(client)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
                  <p className="text-lg font-bold text-primary">
                    {selectedClient.totalSpent.toLocaleString('sr-RS')} RSD
                  </p>
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Napomene</p>
                  <p className="text-sm p-3 rounded-lg bg-secondary/50">{selectedClient.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Istorija zakazivanja</h4>
                {selectedClient.bookings.length === 0 ? (
                  <p className="text-muted-foreground">Nema zakazivanja</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedClient.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
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
                          <p className="font-medium text-primary">
                            {booking.service.price.toLocaleString('sr-RS')} RSD
                          </p>
                          <span
                            className={`text-sm px-2.5 py-1 rounded-full font-medium ${
                              booking.status === 'completed'
                                ? 'bg-status-completed/10 text-status-completed'
                                : booking.status === 'confirmed'
                                ? 'bg-status-confirmed/10 text-status-confirmed'
                                : booking.status === 'cancelled'
                                ? 'bg-status-cancelled/10 text-status-cancelled'
                                : booking.status === 'no_show'
                                ? 'bg-status-noshow/10 text-status-noshow'
                                : 'bg-status-pending/10 text-status-pending'
                            }`}
                          >
                            {booking.status === 'completed'
                              ? 'Završeno'
                              : booking.status === 'confirmed'
                              ? 'Potvrđeno'
                              : booking.status === 'cancelled'
                              ? 'Otkazano'
                              : booking.status === 'no_show'
                              ? 'Nije došao'
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
          {selectedClient && (
            <DialogFooter>
              <Button
                variant="destructive"
                className="w-full sm:w-auto sm:mr-auto"
                onClick={() => handleDeleteClient(selectedClient)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Obriši klijenta
              </Button>
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                Zatvori
              </Button>
              <Button onClick={() => {
                setDetailDialogOpen(false)
                openClientDialog(selectedClient)
              }}>
                Izmeni
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Client Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Izmeni klijenta' : 'Novi klijent'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Izmenite podatke o klijentu' : 'Dodajte novog klijenta u bazu'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveClient} className="space-y-4">
            <div className="space-y-2">
              <Label>Telefon *</Label>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="h-10 px-3 flex items-center gap-1 rounded-md border border-input bg-background text-sm min-w-[90px] justify-between hover:bg-secondary/50"
                  >
                    <span>
                      {COUNTRY_CODES.find(c => c.code === countryCode)?.flag} +{countryCode}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  </button>
                  {showCountryDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCountryDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-auto rounded-md border border-input bg-background shadow-md z-50">
                        {COUNTRY_CODES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountryCode(c.code)
                              setShowCountryDropdown(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-secondary/50 ${
                              countryCode === c.code ? 'bg-secondary' : ''
                            }`}
                          >
                            <span>{c.flag}</span>
                            <span className="font-medium">+{c.code}</span>
                            <span className="text-muted-foreground">{c.country}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <Input
                  type="tel"
                  placeholder="60 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Sa ili bez početne nule (060... ili 60...)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-name">Ime (opciono)</Label>
              <Input
                id="client-name"
                placeholder="Marija Petrović"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-notes">Napomene (opciono)</Label>
              <Textarea
                id="client-notes"
                placeholder="Alergija na gel, preferira prirodne boje..."
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              {editingClient && (
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:mr-auto"
                  onClick={() => handleDeleteClient(editingClient)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Obriši
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setClientDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={submitting || !phoneNumber}>
                {submitting ? 'Čuvanje...' : editingClient ? 'Sačuvaj' : 'Dodaj klijenta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Brisanje klijenta</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da obrišete klijenta {clientToDelete?.name ? `"${clientToDelete.name}"` : clientToDelete?.phone}?
              Sva završena zakazivanja ovog klijenta će takođe biti obrisana. Ova akcija se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
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
