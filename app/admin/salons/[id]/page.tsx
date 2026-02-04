import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, Settings, Clock, Calendar, List } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'

export default async function SalonManagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()

  const { id } = await params
  const supabase = createAdminClient()

  const { data: salon, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !salon) {
    notFound()
  }

  // Get services count
  const { count: servicesCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', id)

  // Get working hours count
  const { count: workingHoursCount } = await supabase
    .from('working_hours')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', id)

  // Get bookings count
  const { count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{salon.name}</h1>
          <p className="text-muted-foreground">Upravljanje salonom</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            salon.is_active
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {salon.is_active ? 'Aktivan' : 'Neaktivan'}
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usluge</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aktivnih usluga
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Radno vreme</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workingHoursCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Definisanih termina
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zakazivanja</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ukupno termina
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informacije</TabsTrigger>
          <TabsTrigger value="services">Usluge</TabsTrigger>
          <TabsTrigger value="hours">Radno vreme</TabsTrigger>
          <TabsTrigger value="settings">Podešavanja</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Osnovne informacije</CardTitle>
              <CardDescription>
                Detalji o salonu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Naziv
                  </label>
                  <p className="text-lg">{salon.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Subdomen
                  </label>
                  <p className="text-lg">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {salon.subdomain}
                    </code>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-lg">{salon.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Telefon
                  </label>
                  <p className="text-lg">{salon.phone}</p>
                </div>

                {salon.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Opis
                    </label>
                    <p className="text-lg">{salon.description}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Kreiran
                  </label>
                  <p className="text-lg">
                    {new Date(salon.created_at).toLocaleDateString('sr-RS')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    URL zakazivanja
                  </label>
                  <p className="text-sm text-primary">
                    {salon.subdomain}.{process.env.NEXT_PUBLIC_BASE_DOMAIN}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Usluge salona</CardTitle>
              <CardDescription>
                Upravljanje uslugama koje salon nudi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Upravljanje uslugama će biti dostupno uskoro
                </p>
                <Link href={`/admin/salons/${salon.id}/services`}>
                  <Button>Upravljaj uslugama</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Radno vreme</CardTitle>
              <CardDescription>
                Podešavanje radnog vremena salona
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Upravljanje radnim vremenom će biti dostupno uskoro
                </p>
                <Link href={`/admin/salons/${salon.id}/hours`}>
                  <Button>Podesi radno vreme</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Podešavanja salona</CardTitle>
              <CardDescription>
                Opšta podešavanja i konfiguracija
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Dodatna podešavanja će biti dostupna uskoro
                </p>
                <Link href={`/admin/salons/${salon.id}/settings`}>
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Podešavanja
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
