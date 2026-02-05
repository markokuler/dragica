'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  History,
  User,
  Store,
  CreditCard,
  Settings,
  Trash2,
  Plus,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: typeof Plus }> = {
  create: { label: 'Kreiranje', color: 'bg-success', icon: Plus },
  update: { label: 'Izmena', color: 'bg-info', icon: Edit2 },
  delete: { label: 'Brisanje', color: 'bg-destructive', icon: Trash2 },
  view: { label: 'Pregled', color: 'bg-secondary', icon: Eye },
  login: { label: 'Prijava', color: 'bg-primary', icon: User },
  logout: { label: 'Odjava', color: 'bg-muted', icon: User },
  payment: { label: 'Uplata', color: 'bg-success', icon: CreditCard },
}

const ENTITY_LABELS: Record<string, { label: string; icon: typeof Store }> = {
  salon: { label: 'Salon', icon: Store },
  payment: { label: 'Uplata', icon: CreditCard },
  user: { label: 'Korisnik', icon: User },
  settings: { label: 'Podešavanja', icon: Settings },
  coupon: { label: 'Kupon', icon: CreditCard },
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const limit = 20

  useEffect(() => {
    fetchEntries()
  }, [page, filterAction, filterEntity])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })
      if (filterAction !== 'all') params.append('action', filterAction)
      if (filterEntity !== 'all') params.append('entityType', filterEntity)

      const response = await fetch(`/api/admin/audit?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: 'bg-secondary', icon: Eye }
  }

  const getEntityInfo = (entityType: string) => {
    return ENTITY_LABELS[entityType] || { label: entityType, icon: Settings }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif">Aktivnost</h1>
        <p className="text-muted-foreground">Evidencija svih admin akcija</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter po akciji" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve akcije</SelectItem>
                  <SelectItem value="create">Kreiranje</SelectItem>
                  <SelectItem value="update">Izmena</SelectItem>
                  <SelectItem value="delete">Brisanje</SelectItem>
                  <SelectItem value="payment">Uplata</SelectItem>
                  <SelectItem value="login">Prijava</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPage(0) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter po tipu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi tipovi</SelectItem>
                  <SelectItem value="salon">Salon</SelectItem>
                  <SelectItem value="payment">Uplata</SelectItem>
                  <SelectItem value="user">Korisnik</SelectItem>
                  <SelectItem value="coupon">Kupon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Log aktivnosti
          </CardTitle>
          <CardDescription>
            {total} ukupno zabeleženih akcija
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Učitavanje...</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nema zabeleženih akcija</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const actionInfo = getActionInfo(entry.action)
                const entityInfo = getEntityInfo(entry.entity_type)
                const ActionIcon = actionInfo.icon
                const EntityIcon = entityInfo.icon

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${actionInfo.color}`}>
                      <ActionIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <EntityIcon className="h-3 w-3 mr-1" />
                          {entityInfo.label}
                        </Badge>
                        <span className="font-medium">{actionInfo.label}</span>
                        {entry.entity_name && (
                          <span className="text-muted-foreground">- {entry.entity_name}</span>
                        )}
                      </div>
                      {entry.details && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {JSON.stringify(entry.details)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(entry.created_at).toLocaleString('sr-RS', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Strana {page + 1} od {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
