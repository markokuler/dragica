/**
 * Infobip client for sending WhatsApp and Viber messages
 */

const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL || ''
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY || ''
const INFOBIP_WHATSAPP_SENDER = process.env.INFOBIP_WHATSAPP_SENDER || ''
const INFOBIP_VIBER_SENDER = process.env.INFOBIP_VIBER_SENDER || ''

export type NotificationChannel = 'whatsapp' | 'viber'

interface SendMessageParams {
  to: string
  message: string
  channel: NotificationChannel
}

interface BookingConfirmationParams {
  to: string
  channel: NotificationChannel
  customerName?: string
  serviceName: string
  date: string
  time: string
  salonName: string
  salonPhone?: string
  manageLink?: string
}

interface BookingReminderParams {
  to: string
  channel: NotificationChannel
  customerName?: string
  serviceName: string
  date: string
  time: string
  salonName: string
}

interface BookingCancellationParams {
  to: string
  channel: NotificationChannel
  customerName?: string
  serviceName: string
  date: string
  time: string
  salonName: string
}

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phone: string): string {
  // Remove spaces, dashes, and other characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // If starts with 0, assume Serbian number and add +381
  if (cleaned.startsWith('0')) {
    cleaned = '+381' + cleaned.substring(1)
  }

  // If doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  return cleaned
}

/**
 * Send WhatsApp message via Infobip using template
 */
async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  if (!INFOBIP_BASE_URL || !INFOBIP_API_KEY || !INFOBIP_WHATSAPP_SENDER) {
    console.error('Infobip WhatsApp not configured')
    return false
  }

  const formattedPhone = formatPhoneNumber(to)

  // Use template endpoint for WhatsApp Business API
  const requestBody = {
    messages: [
      {
        from: INFOBIP_WHATSAPP_SENDER,
        to: formattedPhone,
        content: {
          templateName: 'test_whatsapp_template_en',
          templateData: {
            body: {
              placeholders: [message]
            }
          },
          language: 'en'
        }
      }
    ]
  }

  console.log('WhatsApp request:', JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch(`${INFOBIP_BASE_URL}/whatsapp/1/message/template`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log('WhatsApp response status:', response.status)
    console.log('WhatsApp response:', responseText)

    if (!response.ok) {
      console.error('WhatsApp send error:', responseText)
      return false
    }

    return true
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return false
  }
}

/**
 * Send Viber message via Infobip
 */
async function sendViber(to: string, message: string): Promise<boolean> {
  if (!INFOBIP_BASE_URL || !INFOBIP_API_KEY) {
    console.error('Infobip not configured')
    return false
  }

  const formattedPhone = formatPhoneNumber(to).replace('+', '')

  // Use IBSelfServe for testing, or custom sender for production
  const sender = INFOBIP_VIBER_SENDER || 'IBSelfServe'

  const requestBody = {
    messages: [
      {
        sender: sender,
        destinations: [{ to: formattedPhone }],
        content: {
          text: message,
          type: 'TEXT'
        }
      }
    ]
  }

  console.log('Viber request:', JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch(`${INFOBIP_BASE_URL}/viber/2/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log('Viber response status:', response.status)
    console.log('Viber response:', responseText)

    if (!response.ok) {
      console.error('Viber send error:', responseText)
      return false
    }

    return true
  } catch (error) {
    console.error('Viber send error:', error)
    return false
  }
}

/**
 * Send message through selected channel
 */
export async function sendMessage({ to, message, channel }: SendMessageParams): Promise<boolean> {
  if (channel === 'whatsapp') {
    return sendWhatsApp(to, message)
  } else {
    return sendViber(to, message)
  }
}

/**
 * Send booking confirmation notification
 */
export async function sendBookingConfirmation({
  to,
  channel,
  customerName,
  serviceName,
  date,
  time,
  salonName,
  salonPhone,
  manageLink,
}: BookingConfirmationParams): Promise<boolean> {
  const greeting = customerName ? `Poštovani/a ${customerName}` : 'Poštovani/a'

  const message = `${greeting},

Vaš termin je uspešno zakazan!

📍 ${salonName}
💇 ${serviceName}
📅 ${date}
🕐 ${time}

${salonPhone ? `Za sve informacije pozovite: ${salonPhone}\n` : ''}
${manageLink ? `✏️ Izmenite ili otkažite termin:\n${manageLink}\n` : ''}
Vidimo se! ✨`

  return sendMessage({ to, message, channel })
}

/**
 * Send booking reminder (24h before)
 */
export async function sendBookingReminder({
  to,
  channel,
  customerName,
  serviceName,
  date,
  time,
  salonName,
}: BookingReminderParams): Promise<boolean> {
  const greeting = customerName ? `Poštovani/a ${customerName}` : 'Poštovani/a'

  const message = `${greeting},

Podsetnik: Vaš termin je sutra!

📍 ${salonName}
💇 ${serviceName}
📅 ${date}
🕐 ${time}

Vidimo se! ✨`

  return sendMessage({ to, message, channel })
}

/**
 * Send booking cancellation notification
 */
export async function sendBookingCancellation({
  to,
  channel,
  customerName,
  serviceName,
  date,
  time,
  salonName,
}: BookingCancellationParams): Promise<boolean> {
  const greeting = customerName ? `Poštovani/a ${customerName}` : 'Poštovani/a'

  const message = `${greeting},

Vaš termin je otkazan.

📍 ${salonName}
💇 ${serviceName}
📅 ${date}
🕐 ${time}

Možete zakazati novi termin na našoj stranici.`

  return sendMessage({ to, message, channel })
}

/**
 * Check if Infobip is configured
 */
export function isInfobipConfigured(): boolean {
  return !!(INFOBIP_BASE_URL && INFOBIP_API_KEY && (INFOBIP_WHATSAPP_SENDER || INFOBIP_VIBER_SENDER))
}

/**
 * Generate 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP verification code
 */
export async function sendOTPCode({
  to,
  channel,
  code,
  salonName,
}: {
  to: string
  channel: NotificationChannel
  code: string
  salonName: string
}): Promise<boolean> {
  // For WhatsApp template, we send the code as placeholder
  // For Viber, we send the full message
  if (channel === 'whatsapp') {
    return sendWhatsApp(to, code)
  } else {
    const message = `Vaš kod za potvrdu zakazivanja u ${salonName} je:

🔐 ${code}

Kod važi 10 minuta.`
    return sendViber(to, message)
  }
}
