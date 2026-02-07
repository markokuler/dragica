import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, getDemoTenantIds } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const supabase = createAdminClient()
    const demoTenantIds = await getDemoTenantIds(user)

    if (type === 'salons') {
      let salonsQuery = supabase
        .from('tenants')
        .select(`
          id,
          name,
          subdomain,
          slug,
          email,
          phone,
          is_active,
          subscription_status,
          subscription_expires_at,
          created_at
        `)
        .order('name')

      if (demoTenantIds) {
        salonsQuery = salonsQuery.in('id', demoTenantIds)
      }

      const { data: salons, error } = await salonsQuery

      if (error) throw error

      // Convert to CSV
      const headers = ['Naziv', 'Subdomen', 'Slug', 'Email', 'Telefon', 'Aktivan', 'Status pretplate', 'Ističe', 'Kreiran']
      const rows = (salons || []).map(s => [
        s.name,
        s.subdomain,
        s.slug || '',
        s.email || '',
        s.phone || '',
        s.is_active ? 'Da' : 'Ne',
        s.subscription_status || '',
        s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString('sr-RS') : '',
        new Date(s.created_at).toLocaleDateString('sr-RS'),
      ])

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="saloni_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    if (type === 'payments') {
      let paymentsQuery = supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          notes,
          created_at,
          tenants (
            name
          ),
          subscription_plans (
            name
          )
        `)
        .order('payment_date', { ascending: false })

      if (demoTenantIds) {
        paymentsQuery = paymentsQuery.in('tenant_id', demoTenantIds)
      }

      const { data: payments, error } = await paymentsQuery

      if (error) throw error

      const headers = ['Datum', 'Salon', 'Plan', 'Iznos (RSD)', 'Napomena']
      const rows = (payments || []).map(p => {
        const tenant = p.tenants as unknown as { name: string } | null
        const plan = p.subscription_plans as unknown as { name: string } | null
        return [
          new Date(p.payment_date).toLocaleDateString('sr-RS'),
          tenant?.name || '',
          plan?.name || '',
          p.amount.toString(),
          p.notes || '',
        ]
      })

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="uplate_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    if (type === 'finances') {
      // Demo admin cannot export platform finances
      if (demoTenantIds) {
        const csv = 'Datum,Tip,Kategorija,Iznos (RSD),Opis'
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="finansije_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      const { data: entries, error } = await supabase
        .from('admin_financial_entries')
        .select('*')
        .order('entry_date', { ascending: false })

      if (error) throw error

      const headers = ['Datum', 'Tip', 'Kategorija', 'Iznos (RSD)', 'Opis']
      const rows = (entries || []).map(e => [
        new Date(e.entry_date).toLocaleDateString('sr-RS'),
        e.type === 'income' ? 'Prihod' : 'Rashod',
        e.category,
        e.amount.toString(),
        e.description || '',
      ])

      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="finansije_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  } catch (error) {
    console.error('Error in GET /api/admin/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
