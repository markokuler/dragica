import { createAdminClient } from '@/lib/supabase/admin'

type AuditAction = 'create' | 'update' | 'delete' | 'payment' | 'login' | 'impersonate'
type AuditEntityType = 'salon' | 'payment' | 'coupon' | 'plan' | 'finance' | 'settings' | 'user'

export async function logAudit(params: {
  userId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  entityName?: string
  details?: Record<string, unknown>
  isDemo?: boolean
}) {
  try {
    const supabase = createAdminClient()
    await supabase.from('audit_log').insert({
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_name: params.entityName || null,
      details: params.details || null,
      is_demo: params.isDemo || false,
    })
  } catch (error) {
    console.error('Audit log error:', error)
  }
}
