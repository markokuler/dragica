import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

let client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials are not configured')
  }

  if (!client) {
    client = twilio(accountSid, authToken)
  }

  return client
}

export async function sendSMS(to: string, message: string) {
  try {
    const client = getClient()

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    })

    return { success: true, messageId: result.sid }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTPSMS(phone: string, otp: string) {
  const message = `Vaš kod za potvrdu termina je: ${otp}\n\nKod ističe za 10 minuta.`
  return sendSMS(phone, message)
}

export async function sendBookingConfirmationSMS(phone: string, salonName: string, serviceName: string, dateTime: string) {
  const message = `${salonName}\n\nVaš termin je potvrđen:\n${serviceName}\n${dateTime}\n\nHvala što ste izabrali naš salon!`
  return sendSMS(phone, message)
}
