# Dragica - Comprehensive Testing Plan

## Overview
This document outlines the testing strategy for the Dragica SaaS application. Each feature will have corresponding tests to ensure reliability and prevent regressions.

## Testing Stack

### Tools
- **Unit/Integration Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **API Testing**: Supertest + Jest
- **Database Testing**: Supabase Test Client
- **Mocking**: MSW (Mock Service Worker) for API mocks

### Installation
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @playwright/test supertest msw
```

## Test Coverage Goals
- **Unit Tests**: 80%+ coverage for utilities and components
- **Integration Tests**: 100% coverage for API routes
- **E2E Tests**: All critical user flows

---

## Phase 1: Foundation & Admin Panel

### 1.1 Database Schema Tests

**File**: `__tests__/database/schema.test.ts`

```typescript
describe('Database Schema', () => {
  test('should create tenants table with all columns')
  test('should enforce unique constraint on subdomain')
  test('should enforce unique constraint on slug')
  test('should create indexes on tenant_id columns')
  test('should cascade delete when tenant is deleted')
})
```

**What to test:**
- ✅ All tables exist
- ✅ Foreign key relationships work
- ✅ Unique constraints are enforced
- ✅ Cascade deletes work properly
- ✅ Indexes exist for performance

---

### 1.2 Authentication Tests

**File**: `__tests__/lib/auth.test.ts`

```typescript
describe('Authentication', () => {
  describe('getUser', () => {
    test('should return user when authenticated')
    test('should return null when not authenticated')
  })

  describe('getUserWithRole', () => {
    test('should return user with role data')
    test('should return null for non-existent user')
  })

  describe('requireAuth', () => {
    test('should return user when authenticated')
    test('should redirect to /login when not authenticated')
  })

  describe('requireAdmin', () => {
    test('should return admin user')
    test('should redirect non-admin to /dashboard')
    test('should redirect unauthenticated to /login')
  })

  describe('requireClient', () => {
    test('should return client user')
    test('should redirect admin to /admin')
    test('should redirect unauthenticated to /login')
  })
})
```

**What to test:**
- ✅ User authentication state detection
- ✅ Role-based access control
- ✅ Redirects work correctly
- ✅ Session handling

---

### 1.3 Tenant Detection Tests

**File**: `__tests__/lib/tenant.test.ts`

```typescript
describe('Tenant Detection', () => {
  describe('getTenantFromSubdomain', () => {
    test('should extract subdomain from hostname')
    test('should return null for base domain')
    test('should return null for www subdomain')
    test('should handle localhost with port')
  })

  describe('getTenantBySubdomain', () => {
    test('should find tenant by subdomain')
    test('should return null for inactive tenant')
    test('should return null for non-existent tenant')
  })

  describe('generateSlug', () => {
    test('should convert name to slug')
    test('should handle special characters')
    test('should handle spaces')
    test('should handle uppercase')
  })
})
```

**What to test:**
- ✅ Subdomain extraction from various hostnames
- ✅ Tenant lookup from database
- ✅ Slug generation from salon name
- ✅ Edge cases (ports, www, etc.)

---

### 1.4 Login Page Tests

**File**: `__tests__/app/login/page.test.tsx`

```typescript
describe('Login Page', () => {
  test('should render login form')
  test('should validate email format')
  test('should validate password is required')
  test('should show error for invalid credentials')
  test('should redirect admin to /admin on success')
  test('should redirect client to /dashboard on success')
  test('should disable form during submission')
  test('should display loading state')
})
```

**What to test:**
- ✅ Form renders correctly
- ✅ Validation works
- ✅ Error messages display
- ✅ Successful login redirects
- ✅ Loading states
- ✅ Accessibility (ARIA labels, keyboard nav)

---

### 1.5 Admin Panel - Create Salon Tests

**File**: `__tests__/app/admin/salons/new/page.test.tsx`

```typescript
describe('New Salon Page', () => {
  test('should render create salon form')
  test('should auto-generate slug from name')
  test('should auto-generate subdomain from name')
  test('should validate required fields')
  test('should validate email format')
  test('should validate password minimum length')
  test('should show preview URL with subdomain')
  test('should submit form successfully')
  test('should show error for duplicate subdomain')
  test('should redirect to /admin on success')
})
```

**File**: `__tests__/api/admin/salons/route.test.ts`

```typescript
describe('POST /api/admin/salons', () => {
  test('should require authentication')
  test('should require admin role')
  test('should validate required fields')
  test('should create tenant in database')
  test('should create owner user account')
  test('should create user record in users table')
  test('should rollback tenant if user creation fails')
  test('should rollback all if user record creation fails')
  test('should reject duplicate subdomain')
  test('should return 201 with tenant data')
})
```

**What to test:**
- ✅ Form validation
- ✅ Auto-generation of slug/subdomain
- ✅ API authentication/authorization
- ✅ Database transactions
- ✅ Rollback on errors
- ✅ Success scenarios
- ✅ Error handling

---

### 1.6 Admin Panel - List Salons Tests

**File**: `__tests__/app/admin/page.test.tsx`

```typescript
describe('Admin Page', () => {
  test('should display list of salons')
  test('should show empty state when no salons')
  test('should display salon details in table')
  test('should show active/inactive status badge')
  test('should link to manage salon page')
  test('should link to create new salon')
  test('should format subdomain as code')
})
```

**What to test:**
- ✅ Data fetching and display
- ✅ Empty states
- ✅ Status badges
- ✅ Navigation links
- ✅ Table formatting

---

### 1.7 Middleware Tests

**File**: `__tests__/middleware.test.ts`

```typescript
describe('Middleware', () => {
  test('should not rewrite base domain requests')
  test('should rewrite subdomain requests to /[tenant] route')
  test('should not rewrite admin routes')
  test('should not rewrite dashboard routes')
  test('should not rewrite login route')
  test('should handle www subdomain')
  test('should handle localhost with port')
})
```

**What to test:**
- ✅ Routing logic for subdomains
- ✅ Protected routes bypass
- ✅ Various hostname formats

---

## Phase 2: Salon Owner Dashboard

### 2.1 Dashboard Layout Tests

**File**: `__tests__/app/dashboard/layout.test.tsx`

```typescript
describe('Dashboard Layout', () => {
  test('should render sidebar navigation')
  test('should display salon name')
  test('should show logout button')
  test('should highlight active nav item')
  test('should render mobile menu')
  test('should redirect unauthenticated users')
  test('should only allow client role access')
})
```

---

### 2.2 Services Management Tests

**File**: `__tests__/app/dashboard/services/page.test.tsx`

```typescript
describe('Services Page', () => {
  test('should display list of services')
  test('should show empty state when no services')
  test('should display service details (name, duration, price)')
  test('should show active/inactive toggle')
  test('should allow creating new service')
  test('should allow editing service')
  test('should allow deleting service')
  test('should prevent deletion if active bookings exist')
  test('should filter by tenant_id')
})
```

**File**: `__tests__/api/services/route.test.ts`

```typescript
describe('Services API', () => {
  describe('GET /api/services', () => {
    test('should return services for authenticated user tenant')
    test('should filter by tenant_id')
    test('should return only active services for public')
  })

  describe('POST /api/services', () => {
    test('should create service for user tenant')
    test('should validate required fields')
    test('should validate price is positive number')
    test('should validate duration is positive integer')
    test('should not allow creating for other tenants')
  })

  describe('PUT /api/services/:id', () => {
    test('should update service')
    test('should not allow updating other tenant services')
  })

  describe('DELETE /api/services/:id', () => {
    test('should delete service')
    test('should prevent deletion if active bookings exist')
    test('should not allow deleting other tenant services')
  })
})
```

---

### 2.3 Working Hours Management Tests

**File**: `__tests__/app/dashboard/calendar/page.test.tsx`

```typescript
describe('Working Hours Page', () => {
  test('should display week view calendar')
  test('should show existing working hours')
  test('should allow adding time range for a day')
  test('should allow editing time range')
  test('should allow deleting time range')
  test('should validate start time is before end time')
  test('should prevent overlapping time ranges')
})
```

**File**: `__tests__/api/working-hours/route.test.ts`

```typescript
describe('Working Hours API', () => {
  describe('POST /api/working-hours', () => {
    test('should create working hours')
    test('should validate day_of_week is 0-6')
    test('should validate time format')
    test('should validate start < end')
    test('should prevent duplicate entries')
  })
})
```

---

### 2.4 Blocked Slots Tests

**File**: `__tests__/api/blocked-slots/route.test.ts`

```typescript
describe('Blocked Slots API', () => {
  describe('POST /api/blocked-slots', () => {
    test('should create blocked slot')
    test('should validate datetime format')
    test('should validate start < end')
    test('should allow optional reason')
  })

  describe('DELETE /api/blocked-slots/:id', () => {
    test('should delete blocked slot')
    test('should not allow deleting other tenant slots')
  })
})
```

---

### 2.5 CRM - Customers Tests

**File**: `__tests__/app/dashboard/clients/page.test.tsx`

```typescript
describe('Clients Page', () => {
  test('should display list of customers')
  test('should show customer phone and name')
  test('should show booking history')
  test('should calculate total visits')
  test('should calculate total spent')
  test('should allow search by phone')
  test('should filter by tenant_id')
})
```

**File**: `__tests__/api/customers/route.test.ts`

```typescript
describe('Customers API', () => {
  describe('GET /api/customers', () => {
    test('should return customers for user tenant')
    test('should include booking statistics')
    test('should support search by phone')
  })

  describe('GET /api/customers/:id', () => {
    test('should return customer details')
    test('should include booking history')
    test('should not allow viewing other tenant customers')
  })
})
```

---

### 2.6 Bookings Management Tests

**File**: `__tests__/app/dashboard/bookings/page.test.tsx`

```typescript
describe('Bookings Page', () => {
  test('should display list of bookings')
  test('should filter by date range')
  test('should filter by status')
  test('should filter by service')
  test('should show booking details')
  test('should allow manual booking creation')
  test('should allow cancellation')
  test('should allow marking as completed')
  test('should display customer info')
  test('should display service info')
})
```

**File**: `__tests__/api/bookings/route.test.ts`

```typescript
describe('Bookings API', () => {
  describe('GET /api/bookings', () => {
    test('should return bookings for user tenant')
    test('should support date range filter')
    test('should support status filter')
    test('should include related data (customer, service)')
  })

  describe('POST /api/bookings', () => {
    test('should create manual booking')
    test('should check for conflicts')
    test('should respect working hours')
    test('should respect blocked slots')
    test('should create customer if not exists')
  })

  describe('PUT /api/bookings/:id/cancel', () => {
    test('should cancel booking')
    test('should send SMS notification')
  })

  describe('PUT /api/bookings/:id/complete', () => {
    test('should mark booking as completed')
    test('should create financial entry automatically')
  })
})
```

---

### 2.7 Financial Tracking Tests

**File**: `__tests__/app/dashboard/financije/page.test.tsx`

```typescript
describe('Financije Page', () => {
  test('should display key metrics')
  test('should show today income')
  test('should show weekly income')
  test('should show monthly income')
  test('should calculate profit (income - expenses)')
  test('should allow adding manual income entry')
  test('should allow adding expense entry')
  test('should display category breakdown')
  test('should show income vs expenses chart')
})
```

**File**: `__tests__/api/financial-entries/route.test.ts`

```typescript
describe('Financial Entries API', () => {
  describe('GET /api/financial-entries', () => {
    test('should return entries for user tenant')
    test('should support date range filter')
    test('should support type filter (income/expense)')
    test('should calculate totals')
  })

  describe('POST /api/financial-entries', () => {
    test('should create income entry')
    test('should create expense entry')
    test('should validate amount is positive')
    test('should validate required fields')
  })

  describe('GET /api/financial-entries/stats', () => {
    test('should return daily stats')
    test('should return weekly stats')
    test('should return monthly stats')
    test('should calculate profit')
  })
})
```

---

## Phase 3: Public Booking System

### 3.1 Booking Page Tests

**File**: `__tests__/app/[tenant]/page.test.tsx`

```typescript
describe('Public Booking Page', () => {
  test('should load tenant by subdomain')
  test('should display salon info')
  test('should apply tenant branding (logo, colors)')
  test('should show 404 for invalid tenant')
  test('should show error for inactive tenant')
  test('should display list of services')
  test('should allow selecting service')
  test('should show date picker')
  test('should show only available dates')
  test('should show time slot picker')
  test('should show only available time slots')
  test('should show booking form')
  test('should validate phone number format')
})
```

---

### 3.2 Availability Calculation Tests

**File**: `__tests__/lib/availability.test.ts`

```typescript
describe('Availability Calculation', () => {
  describe('getAvailableSlots', () => {
    test('should return slots within working hours')
    test('should exclude slots with existing bookings')
    test('should exclude blocked slots')
    test('should account for service duration')
    test('should return slots in 15-min intervals')
    test('should handle multiple bookings on same day')
    test('should handle overlapping bookings')
    test('should handle different time zones')
  })

  describe('isSlotAvailable', () => {
    test('should check if slot is within working hours')
    test('should check for booking conflicts')
    test('should check for blocked slots')
    test('should validate service fits in slot')
  })
})
```

**What to test:**
- ✅ Complex availability logic
- ✅ Working hours enforcement
- ✅ Booking conflict detection
- ✅ Blocked slots consideration
- ✅ Service duration calculation
- ✅ Edge cases (midnight, day boundaries)

---

### 3.3 SMS OTP Tests

**File**: `__tests__/lib/twilio.test.ts`

```typescript
describe('SMS Service', () => {
  describe('generateOTP', () => {
    test('should generate 6-digit code')
    test('should generate unique codes')
  })

  describe('sendOTPSMS', () => {
    test('should send SMS with OTP')
    test('should use Serbian message')
    test('should handle Twilio errors')
  })

  describe('sendBookingConfirmationSMS', () => {
    test('should send confirmation SMS')
    test('should include salon name, service, datetime')
  })
})
```

**File**: `__tests__/api/bookings/verify-otp/route.test.ts`

```typescript
describe('OTP Verification API', () => {
  describe('POST /api/bookings/verify-otp', () => {
    test('should verify valid OTP')
    test('should reject invalid OTP')
    test('should reject expired OTP (>10 min)')
    test('should reject already used OTP')
    test('should update booking status to confirmed')
    test('should send confirmation SMS')
    test('should create customer record')
  })
})
```

**What to test:**
- ✅ OTP generation
- ✅ SMS sending (mocked)
- ✅ OTP verification
- ✅ Expiration logic
- ✅ Single-use enforcement
- ✅ Rate limiting

---

### 3.4 Booking Creation Tests

**File**: `__tests__/api/bookings/public/route.test.ts`

```typescript
describe('Public Booking API', () => {
  describe('POST /api/bookings/public', () => {
    test('should create booking with pending status')
    test('should validate slot availability')
    test('should prevent double-booking')
    test('should generate OTP')
    test('should send OTP SMS')
    test('should create or find customer by phone')
    test('should enforce working hours')
    test('should respect blocked slots')
    test('should use transaction for atomicity')
    test('should handle race conditions')
  })
})
```

**What to test:**
- ✅ Booking creation flow
- ✅ Availability validation
- ✅ Race condition handling
- ✅ Transaction atomicity
- ✅ OTP generation and SMS
- ✅ Customer creation

---

## Phase 4: E2E Tests

### 4.1 Admin Flow E2E Tests

**File**: `e2e/admin-flow.spec.ts`

```typescript
describe('Admin Flow', () => {
  test('Admin can log in', async ({ page }) => {
    // Navigate to login
    // Enter admin credentials
    // Submit form
    // Assert redirected to /admin
  })

  test('Admin can create new salon', async ({ page }) => {
    // Login as admin
    // Navigate to create salon
    // Fill form
    // Submit
    // Assert salon appears in list
  })

  test('Admin can manage salon services', async ({ page }) => {
    // Login as admin
    // Navigate to salon management
    // Add service
    // Edit service
    // Verify changes
  })

  test('Admin can configure working hours', async ({ page }) => {
    // Login as admin
    // Navigate to working hours
    // Set hours for each day
    // Verify saved
  })
})
```

---

### 4.2 Salon Owner Flow E2E Tests

**File**: `e2e/salon-owner-flow.spec.ts`

```typescript
describe('Salon Owner Flow', () => {
  test('Salon owner can log in', async ({ page }) => {
    // Navigate to login
    // Enter owner credentials
    // Assert redirected to /dashboard
  })

  test('Salon owner can manage services', async ({ page }) => {
    // Login as owner
    // Navigate to services
    // Create, edit, delete service
  })

  test('Salon owner can set working hours', async ({ page }) => {
    // Login as owner
    // Navigate to calendar
    // Set working hours
  })

  test('Salon owner can view bookings', async ({ page }) => {
    // Login as owner
    // Navigate to bookings
    // Filter bookings
    // View booking details
  })

  test('Salon owner can mark booking as completed', async ({ page }) => {
    // Login as owner
    // Find booking
    // Mark as completed
    // Verify financial entry created
  })

  test('Salon owner can track finances', async ({ page }) => {
    // Login as owner
    // Navigate to finances
    // Add expense
    // View reports
  })
})
```

---

### 4.3 Customer Booking Flow E2E Tests

**File**: `e2e/customer-booking-flow.spec.ts`

```typescript
describe('Customer Booking Flow', () => {
  test('Customer can book appointment', async ({ page }) => {
    // Visit salon subdomain
    // Select service
    // Select date
    // Select time slot
    // Enter phone number
    // Submit booking
    // Receive OTP (mock SMS)
    // Enter OTP
    // See confirmation
  })

  test('Customer sees error for invalid OTP', async ({ page }) => {
    // Start booking flow
    // Enter wrong OTP
    // See error message
  })

  test('Customer sees error for expired OTP', async ({ page }) => {
    // Start booking flow
    // Wait for OTP expiration
    // Enter expired OTP
    // See error message
  })

  test('Customer cannot book unavailable slot', async ({ page }) => {
    // Visit booking page
    // Select service
    // Verify unavailable slots are disabled
  })
})
```

---

## Testing Infrastructure

### Setup Files

**File**: `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}
```

**File**: `jest.setup.js`
```javascript
import '@testing-library/jest-dom'
```

**File**: `playwright.config.ts`
```typescript
export default {
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
}
```

---

## CI/CD Integration

### GitHub Actions

**File**: `.github/workflows/test.yml`
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
```

---

## Test Execution Commands

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Testing Checklist Per Feature

For each new feature, ensure:

- [ ] Unit tests for utility functions
- [ ] Component tests for UI components
- [ ] Integration tests for API routes
- [ ] E2E test for critical user flow
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Security tests (auth, authorization)
- [ ] Performance tests (for complex queries)
- [ ] Accessibility tests (ARIA, keyboard nav)

---

## Summary

This testing plan ensures:
1. ✅ **Every feature has tests** - Unit, integration, and E2E
2. ✅ **High coverage** - 80%+ for critical code
3. ✅ **Regression prevention** - Tests catch breaking changes
4. ✅ **Confidence in deployments** - All tests pass before deploy
5. ✅ **Documentation** - Tests serve as usage examples
6. ✅ **Quality assurance** - Bugs caught before production

**Estimated Testing Time:**
- Phase 1: 2-3 days of testing
- Phase 2: 3-4 days of testing
- Phase 3: 2-3 days of testing
- Phase 4: 1-2 days of E2E tests

**Total: ~10-12 days** of testing across all phases (parallel with development)
