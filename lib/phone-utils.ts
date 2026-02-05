/**
 * Phone number utilities with country code support
 */

// Country codes for dropdown - sorted by region relevance
export const COUNTRY_CODES = [
  // Balkans first (primary region)
  { code: '381', country: 'Srbija', flag: '🇷🇸' },
  { code: '385', country: 'Hrvatska', flag: '🇭🇷' },
  { code: '387', country: 'BiH', flag: '🇧🇦' },
  { code: '382', country: 'Crna Gora', flag: '🇲🇪' },
  { code: '386', country: 'Slovenija', flag: '🇸🇮' },
  { code: '389', country: 'S. Makedonija', flag: '🇲🇰' },
  { code: '383', country: 'Kosovo', flag: '🇽🇰' },
  { code: '355', country: 'Albanija', flag: '🇦🇱' },

  // Other European
  { code: '43', country: 'Austrija', flag: '🇦🇹' },
  { code: '32', country: 'Belgija', flag: '🇧🇪' },
  { code: '359', country: 'Bugarska', flag: '🇧🇬' },
  { code: '420', country: 'Češka', flag: '🇨🇿' },
  { code: '45', country: 'Danska', flag: '🇩🇰' },
  { code: '358', country: 'Finska', flag: '🇫🇮' },
  { code: '33', country: 'Francuska', flag: '🇫🇷' },
  { code: '30', country: 'Grčka', flag: '🇬🇷' },
  { code: '31', country: 'Holandija', flag: '🇳🇱' },
  { code: '353', country: 'Irska', flag: '🇮🇪' },
  { code: '39', country: 'Italija', flag: '🇮🇹' },
  { code: '36', country: 'Mađarska', flag: '🇭🇺' },
  { code: '49', country: 'Nemačka', flag: '🇩🇪' },
  { code: '47', country: 'Norveška', flag: '🇳🇴' },
  { code: '48', country: 'Poljska', flag: '🇵🇱' },
  { code: '351', country: 'Portugalija', flag: '🇵🇹' },
  { code: '40', country: 'Rumunija', flag: '🇷🇴' },
  { code: '7', country: 'Rusija', flag: '🇷🇺' },
  { code: '421', country: 'Slovačka', flag: '🇸🇰' },
  { code: '34', country: 'Španija', flag: '🇪🇸' },
  { code: '46', country: 'Švedska', flag: '🇸🇪' },
  { code: '41', country: 'Švajcarska', flag: '🇨🇭' },
  { code: '90', country: 'Turska', flag: '🇹🇷' },
  { code: '380', country: 'Ukrajina', flag: '🇺🇦' },
  { code: '44', country: 'V. Britanija', flag: '🇬🇧' },

  // Other common
  { code: '1', country: 'SAD/Kanada', flag: '🇺🇸' },
  { code: '61', country: 'Australija', flag: '🇦🇺' },
  { code: '86', country: 'Kina', flag: '🇨🇳' },
  { code: '971', country: 'UAE', flag: '🇦🇪' },
] as const

export type CountryCode = typeof COUNTRY_CODES[number]

/**
 * Cleans a phone number - removes all non-digit characters
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Removes leading zero from local number if present
 */
export function removeLeadingZero(phone: string): string {
  const cleaned = cleanPhoneNumber(phone)
  if (cleaned.startsWith('0')) {
    return cleaned.slice(1)
  }
  return cleaned
}

/**
 * Combines country code and local number into international format
 * Handles leading zero removal automatically
 */
export function formatInternationalPhone(countryCode: string, localNumber: string): string {
  const cleanedCode = cleanPhoneNumber(countryCode)
  const cleanedLocal = removeLeadingZero(localNumber)

  if (!cleanedCode || !cleanedLocal) return ''

  return `+${cleanedCode}${cleanedLocal}`
}

/**
 * Parses an international phone number into country code and local number
 * Returns null if can't parse
 */
export function parseInternationalPhone(phone: string): { countryCode: string; localNumber: string } | null {
  let cleaned = cleanPhoneNumber(phone)

  // Remove + or 00 prefix
  if (phone.startsWith('+')) {
    cleaned = phone.slice(1).replace(/\D/g, '')
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2)
  }

  // Try to match country codes (longest first)
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)

  for (const { code } of sortedCodes) {
    if (cleaned.startsWith(code)) {
      return {
        countryCode: code,
        localNumber: cleaned.slice(code.length)
      }
    }
  }

  return null
}

/**
 * Gets all variations of a phone number for database lookup
 * Used when searching for existing customers
 */
export function getPhoneVariations(countryCode: string, localNumber: string): string[] {
  const cleanedCode = cleanPhoneNumber(countryCode)
  const cleanedLocal = removeLeadingZero(localNumber)

  if (!cleanedLocal) return []

  const variations = new Set<string>()

  // International format
  variations.add(`+${cleanedCode}${cleanedLocal}`)

  // Without +
  variations.add(`${cleanedCode}${cleanedLocal}`)

  // With 00 prefix
  variations.add(`00${cleanedCode}${cleanedLocal}`)

  // Local format with 0
  variations.add(`0${cleanedLocal}`)

  // Just local number
  variations.add(cleanedLocal)

  // Original input if it had leading 0
  if (localNumber.startsWith('0')) {
    variations.add(localNumber.replace(/\D/g, ''))
  }

  return Array.from(variations)
}

/**
 * Gets variations from a stored international phone number
 * Used when we have +381... format and need to search
 */
export function getStoredPhoneVariations(storedPhone: string): string[] {
  const parsed = parseInternationalPhone(storedPhone)
  if (!parsed) {
    // Can't parse, just return cleaned version
    return [cleanPhoneNumber(storedPhone), storedPhone]
  }

  return getPhoneVariations(parsed.countryCode, parsed.localNumber)
}

/**
 * Checks if two phone numbers are the same
 */
export function isSamePhone(phone1: string, phone2: string): boolean {
  const parsed1 = parseInternationalPhone(phone1)
  const parsed2 = parseInternationalPhone(phone2)

  if (parsed1 && parsed2) {
    return parsed1.countryCode === parsed2.countryCode &&
           parsed1.localNumber === parsed2.localNumber
  }

  // Fallback to simple comparison
  const clean1 = cleanPhoneNumber(phone1)
  const clean2 = cleanPhoneNumber(phone2)

  // Check if one ends with the other (handles missing country code)
  return clean1 === clean2 ||
         clean1.endsWith(clean2) ||
         clean2.endsWith(clean1)
}

/**
 * Formats phone for display
 */
export function formatPhoneDisplay(phone: string): string {
  const parsed = parseInternationalPhone(phone)
  if (!parsed) return phone

  const { countryCode, localNumber } = parsed

  // Add spaces for readability
  if (localNumber.length >= 8) {
    const formatted = localNumber.replace(/(\d{2})(\d{3})(\d+)/, '$1 $2 $3')
    return `+${countryCode} ${formatted}`
  }

  return `+${countryCode} ${localNumber}`
}
