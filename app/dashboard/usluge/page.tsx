'use client'

import { useEffect, useState } from 'react'
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
  DialogTrigger,
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
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: '',
    price: '',
    is_active: true,
  })

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/dashboard/services')
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingService
        ? `/api/dashboard/services/${editingService.id}`
        : '/api/dashboard/services'

      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          duration_minutes: parseInt(formData.duration_minutes),
          price: parseFloat(formData.price),
          is_active: formData.is_active,
        }),
      })

      if (response.ok) {
        setDialogOpen(false)
        setEditingService(null)
        setFormData({ name: '', duration_minutes: '', price: '', is_active: true })
        fetchServices()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri čuvanju usluge')
      }
    } catch (error) {
      console.error('Error saving service:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      duration_minutes: service.duration_minutes.toString(),
      price: service.price.toString(),
      is_active: service.is_active,
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (service: Service) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!serviceToDelete) return

    try {
      const response = await fetch(`/api/dashboard/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchServices()
      } else {
        const data = await response.json()
        alert(data.error || 'Greška pri brisanju usluge')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    } finally {
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    }
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif">Usluge</h1>
          <p className="text-base sm:text-lg text-muted-foreground">Upravljajte uslugama vašeg salona</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingService(null)
              setFormData({ name: '', duration_minutes: '', price: '', is_active: true })
            }} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova usluga
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Izmeni uslugu' : 'Nova usluga'}
              </DialogTitle>
              <DialogDescription>
                {editingService ? 'Izmenite detalje usluge' : 'Dodajte novu uslugu'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Naziv usluge *</Label>
                  <Input
                    id="name"
                    placeholder="Manikir"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Trajanje (minuti) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    placeholder="60"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Cena (RSD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    required
                  />
                </div>

                {editingService && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active" className="text-base">Aktivna usluga</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Otkaži
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Čuvanje...' : editingService ? 'Sačuvaj' : 'Dodaj'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sve usluge</CardTitle>
          <CardDescription>
            {services.length} usluga u sistemu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Učitavanje...
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Još uvek nema usluga</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj prvu uslugu
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Naziv</TableHead>
                      <TableHead>Trajanje</TableHead>
                      <TableHead>Cena</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow
                        key={service.id}
                        className="border-border h-14 cursor-pointer hover:bg-secondary/50"
                        onClick={() => handleEdit(service)}
                      >
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.duration_minutes} min</TableCell>
                        <TableCell className="text-primary font-medium">{service.price.toLocaleString('sr-RS')} RSD</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                            service.is_active
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {service.is_active ? 'Aktivna' : 'Neaktivna'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(service)
                          }}>
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
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => handleEdit(service)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-base">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.duration_minutes} min</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                        service.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {service.is_active ? 'Aktivna' : 'Neaktivna'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {service.price.toLocaleString('sr-RS')} RSD
                      </span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={(e) => {
                          e.stopPropagation()
                          openDeleteDialog(service)
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Brisanje usluge</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da obrišete uslugu "{serviceToDelete?.name}"?
              Ova akcija se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
