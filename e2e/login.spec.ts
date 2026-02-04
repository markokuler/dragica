import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dragica' })).toBeVisible()
    await expect(page.getByText('Prijavite se na vaš nalog')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Lozinka')).toBeVisible()
    await expect(page.getByRole('button', { name: /prijavite se/i })).toBeVisible()
  })

  test('should validate empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /prijavite se/i }).click()

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toHaveAttribute('required')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Lozinka').fill('wrongpassword')
    await page.getByRole('button', { name: /prijavite se/i }).click()

    // Wait for error message
    await expect(page.getByText('Neispravna email adresa ili lozinka')).toBeVisible()
  })

  test('should redirect admin to /admin on successful login', async ({ page }) => {
    // This test requires seeded admin user in test database
    await page.getByLabel('Email').fill('admin@test.com')
    await page.getByLabel('Lozinka').fill('admin123')
    await page.getByRole('button', { name: /prijavite se/i }).click()

    // Should redirect to admin panel
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Saloni' })).toBeVisible()
  })

  test('should redirect salon owner to /dashboard on successful login', async ({ page }) => {
    // This test requires seeded salon owner user in test database
    await page.getByLabel('Email').fill('owner@test.com')
    await page.getByLabel('Lozinka').fill('owner123')
    await page.getByRole('button', { name: /prijavite se/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'Kontrolna tabla' })).toBeVisible()
  })

  test('should be mobile responsive', async ({ page, viewport }) => {
    // Check that form is visible and usable on mobile
    if (viewport && viewport.width < 768) {
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Lozinka')).toBeVisible()

      // Fill form on mobile
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Lozinka').fill('password123')

      // Button should be full width on mobile
      const button = page.getByRole('button', { name: /prijavite se/i })
      await expect(button).toBeVisible()
    }
  })
})
