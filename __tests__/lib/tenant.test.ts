import { generateSlug, getTenantFromSubdomain } from '@/lib/tenant'

describe('Tenant Utilities', () => {
  describe('generateSlug', () => {
    test('should convert name to lowercase slug', () => {
      expect(generateSlug('Milana Nails')).toBe('milana-nails')
    })

    test('should replace spaces with hyphens', () => {
      expect(generateSlug('My Beauty Salon')).toBe('my-beauty-salon')
    })

    test('should handle special characters', () => {
      expect(generateSlug('Salon "Elite" & Spa')).toBe('salon-elite-spa')
    })

    test('should remove leading and trailing hyphens', () => {
      expect(generateSlug(' Beauty Salon ')).toBe('beauty-salon')
    })

    test('should handle multiple spaces', () => {
      expect(generateSlug('Nail   Bar')).toBe('nail-bar')
    })

    test('should handle non-ASCII characters', () => {
      expect(generateSlug('Lepota Šminka')).toBe('lepota-minka')
    })
  })

  describe('getTenantFromSubdomain', () => {
    test('should extract subdomain from hostname', async () => {
      const subdomain = await getTenantFromSubdomain('milana.dragica.vercel.app')
      expect(subdomain).toBe('milana')
    })

    test('should return null for base domain', async () => {
      const subdomain = await getTenantFromSubdomain('dragica.vercel.app')
      expect(subdomain).toBe(null)
    })

    test('should return null for www subdomain', async () => {
      const subdomain = await getTenantFromSubdomain('www.dragica.vercel.app')
      expect(subdomain).toBe(null)
    })

    test('should handle localhost', async () => {
      const subdomain = await getTenantFromSubdomain('localhost')
      expect(subdomain).toBe(null)
    })

    test('should handle localhost with port', async () => {
      const subdomain = await getTenantFromSubdomain('localhost:3000')
      expect(subdomain).toBe(null)
    })

    test('should extract subdomain from localhost with subdomain', async () => {
      const subdomain = await getTenantFromSubdomain('milana.localhost:3000')
      expect(subdomain).toBe('milana')
    })
  })
})
