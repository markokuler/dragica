import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage, type NotificationChannel } from '@/lib/infobip/client'

interface SendAdminMessageParams {
  tenantId: string
  channel: NotificationChannel
  phone: string
  message: string
  triggerType?: string
  templateId?: string
  sentBy?: string
  isDemo?: boolean
}

interface SendResult {
  success: boolean
  logId?: string
  error?: string
}

/**
 * Send an admin message (manual or auto) and log it
 */
export async function sendAdminMessage(params: SendAdminMessageParams): Promise<SendResult> {
  const { tenantId, channel, phone, message, triggerType, templateId, sentBy, isDemo } = params

  const supabase = createAdminClient()
  let status: 'sent' | 'failed' = 'sent'
  let errorMessage: string | undefined

  try {
    const success = await sendMessage({ to: phone, message, channel })
    if (!success) {
      status = 'failed'
      errorMessage = 'Infobip send failed'
    }
  } catch (err) {
    status = 'failed'
    errorMessage = err instanceof Error ? err.message : 'Unknown error'
  }

  // Log the message
  const { data: logEntry, error: logError } = await supabase
    .from('admin_message_log')
    .insert({
      tenant_id: tenantId,
      template_id: templateId || null,
      channel,
      trigger_type: triggerType || null,
      phone,
      message_text: message,
      status,
      error_message: errorMessage || null,
      sent_by: sentBy || null,
      is_demo: isDemo || false,
    })
    .select('id')
    .single()

  if (logError) {
    console.error('Error logging message:', logError)
    return { success: status === 'sent', error: logError.message }
  }

  return { success: status === 'sent', logId: logEntry.id }
}

/**
 * Replace placeholders in a template string
 */
export function replacePlaceholders(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value)
  }
  return result
}
