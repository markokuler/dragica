import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saloni</h1>
          <p className="text-muted-foreground">Upravljajte svim salonima u sistemu</p>
        </div>
        <Link href="/admin/salons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novi salon
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Svi saloni</CardTitle>
          <CardDescription>
            {tenants?.length || 0} salon(a) u sistemu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tenants || tenants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Još uvek nema salona u sistemu
              </p>
              <Link href="/admin/salons/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Kreirajte prvi salon
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Subdomen</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {tenant.subdomain}
                      </code>
                    </TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{tenant.phone}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.is_active
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {tenant.is_active ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/salons/${tenant.id}`}>
                        <Button variant="ghost" size="sm">
                          Upravljaj
                        </Button>
                      </Link>
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
