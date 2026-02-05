/**
 * In-memory OTP store
 * For production, consider using Redis or database
 */

interface OTPEntry {
  code: string
  expires: Date
  attempts: number
}

// Store OTPs: { 'phone:tenant_id': { code, expires, attempts } }
const otpStore = new Map<string, OTPEntry>()

// Clean expired OTPs every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = new Date()
    for (const [key, value] of otpStore.entries()) {
      if (value.expires < now) {
        otpStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Generate OTP key from phone and tenant
 */
function getKey(phone: string, tenantId: string): string {
  return `${phone}:${tenantId}`
}

/**
 * Store a new OTP code
 */
export function storeOTP(phone: string, tenantId: string, code: string): void {
  const key = getKey(phone, tenantId)
  const existing = otpStore.get(key)

  otpStore.set(key, {
    code,
    expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: (existing?.attempts || 0) + 1,
  })
}

/**
 * Check if rate limited (max 3 attempts per 10 minutes)
 */
export function isRateLimited(phone: string, tenantId: string): { limited: boolean; waitMinutes?: number } {
  const key = getKey(phone, tenantId)
  const existing = otpStore.get(key)

  if (existing && existing.attempts >= 3 && existing.expires > new Date()) {
    const waitMinutes = Math.ceil((existing.expires.getTime() - Date.now()) / 60000)
    return { limited: true, waitMinutes }
  }

  return { limited: false }
}

/**
 * Verify OTP code
 */
export function verifyOTP(
  phone: string,
  tenantId: string,
  code: string
): { valid: boolean; error?: string } {
  const key = getKey(phone, tenantId)
  const stored = otpStore.get(key)

  if (!stored) {
    return { valid: false, error: 'Kod nije pronađen. Zatražite novi kod.' }
  }

  if (stored.expires < new Date()) {
    otpStore.delete(key)
    return { valid: false, error: 'Kod je istekao. Zatražite novi kod.' }
  }

  if (stored.code !== code) {
    return { valid: false, error: 'Pogrešan kod. Pokušajte ponovo.' }
  }

  // Valid - remove from store
  otpStore.delete(key)
  return { valid: true }
}

/**
 * Get current attempt count
 */
export function getAttempts(phone: string, tenantId: string): number {
  const key = getKey(phone, tenantId)
  return otpStore.get(key)?.attempts || 0
}
