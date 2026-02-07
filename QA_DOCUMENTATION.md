# Dragica - QA Documentation

**Version:** 3.0
**Last Updated:** February 7, 2026
**Application Type:** Multi-tenant SaaS for Beauty Salons
**Tech Stack:** Next.js 16, Supabase, TypeScript, Tailwind CSS 4, shadcn/ui

---

## Table of Contents

1. [Overview](#overview)
2. [Environments](#environments)
3. [User Roles](#user-roles)
4. [Application Structure](#application-structure)
5. [Completed Features](#completed-features)
6. [Test Scenarios](#test-scenarios)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [Demo System](#demo-system)
10. [Mobile Responsive Testing](#mobile-responsive-testing)

---

## Overview

Dragica is a multi-tenant SaaS application designed for beauty salons (nails, hair, cosmetics) on the Serbian market. Each salon (tenant) has isolated data, customizable public booking page, and full business management tools.

**Branding:**
- Logo text: "Dragica"
- Slogan: "Tvoja pomocnica"
- Theme: Dark grey (#181920) + Gold accent (#CDA661)
- Font: Poppins
- Language: Serbian (Latin)

---

## Environments

| Environment | URL | Database | Deploy |
|-------------|-----|----------|--------|
| **Production** | https://dragica.app | Supabase `dakmcfvhsfshkssmeqoy` | `git push origin main` |
| **Staging** | Vercel Preview (SSO protected) | Supabase `ammlbwvefnylqvorrilr` | `git push origin staging` |
| **Local** | http://localhost:3000 | Docker (`supabase start`) | `npm run dev` |

### Test Accounts (Local + Staging)

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@dragica.local | admin123 | admin |
| Salon Owner | milana@test.local | test1234 | client |
| Demo Admin | demo-admin@dragica.local | demo1234 | admin (is_demo) |
| Demo Salon | demo-salon@dragica.local | demo1234 | client (is_demo) |

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Admin** | Platform administrator | `/admin/*` - Manage all salons, finances, analytics |
| **Salon Owner (Client)** | Salon business owner | `/dashboard/*` - Manage own salon |
| **Public User** | End customer | `/book/[slug]` - Book appointments |

---

## Application Structure

### Admin Pages (10 pages)
```
/admin                  - Dashboard (stats overview)
/admin/saloni           - Lista salona + Novi salon (dialog)
/admin/saloni/novi      - Novi salon (full page form)
/admin/saloni/[id]      - Salon detail (5 tabs: pregled, crm, uplate, statistika, podesavanja)
/admin/saloni/[id]/services     - Usluge salona
/admin/saloni/[id]/hours        - Radno vreme salona
/admin/saloni/[id]/blocked-slots - Blokirani slotovi
/admin/saloni/[id]/settings     - Podešavanja salona
/admin/finansije        - Platform finansije
/admin/analitika        - Analitika po salonu
/admin/promocije        - Kuponi i popusti
/admin/izvestaji        - Izveštaji i export
/admin/aktivnost        - Audit log (aktivnost korisnika)
/admin/podesavanja      - Admin podešavanja (nalog, lozinka, app)
/admin/settings         - App settings
```

### Dashboard Pages (6 pages)
```
/dashboard              - Pregled (Overview)
/dashboard/kalendar     - Kalendar + Evidencija zakazivanja
/dashboard/usluge       - Usluge (Services)
/dashboard/klijenti     - Klijenti (Clients CRM)
/dashboard/finansije    - Finansije (Finances)
/dashboard/podesavanja  - Podešavanja (3 tabs: Opšte, Radno vreme, Brendiranje)
```

### Public Pages (3 pages)
```
/book/[slug]            - Booking flow
/book/[slug]/potvrda    - Booking confirmation
/book/[slug]/izmena/[token] - Manage/edit booking
```

### Other Pages
```
/                       - Landing page + demo buttons
/login                  - Login page
/setup                  - Initial setup
```

---

## Completed Features

### Phase 1-4: Core Platform

#### Admin Panel `/admin/*`

| Feature | Description | URL |
|---------|-------------|-----|
| Admin Dashboard | Stats overview | `/admin` |
| Salon List | All salons with search, filters | `/admin/saloni` |
| Create Salon (Dialog) | Popup form for quick salon creation | `/admin/saloni` (modal) |
| Create Salon (Full) | Full page form with all details | `/admin/saloni/novi` |
| Salon Detail | 5-tab detail view (pregled, CRM, uplate, statistika, podešavanja) | `/admin/saloni/[id]` |
| Salon CRM | Contacts management per salon | `/admin/saloni/[id]?tab=crm` |
| Brze Akcije | Dropdown: Pregled, CRM, Evidentiraj uplatu, Obriši | `/admin/saloni` |
| Activate/Deactivate | Toggle salon status | `/admin/saloni` |
| Import Salons | Bulk import | `/api/admin/salons/import` |
| Platform Finances | Revenue/expense tracking | `/admin/finansije` |
| Analytics | Salon statistics | `/admin/analitika` |
| Promotions | Coupon management | `/admin/promocije` |
| Subscriptions | Plan management | `/admin/podesavanja` |
| Audit Log | Activity tracking | `/admin/aktivnost` |
| Reports/Export | Data export | `/admin/izvestaji` |

#### Salon Dashboard `/dashboard/*`

| Feature | Description |
|---------|-------------|
| Overview | Stats cards, quick actions (popups), upcoming bookings |
| Calendar | Weekly view, today's bookings, booking indicators |
| Bookings | Create/edit (popup), status management (pending/confirmed/completed/cancelled/noshow) |
| Services | CRUD with pricing, duration, active toggle |
| Clients CRM | Search, notes, notification_channel, booking history, total spent |
| Finances | Income/expense chart, categories (booking/products/tips/other, supplies/rent/utilities/salaries/marketing/other) |
| Settings | General info, working hours, blocked slots, branding (6 themes, light/dark) |

#### Public Booking `/book/[slug]`

| Feature | Description |
|---------|-------------|
| 3-step flow | Service → Date/Time → Contact |
| Availability | Real-time checking against working hours, bookings, blocked slots |
| Branding | Custom colors, logo, themes per salon |
| Confirmation | Booking details page |
| Management | Edit/cancel via token URL |

### Phase 5-7: Expansion

| Feature | Phase |
|---------|-------|
| Admin expansion (analytics, CRM, finances, promotions, audit) | 5 |
| Demo system (demo login, cron reset, is_demo flags) | 6 |
| 3-environment setup (lokal/staging/production) | 7 |

---

## Test Scenarios

### Authentication
- [ ] Login with valid credentials
- [ ] Invalid credentials show error
- [ ] Admin redirects to `/admin`
- [ ] Client redirects to `/dashboard`
- [ ] Demo login (admin) works from landing page
- [ ] Demo login (salon) works from landing page
- [ ] Logout redirects to login
- [ ] Protected routes redirect to login
- [ ] Role-based access (admin can't access dashboard, client can't access admin)

### Demo System
- [ ] Demo buttons visible on landing page
- [ ] Demo admin login sets session and redirects to `/admin`
- [ ] Demo salon login sets session and redirects to `/dashboard`
- [ ] Demo users have `is_demo=true` flag
- [ ] Non-demo users can't use demo login endpoint
- [ ] Cron job resets demo data daily at 3 AM

### Admin - Salon Management
- [ ] Salon list loads with all salons
- [ ] Search by name works
- [ ] "+Novi Salon" opens dialog (not page navigation)
- [ ] Dialog: name auto-generates subdomain (Serbian char mapping)
- [ ] Dialog: all fields validate
- [ ] Dialog: create salon works, refreshes list
- [ ] Brze akcije dropdown: Pregled navigates to salon detail
- [ ] Brze akcije dropdown: CRM navigates to salon detail with CRM tab
- [ ] Brze akcije dropdown: Evidentiraj uplatu opens popup
- [ ] Brze akcije dropdown: Obriši opens confirmation
- [ ] Activate/deactivate toggle works
- [ ] Empty state shows when no salons

### Admin - Salon Detail
- [ ] Tab navigation works (pregled, crm, uplate, statistika, podesavanja)
- [ ] URL query param `?tab=crm` opens CRM tab directly
- [ ] Pregled shows salon info
- [ ] CRM shows contacts list
- [ ] Uplate shows payment history
- [ ] Statistika shows salon stats
- [ ] Podešavanja allows editing

### Dashboard Overview
- [ ] Stats cards show correct numbers
- [ ] Clicking Zakazivanja → navigates to kalendar
- [ ] Clicking Klijenti → navigates to klijenti
- [ ] "Novo zakazivanje" opens popup form
- [ ] "Dodaj uslugu" opens popup form
- [ ] Upcoming bookings list shows correct data
- [ ] "Svi termini" navigates to kalendar

### Calendar & Bookings
- [ ] Weekly view shows correct dates
- [ ] Navigation changes week
- [ ] "Danas" returns to current week
- [ ] Bookings appear on correct days
- [ ] Today is highlighted
- [ ] Status badges show correct colors (including noshow)
- [ ] Today's bookings section shows correct data
- [ ] Create booking popup works
- [ ] Edit booking popup pre-fills data
- [ ] Potvrdi changes status to confirmed
- [ ] Završi changes status to completed
- [ ] Otkaži opens confirmation, changes to cancelled
- [ ] Noshow status displayed correctly

### Booking Status Colors
| Status | Serbian | Color |
|--------|---------|-------|
| pending | Na čekanju | Warning (gold) |
| confirmed | Potvrđeno | Success (teal) |
| completed | Završeno | Success (teal) |
| cancelled | Otkazano | Destructive (red) |
| noshow | Nije došao/la | Muted (grey) |

### Services
- [ ] Table shows all services
- [ ] "Nova usluga" opens popup
- [ ] Create service works
- [ ] Edit saves changes
- [ ] Delete opens confirmation
- [ ] Status toggle works (Aktivna/Neaktivna)
- [ ] Inactive services hidden from public booking

### Clients
- [ ] Stats cards show correct totals
- [ ] Search by name works
- [ ] Search by phone works
- [ ] "Novi klijent" opens popup
- [ ] Create client works
- [ ] Edit saves changes (including notes)
- [ ] "Detalji" opens history dialog
- [ ] Customer notes field works
- [ ] Notification channel displayed

### Finances
- [ ] Revenue chart displays correctly
- [ ] Income categories: booking, products, tips, other
- [ ] Expense categories: supplies, rent, utilities, salaries, marketing, other
- [ ] Source indicator: auto (Dragica) vs manual
- [ ] Period filters work (dan, nedelja, mesec)
- [ ] Add manual income entry works
- [ ] Add expense entry works
- [ ] Total amounts calculate correctly

### Settings
- [ ] Opšte: save updates salon info
- [ ] Radno vreme: all 7 days displayed, edit dialog works
- [ ] Blokirani slotovi: add/delete works
- [ ] Brendiranje: 6 themes, light/dark, preview updates live

### Public Booking
- [ ] Valid slug loads salon
- [ ] Invalid slug shows error
- [ ] Inactive salon shows message
- [ ] Custom branding applied
- [ ] Service selection works
- [ ] Date picker shows available dates
- [ ] Time slots respect working hours
- [ ] Time slots respect blocked slots
- [ ] Time slots respect existing bookings
- [ ] Phone required for submit
- [ ] Booking creates successfully
- [ ] Confirmation page shows details
- [ ] Manage booking via token works

---

## API Endpoints

### Auth (4 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/callback` | OAuth callback |
| POST | `/api/auth/signout` | Logout |
| POST | `/api/auth/role` | Get user role (server-side, bypasses RLS) |
| POST | `/api/auth/demo-login` | Demo login |

### Cron (1 endpoint)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cron/reset-demo` | Daily demo data reset |

### Admin APIs (30+ endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/analytics` | Analytics data |
| GET | `/api/admin/audit` | Audit log |
| GET | `/api/admin/export` | Export data |
| GET/POST | `/api/admin/finances` | Platform finances |
| PUT/DELETE | `/api/admin/finances/[id]` | Manage finance entry |
| GET/POST | `/api/admin/salons` | Salon CRUD |
| POST | `/api/admin/salons/import` | Bulk import |
| GET/PUT/DELETE | `/api/admin/salons/[id]` | Salon detail |
| GET | `/api/admin/salons/[id]/stats` | Salon statistics |
| GET/POST | `/api/admin/salons/[id]/services` | Salon services |
| PUT/DELETE | `/api/admin/salons/[id]/services/[serviceId]` | Service detail |
| GET/POST | `/api/admin/salons/[id]/hours` | Working hours |
| PUT/DELETE | `/api/admin/salons/[id]/hours/[hourId]` | Hour detail |
| GET/POST | `/api/admin/salons/[id]/blocked-slots` | Blocked slots |
| DELETE | `/api/admin/salons/[id]/blocked-slots/[slotId]` | Delete slot |
| GET/POST | `/api/admin/salons/[id]/contacts` | CRM contacts |
| PUT/DELETE | `/api/admin/salons/[id]/contacts/[contactId]` | Contact detail |
| GET/POST | `/api/admin/salons/[id]/payments` | Payments |
| GET/PUT | `/api/admin/salons/[id]/tags` | Salon tags |
| GET/POST | `/api/admin/subscriptions` | Subscriptions |
| GET/POST | `/api/admin/plans` | Subscription plans |
| PUT/DELETE | `/api/admin/plans/[id]` | Plan detail |
| GET/POST | `/api/admin/payments` | Platform payments |
| PUT | `/api/admin/payments/[id]` | Payment detail |
| GET/POST | `/api/admin/coupons` | Coupon management |
| PUT/DELETE | `/api/admin/coupons/[id]` | Coupon detail |
| GET/POST | `/api/admin/reminders` | Reminder templates |
| PUT/DELETE | `/api/admin/reminders/[id]` | Reminder detail |
| GET/POST | `/api/admin/tags` | Tags |
| GET | `/api/admin/check` | Auth check |
| POST | `/api/admin/impersonate` | Impersonate salon |
| PUT | `/api/admin/settings/password` | Change password |
| PUT | `/api/admin/settings/account` | Update account |
| GET/PUT | `/api/admin/settings/app` | App settings |

### Dashboard APIs (14 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET/PUT | `/api/dashboard/salon` | Salon details |
| PUT | `/api/dashboard/branding` | Branding settings |
| POST | `/api/dashboard/upload` | File upload |
| GET/POST | `/api/dashboard/services` | Services |
| PUT/DELETE | `/api/dashboard/services/[id]` | Service detail |
| GET/POST | `/api/dashboard/clients` | Clients |
| GET/PUT | `/api/dashboard/clients/[id]` | Client detail |
| GET/POST | `/api/dashboard/bookings` | Bookings |
| PUT/DELETE | `/api/dashboard/bookings/[id]` | Booking detail |
| GET/PUT | `/api/dashboard/working-hours` | Working hours |
| PUT/DELETE | `/api/dashboard/working-hours/[id]` | Hour detail |
| GET/POST | `/api/dashboard/blocked-slots` | Blocked slots |
| DELETE | `/api/dashboard/blocked-slots/[id]` | Delete slot |
| GET/POST | `/api/dashboard/finances` | Financial entries |
| PUT/DELETE | `/api/dashboard/finances/[id]` | Finance detail |

### Public APIs (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/[slug]` | Salon info + services |
| GET | `/api/public/[slug]/availability` | Available time slots |
| POST | `/api/public/[slug]/send-otp` | Send OTP |
| POST | `/api/public/[slug]/book` | Create booking |
| GET | `/api/public/[slug]/booking/[id]` | Booking details |
| GET/PUT | `/api/public/[slug]/manage/[token]` | Manage booking |

---

## Database Schema

### tenants
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Salon name |
| slug | TEXT | URL slug (unique) |
| subdomain | TEXT | Subdomain (unique) |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| address | TEXT | Address |
| description | TEXT | Description |
| logo_url | TEXT | Logo image URL |
| banner_url | TEXT | Banner image URL |
| accent_color | TEXT | Theme accent color |
| background_color | TEXT | Theme background |
| text_color | TEXT | Theme text color |
| button_style | TEXT | Button style |
| welcome_message | TEXT | Welcome message |
| is_active | BOOLEAN | Active status |
| is_demo | BOOLEAN | Demo flag |
| created_at | TIMESTAMP | Creation date |

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (FK to auth.users) |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| role | TEXT | 'admin' or 'client' |
| tenant_id | UUID | FK to tenants |
| is_demo | BOOLEAN | Demo flag |
| created_at | TIMESTAMP | Creation date |

### services
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| name | TEXT | Service name |
| duration_minutes | INTEGER | Duration |
| price | DECIMAL | Price in RSD |
| is_active | BOOLEAN | Active status |

### customers
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| phone | TEXT | Phone number |
| name | TEXT | Customer name |
| notes | TEXT | Customer notes |
| notification_channel | TEXT | Preferred channel (sms/whatsapp/viber) |

### bookings
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| service_id | UUID | FK to services |
| customer_id | UUID | FK to customers |
| start_datetime | TIMESTAMP | Start time |
| end_datetime | TIMESTAMP | End time |
| status | TEXT | pending/confirmed/completed/cancelled/noshow |
| manage_token | TEXT | Token for public management |

### financial_entries
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| type | TEXT | income/expense |
| category | TEXT | booking/products/tips/other (income), supplies/rent/utilities/salaries/marketing/other (expense) |
| amount | DECIMAL | Amount in RSD |
| description | TEXT | Description |
| entry_date | DATE | Entry date |
| booking_id | UUID | FK to bookings (auto entries) |

### Additional Tables
- `subscription_plans` - Plan definitions (name, price, features)
- `subscriptions` - Active subscriptions (tenant, plan, status, dates)
- `payments` - Payment records
- `coupons` - Promotional coupons (code, discount, validity)
- `platform_settings` - Global app settings

---

## Demo System

### How It Works
1. Landing page has two demo buttons: "Demo Admin" and "Demo Salon"
2. Buttons call `POST /api/auth/demo-login` with `type: 'admin'|'owner'`
3. API reads credentials from env vars (`DEMO_ADMIN_EMAIL`, etc.)
4. Verifies user has `is_demo=true` in database
5. Signs in via Supabase Auth, sets session cookies
6. Redirects to `/admin` or `/dashboard`

### Daily Reset
- Vercel cron job runs at 3 AM: `GET /api/cron/reset-demo`
- Protected by `CRON_SECRET` env var
- Resets demo salon data to known state

### Env Variables (Preview/Staging)
```
DEMO_ADMIN_EMAIL=demo-admin@dragica.local
DEMO_ADMIN_PASSWORD=demo1234
DEMO_OWNER_EMAIL=demo-salon@dragica.local
DEMO_OWNER_PASSWORD=demo1234
CRON_SECRET=staging-cron-secret-dragica
```

---

## Mobile Responsive Testing

### Screen Sizes
| Device | Width |
|--------|-------|
| iPhone SE | 375px |
| iPhone 12/13 | 390px |
| Samsung Galaxy S21 | 360px |
| iPad Mini | 768px |
| iPad Pro | 1024px |

### Checklist
- [ ] Mobile navigation (hamburger menu, slide-out sheet)
- [ ] Stats cards stack vertically
- [ ] Tables horizontally scrollable
- [ ] Popup dialogs full width on small screens
- [ ] Input fields min 16px font (prevent zoom)
- [ ] Touch targets min 44px
- [ ] Calendar view readable on mobile

---

## Localization Notes

- All UI text: Serbian (Latin script)
- Date format: `d. MMM yyyy` (e.g., "4. feb 2026")
- Time format: 24-hour `HH:mm` (e.g., "14:30")
- Day names: Serbian Latin (pon, uto, sre, cet, pet, sub, ned)
- Currency: RSD (Serbian Dinar)
- Locale library: `date-fns/locale/sr-Latn`

---

## Known Limitations

1. **No Notifications:** SMS/WhatsApp/Viber not yet active (Infobip integrated but not configured)
2. **Single Staff:** Each salon has one staff member only
3. **No Online Payments:** Payment processing not available
4. **No Mobile App:** Web only (responsive)
5. **Serbian Only:** No multi-language support
6. **No Automated Tests:** Testing plan exists but not implemented

---

**Document Version:** 3.0
**Updated by:** Claude Code
**Date:** February 7, 2026
