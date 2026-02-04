import { requireAdmin } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default async function AdminSettingsPage() {
  const user = await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Podešavanja</h1>
        <p className="text-muted-foreground">Globalna podešavanja sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacije o nalogu</CardTitle>
            <CardDescription>Vaš administratorski nalog</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Uloga
              </label>
              <p className="text-lg">Administrator</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistem</CardTitle>
            <CardDescription>Informacije o sistemu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Verzija
              </label>
              <p className="text-lg">1.0.0 (Beta)</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Domen
              </label>
              <p className="text-lg font-mono text-sm">
                {process.env.NEXT_PUBLIC_BASE_DOMAIN}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              <Settings className="inline-block mr-2 h-5 w-5" />
              Dodatna podešavanja
            </CardTitle>
            <CardDescription>
              Napredna podešavanja će biti dostupna uskoro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Ovde će biti dostupne opcije za konfiguraciju sistema, upravljanje
              korisnicima, email podešavanja, SMS podešavanja, i druge napredne opcije.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
