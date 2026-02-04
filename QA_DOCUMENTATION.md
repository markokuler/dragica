# Dragica - QA Documentation

**Version:** 1.0
**Last Updated:** February 4, 2026
**Application Type:** Multi-tenant SaaS for Nail Salons
**Tech Stack:** Next.js 16, Supabase, TypeScript, Tailwind CSS

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Completed Features](#completed-features)
4. [Planned Features](#planned-features)
5. [Test Scenarios](#test-scenarios)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)

---

## Overview

Dragica is a multi-tenant SaaS application designed for nail salons to manage their business operations and allow clients to book appointments online. Each salon (tenant) has isolated data and a customizable public booking page.

**Production URL:** https://dragica-web-app.vercel.app
**Repository:** https://github.com/markokuler/dragica
**Local Development:** `http://localhost:3000`

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Admin** | Platform administrator | `/admin/*` - Manage all salons |
| **Salon Owner (Client)** | Salon business owner | `/dashboard/*` - Manage own salon |
| **Public User** | End customer | `/book/[slug]` - Book appointments |

---

## Completed Features

### Phase 1: Admin Panel

**Location:** `/admin/*`
**Access:** Admin users only

| Feature | Description | URL |
|---------|-------------|-----|
| Admin Login | Secure authentication for admins | `/admin/login` |
| Salon List | View all registered salons | `/admin` |
| Create Salon | Register new salon with owner account | `/admin` (modal) |
| Edit Salon | Modify salon details | `/admin` (modal) |
| Activate/Deactivate Salon | Toggle salon status | `/admin` |
| Delete Salon | Remove salon from system | `/admin` |

**Test Scenarios - Admin Panel:**
- [ ] Admin can log in with valid credentials
- [ ] Admin cannot log in with invalid credentials
- [ ] Admin can view list of all salons
- [ ] Admin can create a new salon with all required fields
- [ ] System prevents duplicate email/subdomain when creating salon
- [ ] Admin can edit existing salon details
- [ ] Admin can activate/deactivate a salon
- [ ] Deactivated salon's booking page shows appropriate message
- [ ] Admin can delete a salon (with confirmation)
- [ ] Admin can log out

---

### Phase 2: Salon Owner Dashboard

**Location:** `/dashboard/*`
**Access:** Authenticated salon owners only

#### 2.1 Dashboard Overview
| Feature | Description | URL |
|---------|-------------|-----|
| Statistics | Today's bookings, revenue, total clients | `/dashboard` |
| Quick Actions | Navigate to common tasks | `/dashboard` |

#### 2.2 Services Management
| Feature | Description | URL |
|---------|-------------|-----|
| View Services | List all salon services | `/dashboard/usluge` |
| Add Service | Create new service with name, duration, price | `/dashboard/usluge` |
| Edit Service | Modify service details | `/dashboard/usluge` |
| Delete Service | Remove service | `/dashboard/usluge` |
| Toggle Active | Enable/disable service for booking | `/dashboard/usluge` |

**Test Scenarios - Services:**
- [ ] Owner can view all services
- [ ] Owner can add service with name, duration (minutes), price
- [ ] System validates required fields
- [ ] Owner can edit existing service
- [ ] Owner can delete service (with confirmation)
- [ ] Owner can toggle service active/inactive
- [ ] Inactive services don't appear on public booking page

#### 2.3 Client Management
| Feature | Description | URL |
|---------|-------------|-----|
| View Clients | List all clients with search | `/dashboard/klijenti` |
| Add Client | Create client with phone, name, notes | `/dashboard/klijenti` |
| Edit Client | Modify client details | `/dashboard/klijenti` |
| Delete Client | Remove client | `/dashboard/klijenti` |
| View History | See client's booking history | `/dashboard/klijenti` |

**Test Scenarios - Clients:**
- [ ] Owner can view all clients
- [ ] Owner can search clients by name or phone
- [ ] Owner can add client with phone (required) and name (optional)
- [ ] Owner can edit client details
- [ ] Owner can add/edit notes for client
- [ ] Owner can view client's booking history
- [ ] Owner can delete client

#### 2.4 Bookings Management
| Feature | Description | URL |
|---------|-------------|-----|
| View Bookings | List bookings with filters | `/dashboard/zakazivanja` |
| Filter by Status | Filter: all, pending, confirmed, completed, cancelled | `/dashboard/zakazivanja` |
| Filter by Date | Filter by specific date | `/dashboard/zakazivanja` |
| Add Booking | Create manual booking | `/dashboard/zakazivanja` |
| Edit Booking | Modify booking details | `/dashboard/zakazivanja` |
| Change Status | Update booking status | `/dashboard/zakazivanja` |
| Delete Booking | Remove booking | `/dashboard/zakazivanja` |

**Test Scenarios - Bookings:**
- [ ] Owner can view all bookings
- [ ] Owner can filter bookings by status
- [ ] Owner can filter bookings by date
- [ ] Owner can create manual booking (select service, client, date, time)
- [ ] Manual booking respects working hours
- [ ] Manual booking respects blocked slots
- [ ] Manual booking prevents double-booking
- [ ] Owner can edit booking details
- [ ] Owner can change booking status
- [ ] Owner can delete booking

#### 2.5 Calendar View
| Feature | Description | URL |
|---------|-------------|-----|
| Monthly Calendar | Visual calendar with bookings | `/dashboard/kalendar` |
| Day View | Click date to see day's bookings | `/dashboard/kalendar` |
| Quick Add | Add booking from calendar | `/dashboard/kalendar` |

**Test Scenarios - Calendar:**
- [ ] Calendar displays current month
- [ ] Calendar shows booking indicators on dates
- [ ] Owner can navigate between months
- [ ] Clicking a date shows that day's bookings
- [ ] Calendar uses Serbian Latin locale (not Cyrillic)

#### 2.6 Working Hours
| Feature | Description | URL |
|---------|-------------|-----|
| View Schedule | See weekly working hours | `/dashboard/podesavanja` |
| Set Hours | Define start/end time per day | `/dashboard/podesavanja` |
| Toggle Day | Mark day as working or closed | `/dashboard/podesavanja` |

**Test Scenarios - Working Hours:**
- [ ] Owner can view all 7 days with hours
- [ ] Owner can set start and end time for each day
- [ ] Owner can mark a day as closed (non-working)
- [ ] Changes save correctly
- [ ] Working hours affect available slots on booking page

#### 2.7 Blocked Slots
| Feature | Description | URL |
|---------|-------------|-----|
| View Blocked | List all blocked time slots | `/dashboard/podesavanja` |
| Add Block | Block specific date/time range | `/dashboard/podesavanja` |
| Add Reason | Optional reason for blocking | `/dashboard/podesavanja` |
| Delete Block | Remove blocked slot | `/dashboard/podesavanja` |

**Test Scenarios - Blocked Slots:**
- [ ] Owner can view all blocked slots
- [ ] Owner can add blocked slot with date, start time, end time
- [ ] Owner can add optional reason
- [ ] Owner can delete blocked slot
- [ ] Blocked slots prevent bookings on public page
- [ ] Blocked slots prevent manual bookings in dashboard

#### 2.8 Finances
| Feature | Description | URL |
|---------|-------------|-----|
| Revenue Summary | Total revenue for period | `/dashboard/finansije` |
| Filter Period | Filter by date range | `/dashboard/finansije` |
| Completed Bookings | List of completed bookings with revenue | `/dashboard/finansije` |

**Test Scenarios - Finances:**
- [ ] Owner can view total revenue
- [ ] Owner can filter by date range
- [ ] Only completed bookings count toward revenue
- [ ] Revenue calculates correctly based on service prices

#### 2.9 Salon Settings
| Feature | Description | URL |
|---------|-------------|-----|
| Edit Info | Update salon name, email, phone | `/dashboard/podesavanja` |
| Description | Update salon description | `/dashboard/podesavanja` |

**Test Scenarios - Settings:**
- [ ] Owner can update salon name
- [ ] Owner can update contact email
- [ ] Owner can update phone number
- [ ] Owner can update description
- [ ] Changes reflect on public booking page

---

### Phase 3: Public Booking System

**Location:** `/book/[slug]`
**Access:** Public (no authentication required)

| Feature | Description |
|---------|-------------|
| Salon Page | View salon info and services |
| Service Selection | Step 1: Choose a service |
| Date Selection | Step 2: Pick available date |
| Time Selection | Step 2: Pick available time slot |
| Contact Info | Step 3: Enter phone and optional name |
| Booking Confirmation | Confirmation page with details |

**Test Scenarios - Public Booking:**
- [ ] Public page loads for valid salon slug
- [ ] Invalid slug shows "Salon not found" error
- [ ] Inactive salon shows appropriate message
- [ ] All active services are displayed
- [ ] Inactive services are NOT displayed
- [ ] User can select a service
- [ ] Available dates show for next 14 days
- [ ] Time slots respect working hours
- [ ] Time slots respect blocked slots
- [ ] Time slots respect existing bookings
- [ ] Time slots account for service duration
- [ ] User can select date and time
- [ ] User must enter phone number
- [ ] Name field is optional
- [ ] Booking submits successfully
- [ ] Confirmation page shows booking details
- [ ] Double-booking is prevented (race condition)
- [ ] Calendar and dates use Serbian Latin locale

---

### Phase 4: Booking Page Customization (Branding)

**Location:** `/dashboard/brendiranje`
**Access:** Authenticated salon owners

| Feature | Description |
|---------|-------------|
| Logo Upload | Upload salon logo (max 5MB, image formats) |
| Banner Upload | Upload header banner image |
| Color Presets | 8 predefined color themes |
| Custom Colors | Accent, background, text colors |
| Button Style | Rounded, square, or pill buttons |
| Theme | Light, dark, or auto |
| Welcome Message | Custom greeting text |
| Live Preview | Real-time preview of changes |

**Color Presets:**
- Roze (Pink)
- Ljubičasta (Purple)
- Plava (Blue)
- Zelena (Green)
- Narandžasta (Orange)
- Crvena (Red)
- Tamna (Dark)
- Elegantna (Elegant/Gold)

**Test Scenarios - Branding:**
- [ ] Owner can upload logo (JPEG, PNG, WebP, GIF)
- [ ] Logo upload rejects files > 5MB
- [ ] Logo upload rejects non-image files
- [ ] Owner can remove uploaded logo
- [ ] Owner can upload banner image
- [ ] Owner can remove banner image
- [ ] Owner can apply color preset
- [ ] Preset changes all colors at once
- [ ] Owner can set custom accent color
- [ ] Owner can set custom background color
- [ ] Owner can set custom text color
- [ ] Color picker and hex input both work
- [ ] Owner can change button style
- [ ] Owner can change theme
- [ ] Owner can add welcome message
- [ ] Live preview updates in real-time
- [ ] Save button persists all changes
- [ ] Public booking page reflects saved branding
- [ ] Logo appears on public page header
- [ ] Banner appears on public page header
- [ ] Colors apply correctly to public page
- [ ] Button style applies to all buttons
- [ ] Welcome message displays on public page

---

## Planned Features

### Phase 5: Notifications
| Feature | Description | Priority |
|---------|-------------|----------|
| SMS Confirmation | Send SMS when booking created | High |
| SMS Reminder | Send reminder before appointment | High |
| Email Confirmation | Send email with booking details | Medium |
| Email Reminder | Send reminder before appointment | Medium |
| Owner Notifications | Notify owner of new bookings | Medium |

### Phase 6: Analytics & Reporting
| Feature | Description | Priority |
|---------|-------------|----------|
| Booking Analytics | Charts for booking trends | Medium |
| Revenue Reports | Detailed revenue breakdown | Medium |
| Popular Services | Most booked services report | Low |
| Client Analytics | Client visit frequency | Low |
| Export Reports | PDF/CSV export | Low |

### Phase 7: Advanced Features
| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-Staff Support | Multiple employees per salon | High |
| Staff Scheduling | Per-employee working hours | High |
| Online Payments | Accept payments online | Medium |
| Deposits | Require deposit for booking | Medium |
| Client Loyalty | Points/rewards system | Low |
| Gift Cards | Digital gift cards | Low |
| Recurring Bookings | Regular appointment scheduling | Low |

### Phase 8: Platform Features
| Feature | Description | Priority |
|---------|-------------|----------|
| Custom Domains | Salon's own domain | Low |
| Mobile App | Native iOS/Android app | Low |
| Multi-language | Support for multiple languages | Low |
| Integrations | Google Calendar, etc. | Low |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | User login |
| POST | `/api/auth/signout` | User logout |
| GET | `/api/auth/session` | Get current session |

### Admin APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/tenants` | List all salons |
| POST | `/api/admin/tenants` | Create salon |
| PUT | `/api/admin/tenants` | Update salon |
| DELETE | `/api/admin/tenants?id={id}` | Delete salon |

### Dashboard APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| GET | `/api/dashboard/salon` | Get salon details |
| PUT | `/api/dashboard/salon` | Update salon details |
| PUT | `/api/dashboard/branding` | Update branding settings |
| POST | `/api/dashboard/upload` | Upload logo/banner |
| GET | `/api/dashboard/services` | List services |
| POST | `/api/dashboard/services` | Create service |
| PUT | `/api/dashboard/services` | Update service |
| DELETE | `/api/dashboard/services?id={id}` | Delete service |
| GET | `/api/dashboard/clients` | List clients |
| POST | `/api/dashboard/clients` | Create client |
| PUT | `/api/dashboard/clients` | Update client |
| DELETE | `/api/dashboard/clients?id={id}` | Delete client |
| GET | `/api/dashboard/bookings` | List bookings |
| POST | `/api/dashboard/bookings` | Create booking |
| PUT | `/api/dashboard/bookings` | Update booking |
| DELETE | `/api/dashboard/bookings?id={id}` | Delete booking |
| GET | `/api/dashboard/working-hours` | Get working hours |
| PUT | `/api/dashboard/working-hours` | Update working hours |
| GET | `/api/dashboard/blocked-slots` | List blocked slots |
| POST | `/api/dashboard/blocked-slots` | Create blocked slot |
| DELETE | `/api/dashboard/blocked-slots?id={id}` | Delete blocked slot |
| GET | `/api/dashboard/finances` | Get financial data |

### Public APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/[slug]` | Get salon info and services |
| GET | `/api/public/[slug]/availability` | Get available time slots |
| POST | `/api/public/[slug]/book` | Create booking |

---

## Database Schema

### Tables

**tenants** (Salons)
- id (UUID, PK)
- name (TEXT)
- slug (TEXT, unique)
- subdomain (TEXT, unique)
- email (TEXT)
- phone (TEXT)
- description (TEXT, nullable)
- logo_url (TEXT, nullable)
- banner_url (TEXT, nullable)
- accent_color (TEXT, nullable)
- background_color (TEXT, nullable)
- text_color (TEXT, nullable)
- button_style (TEXT, nullable)
- theme (TEXT, nullable)
- welcome_message (TEXT, nullable)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)

**users**
- id (UUID, PK)
- email (TEXT)
- role (TEXT: 'admin' | 'client')
- tenant_id (UUID, FK → tenants, nullable)
- created_at (TIMESTAMP)

**services**
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- name (TEXT)
- duration_minutes (INTEGER)
- price (DECIMAL)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)

**clients**
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- phone (TEXT)
- name (TEXT, nullable)
- notes (TEXT, nullable)
- created_at (TIMESTAMP)

**bookings**
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- service_id (UUID, FK → services)
- client_id (UUID, FK → clients)
- date (DATE)
- start_time (TIME)
- end_time (TIME)
- status (TEXT: 'pending' | 'confirmed' | 'completed' | 'cancelled')
- created_at (TIMESTAMP)

**working_hours**
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- day_of_week (INTEGER: 0-6)
- start_time (TIME)
- end_time (TIME)
- is_working (BOOLEAN)

**blocked_slots**
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- date (DATE)
- start_time (TIME)
- end_time (TIME)
- reason (TEXT, nullable)
- created_at (TIMESTAMP)

---

## Test Environment Setup

### Production Environment
- **URL:** https://dragica-web-app.vercel.app
- **Admin Panel:** https://dragica-web-app.vercel.app/admin
- **Dashboard:** https://dragica-web-app.vercel.app/dashboard
- **Public Booking:** https://dragica-web-app.vercel.app/book/[salon-slug]

### Local Development
```bash
git clone https://github.com/markokuler/dragica.git
cd dragica
npm install
npm run dev
```

### Environment Variables
Configure in `.env.local` (local) or Vercel Dashboard (production):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Test Accounts
- Admin: (create via Supabase Auth Dashboard)
- Salon Owner: (created automatically when admin adds a salon)

### Test Data Setup
1. Log in as admin
2. Create a test salon via admin panel
3. Log in as salon owner
4. Add services, working hours, blocked slots
5. Create test bookings
6. Test public booking page

---

## Known Limitations

1. **No SMS/Email:** Notifications not yet implemented
2. **Single Staff:** Each salon has only one staff member
3. **No Payments:** Online payment not available
4. **No Mobile App:** Web only
5. **Serbian Only:** UI is in Serbian language

---

## Localization Notes

- All UI text is in Serbian (Latin script)
- Date format: Serbian Latin locale (srLatn)
- Currency: RSD (Serbian Dinar)
- Time format: 24-hour (HH:mm)

---

**Document prepared for external QA testing**
