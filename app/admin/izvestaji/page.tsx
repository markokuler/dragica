'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  Store,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'

interface ExportOption {
  id: string
  title: string
  description: string
  icon: typeof Store
  filename: string
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'salons',
    title: 'Saloni',
    description: 'Lista svih salona sa kontakt informacijama i statusom pretplate',
    icon: Store,
    filename: 'saloni',
  },
  {
    id: 'payments',
    title: 'Uplate',
    description: 'Istorija svih evidentiranih uplata od salona',
    icon: CreditCard,
    filename: 'uplate',
  },
  {
    id: 'finances',
    title: 'Finansije',
    description: 'Admin prihodi i rashodi',
    icon: DollarSign,
    filename: 'finansije',
  },
]

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (type: string) => {
    setExporting(type)
    try {
      const response = await fetch(`/api/admin/export?type=${type}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Greška pri exportu')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Greška pri exportu')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif">Izveštaji</h1>
        <p className="text-muted-foreground">Exportuj podatke za analizu ili računovodstvo</p>
      </div>

      {/* Export Options */}
      <div className="grid gap-4 md:grid-cols-3">
        {EXPORT_OPTIONS.map((option) => {
          const Icon = option.icon
          const isExporting = exporting === option.id

          return (
            <Card key={option.id} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                  </div>
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport(option.id)}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exportujem...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            O izveštajima
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-secondary/30">
              <h3 className="font-medium mb-2">CSV Format</h3>
              <p className="text-sm text-muted-foreground">
                Svi izveštaji se exportuju u CSV formatu koji možete otvoriti u Excel-u,
                Google Sheets-u ili bilo kom drugom spreadsheet programu.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30">
              <h3 className="font-medium mb-2">Encoding</h3>
              <p className="text-sm text-muted-foreground">
                Fajlovi koriste UTF-8 encoding što znači da će srpska slova (č, ć, š, ž, đ)
                biti ispravno prikazana.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-info/10 border border-info/20">
            <h3 className="font-medium text-info mb-2">Saveti</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Redovno exportujte podatke kao backup</li>
              <li>Koristite export uplata za mesečno računovodstvo</li>
              <li>Export salona je koristan za analizu rasta</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Brzi pregled</CardTitle>
          <CardDescription>Najvažniji podaci na jednom mestu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-secondary/30">
              <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Dostupna izveštaja</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/30">
              <Store className="h-8 w-8 mx-auto text-info mb-2" />
              <p className="text-2xl font-bold">CSV</p>
              <p className="text-xs text-muted-foreground">Format exporta</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/30">
              <Download className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="text-2xl font-bold">UTF-8</p>
              <p className="text-xs text-muted-foreground">Encoding</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/30">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-warning mb-2" />
              <p className="text-2xl font-bold">Excel</p>
              <p className="text-xs text-muted-foreground">Kompatibilan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
