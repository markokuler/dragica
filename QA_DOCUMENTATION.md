# Dragica - QA Documentation

**Version:** 2.0
**Last Updated:** February 4, 2026
**Application Type:** Multi-tenant SaaS for Nail Salons
**Tech Stack:** Next.js 16, Supabase, TypeScript, Tailwind CSS v4, shadcn/ui

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Application Structure](#application-structure)
4. [Completed Features](#completed-features)
5. [Test Scenarios](#test-scenarios)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Mobile Responsive Testing](#mobile-responsive-testing)

---

## Overview

Dragica is a multi-tenant SaaS application designed for nail salons to manage their business operations and allow clients to book appointments online. Each salon (tenant) has isolated data and a customizable public booking page.

**Branding:**
- Logo text: "Dragica"
- Slogan: "Tvoja pomoćnica"
- Theme: Dark grey (#181920) + Gold accent (#CDA661)
- Font: Poppins
- Language: Serbian (Latin)

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

## Application Structure

### Dashboard Pages
```
/dashboard              - Pregled (Overview)
/dashboard/kalendar     - Kalendar + Evidencija zakazivanja
/dashboard/usluge       - Usluge (Services)
/dashboard/klijenti     - Klijenti (Clients)
/dashboard/finansije    - Finansije (Finances)
/dashboard/podesavanja  - Podešavanja (Settings)
  └── Tab: Opšte        - General settings
  └── Tab: Radno vreme  - Working hours + Blocked slots
  └── Tab: Brendiranje  - Branding/customization
```

### Removed/Merged Pages
- ~~`/dashboard/zakazivanja`~~ → Merged into `/dashboard/kalendar`
- ~~`/dashboard/brendiranje`~~ → Merged into `/dashboard/podesavanja` (tab)
- ~~`/dashboard/kalendar/novo`~~ → Replaced with popup dialog

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

---

### Phase 2: Salon Owner Dashboard

**Location:** `/dashboard/*`
**Access:** Authenticated salon owners only

#### 2.1 Dashboard Overview `/dashboard`

**Layout (2 columns on desktop):**
- Left column: Stats cards + Quick actions
- Right column: Upcoming bookings

**Stats Cards:**
| Card | Content | Click Action |
|------|---------|--------------|
| Zakazivanja | Danas: X, Ove nedelje: X | → `/dashboard/kalendar` |
| Klijenti | Ukupno u bazi: X | → `/dashboard/klijenti` |

**Quick Actions (popup dialogs):**
| Action | Behavior |
|--------|----------|
| Novo zakazivanje | Opens booking popup form |
| Dodaj uslugu | Opens service popup form |
| Pregled kalendara | Navigates to `/dashboard/kalendar` |
| Finansijski izveštaj | Navigates to `/dashboard/finansije` |

**Predstojeći termini:**
- Shows next 5 upcoming bookings
- Displays: customer name/phone, service, time, date
- "Svi termini" button → `/dashboard/kalendar`

---

#### 2.2 Calendar & Bookings `/dashboard/kalendar`

**Two Tabs:**

**Tab 1: Kalendar (Calendar View)**
- Weekly calendar (Monday-Sunday)
- Navigation: Previous/Next week, "Danas" button
- Date range displayed in header
- Bookings shown per day with:
  - Time
  - Status badge (color-coded)
  - Customer name/phone
  - Service name
- Today highlighted with accent color
- Click on booking shows details

**Today's Bookings Section (below calendar):**
- List of all bookings for current day
- Each booking shows:
  - Time
  - Customer name/phone
  - Service name
  - Status badge
  - Action buttons

**Tab 2: Evidencija (List View)**
- Filter by status: Svi, Na čekanju, Potvrđeno, Završeno, Otkazano
- Filter by date
- "Poništi" button clears filters
- Table columns: Datum/vreme, Klijent, Usluga, Cena, Status, Akcije

**Booking Status Colors:**
| Status | Serbian | Color |
|--------|---------|-------|
| pending | Na čekanju | Warning (gold) |
| confirmed | Potvrđeno | Success (teal) |
| completed | Završeno | Success (teal) |
| cancelled | Otkazano | Destructive (red) |

**Booking Actions:**
| Action | Icon | Condition | Behavior |
|--------|------|-----------|----------|
| Izmeni | Pencil | pending/confirmed | Opens edit popup |
| Potvrdi | Button | pending only | Changes to confirmed |
| Završi | Button | pending/confirmed | Changes to completed |
| Otkaži | Button | pending/confirmed | Opens AlertDialog confirmation |

**Popup: Novo/Izmeni zakazivanje**
- Service dropdown (active services only)
- Customer phone (required)
- Customer name (optional)
- Date picker
- Time picker
- Service summary (duration, price)
- Buttons: Otkaži, Zakaži termin / Sačuvaj izmene

**AlertDialog: Otkazivanje termina**
- Title: "Otkazivanje termina"
- Warning message
- Buttons: Odustani, Potvrdi (red)

---

#### 2.3 Services `/dashboard/usluge`

**Header:**
- Title: "Usluge"
- "Nova usluga" button → opens popup

**Table:**
| Column | Content |
|--------|---------|
| Naziv | Service name |
| Trajanje | Duration in minutes |
| Cena | Price in RSD (gold color) |
| Status | Toggle: Aktivna/Neaktivna |
| Akcije | Edit (pencil), Delete (trash) |

**Popup: Nova/Izmeni usluga**
- Naziv usluge (required)
- Trajanje u minutima (required, min 15, step 15)
- Cena u RSD (required)
- Buttons: Otkaži, Dodaj / Sačuvaj

**AlertDialog: Brisanje usluge**
- Shows service name
- Warning: "Ova akcija se ne može poništiti"
- Buttons: Odustani, Obriši (red)

---

#### 2.4 Clients `/dashboard/klijenti`

**Header:**
- Title: "Klijenti"
- "Novi klijent" button → opens popup

**Stats Cards:**
| Card | Content |
|------|---------|
| Ukupno klijenata | Total count |
| Ukupno poseta | Sum of all visits |
| Ukupan promet | Total spent (RSD) |

**Search:**
- Input field: "Pretražite po imenu ili broju telefona..."
- "Pretraži" button

**Table:**
| Column | Content |
|--------|---------|
| Telefon | Phone (monospace) |
| Ime | Name or "-" |
| Poseta | Number of visits |
| Potrošeno | Total spent (RSD, gold) |
| Poslednja poseta | Date or "-" |
| Akcije | Edit (pencil), Detalji |

**Popup: Novi/Izmeni klijent**
- Telefon (required)
- Ime (optional)
- Buttons: Otkaži, Dodaj klijenta / Sačuvaj

**Dialog: Detalji klijenta**
- Phone, Name
- Total visits, Total spent
- Booking history (scrollable list)
- Each booking: service, date/time, price, status badge

---

#### 2.5 Finances `/dashboard/finansije`

- Revenue chart
- Transaction table
- Period filters
- Total amounts

---

#### 2.6 Settings `/dashboard/podesavanja`

**Three Tabs:**

**Tab 1: Opšte (General)**
- Naziv salona
- Adresa
- Telefon
- Email
- "Sačuvaj" button

**Tab 2: Radno vreme (Working Hours)**

*Weekly Schedule:*
- All 7 days displayed in compact grid
- Each day shows: Day name, Status (Radi/Ne radi), Hours (od-do)
- Edit button per day → opens dialog

*Dialog: Izmeni radno vreme*
- Day name in title
- Toggle: Radi danas
- If working: Start time, End time
- Buttons: Otkaži, Sačuvaj

*Blocked Slots:*
- List of all blocked time slots
- Each shows: Date, Time range, Reason (if any), Delete button
- "Dodaj blokirani termin" button → opens dialog

*Dialog: Novi blokirani termin*
- Datum (required)
- Vreme od (required)
- Vreme do (required)
- Razlog (optional)
- Buttons: Otkaži, Dodaj

**Tab 3: Brendiranje (Branding)**

*Color Themes:*
- 6 preset themes: Zlatna, Roze, Ljubičasta, Plava, Zelena, Crvena
- Each theme has Light/Dark variant
- Radio button selection

*Preview:*
- Live preview of booking page
- Shows up to 3 services from database
- Updates with theme selection

*Save:*
- "Sačuvaj izmene" button

---

### Phase 3: Public Booking System

**Location:** `/book/[slug]`
**Access:** Public (no authentication required)

| Step | Feature | Description |
|------|---------|-------------|
| 1 | Salon Page | View salon info, logo, banner |
| 2 | Service Selection | Choose from active services |
| 3 | Date Selection | Pick available date (next 14 days) |
| 4 | Time Selection | Pick available time slot |
| 5 | Contact Info | Enter phone (required), name (optional) |
| 6 | Confirmation | View booking details |

**Availability Rules:**
- Respects working hours
- Respects blocked slots
- Respects existing bookings
- Accounts for service duration
- Prevents double-booking

---

## Test Scenarios

### Authentication
- [ ] Salon owner can log in with valid credentials
- [ ] Invalid credentials show error message
- [ ] Logout redirects to login page
- [ ] Session expires correctly
- [ ] Protected routes redirect to login

### Dashboard Overview
- [ ] Stats cards show correct numbers
- [ ] Clicking Zakazivanja → navigates to kalendar
- [ ] Clicking Klijenti → navigates to klijenti
- [ ] "Novo zakazivanje" opens popup form
- [ ] "Dodaj uslugu" opens popup form
- [ ] Upcoming bookings list shows correct data
- [ ] "Svi termini" navigates to kalendar

### Booking Popup (Dashboard)
- [ ] Service dropdown shows active services only
- [ ] Phone field is required
- [ ] Name field is optional
- [ ] Date defaults to today
- [ ] Service summary shows duration and price
- [ ] Submit creates booking
- [ ] Cancel closes popup without saving
- [ ] Edit mode pre-fills all fields
- [ ] Edit mode updates booking on save

### Calendar
- [ ] Weekly view shows correct dates
- [ ] Navigation changes week
- [ ] "Danas" returns to current week
- [ ] Bookings appear on correct days
- [ ] Today is highlighted
- [ ] Status badges show correct colors
- [ ] Today's bookings section shows correct data

### Booking Actions
- [ ] "Potvrdi" changes status to confirmed
- [ ] "Završi" changes status to completed
- [ ] "Otkaži" opens confirmation dialog
- [ ] Confirmation dialog has Odustani/Potvrdi
- [ ] Cancel changes status to cancelled
- [ ] Edit button opens popup with data
- [ ] Edit saves changes correctly

### Evidencija (List View)
- [ ] Table shows all bookings
- [ ] Status filter works
- [ ] Date filter works
- [ ] "Poništi" clears filters
- [ ] Actions work same as calendar view

### Services
- [ ] Table shows all services
- [ ] "Nova usluga" opens popup
- [ ] Create service works
- [ ] Edit button opens popup with data
- [ ] Edit saves changes
- [ ] Delete opens confirmation dialog
- [ ] Delete removes service
- [ ] Status toggle works
- [ ] Inactive services hidden from booking

### Clients
- [ ] Stats cards show correct totals
- [ ] Search by name works
- [ ] Search by phone works
- [ ] "Novi klijent" opens popup
- [ ] Create client works
- [ ] Edit button opens popup with data
- [ ] Edit saves changes
- [ ] "Detalji" opens history dialog
- [ ] History shows all bookings

### Settings - Opšte
- [ ] Form shows current values
- [ ] Save updates salon info
- [ ] Changes reflect on booking page

### Settings - Radno vreme
- [ ] All 7 days displayed
- [ ] Edit day opens dialog
- [ ] Toggle working day works
- [ ] Time inputs work
- [ ] Save updates working hours
- [ ] Blocked slots list shows all
- [ ] Add blocked slot works
- [ ] Delete blocked slot works

### Settings - Brendiranje
- [ ] Theme presets display
- [ ] Light/Dark variants work
- [ ] Preview updates live
- [ ] Save persists theme
- [ ] Booking page reflects theme

### Public Booking
- [ ] Valid slug loads salon
- [ ] Invalid slug shows error
- [ ] Inactive salon shows message
- [ ] Active services displayed
- [ ] Date picker shows 14 days
- [ ] Time slots respect working hours
- [ ] Time slots respect blocked slots
- [ ] Time slots respect bookings
- [ ] Phone required for submit
- [ ] Booking creates successfully
- [ ] Confirmation page shows details
- [ ] Double-booking prevented

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | User login |
| POST | `/api/auth/signout` | User logout |

### Dashboard APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/salon` | Get salon details |
| PUT | `/api/dashboard/salon` | Update salon details |
| PUT | `/api/dashboard/branding` | Update branding |
| POST | `/api/dashboard/upload` | Upload logo/banner |
| GET | `/api/dashboard/services` | List services |
| POST | `/api/dashboard/services` | Create service |
| PUT | `/api/dashboard/services/[id]` | Update service |
| DELETE | `/api/dashboard/services/[id]` | Delete service |
| GET | `/api/dashboard/clients` | List clients |
| POST | `/api/dashboard/clients` | Create client |
| PUT | `/api/dashboard/clients/[id]` | Update client |
| GET | `/api/dashboard/clients/[id]` | Get client details |
| GET | `/api/dashboard/bookings` | List bookings |
| POST | `/api/dashboard/bookings` | Create booking |
| PUT | `/api/dashboard/bookings/[id]` | Update booking (status, service, customer, datetime) |
| DELETE | `/api/dashboard/bookings/[id]` | Cancel booking |
| GET | `/api/dashboard/working-hours` | Get working hours |
| POST | `/api/dashboard/working-hours` | Create working hour |
| PUT | `/api/dashboard/working-hours/[id]` | Update working hour |
| GET | `/api/dashboard/blocked-slots` | List blocked slots |
| POST | `/api/dashboard/blocked-slots` | Create blocked slot |
| DELETE | `/api/dashboard/blocked-slots/[id]` | Delete blocked slot |
| GET | `/api/dashboard/finances` | Financial data |

### Public APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/[slug]` | Salon info + services |
| GET | `/api/public/[slug]/availability` | Available time slots |
| POST | `/api/public/[slug]/book` | Create booking |
| GET | `/api/public/[slug]/booking/[id]` | Get booking details |

---

## Database Schema

### tenants (Salons)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Salon name |
| slug | TEXT | URL slug (unique) |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| address | TEXT | Address |
| description | TEXT | Description |
| logo_url | TEXT | Logo image URL |
| banner_url | TEXT | Banner image URL |
| accent_color | TEXT | Theme accent color |
| background_color | TEXT | Theme background |
| text_color | TEXT | Theme text color |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation date |

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | User email |
| role | TEXT | 'admin' or 'client' |
| tenant_id | UUID | FK to tenants |
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
| created_at | TIMESTAMP | Creation date |

### customers
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| phone | TEXT | Phone number |
| name | TEXT | Customer name |
| created_at | TIMESTAMP | Creation date |

### bookings
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| service_id | UUID | FK to services |
| customer_id | UUID | FK to customers |
| start_datetime | TIMESTAMP | Start time |
| end_datetime | TIMESTAMP | End time |
| status | TEXT | pending/confirmed/completed/cancelled |
| created_at | TIMESTAMP | Creation date |

### working_hours
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| day_of_week | INTEGER | 0-6 (Mon-Sun) |
| start_time | TIME | Opening time |
| end_time | TIME | Closing time |
| is_working | BOOLEAN | Working day |

### blocked_slots
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| date | DATE | Block date |
| start_time | TIME | Start time |
| end_time | TIME | End time |
| reason | TEXT | Optional reason |
| created_at | TIMESTAMP | Creation date |

### financial_entries
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | FK to tenants |
| type | TEXT | income/expense |
| category | TEXT | Category |
| amount | DECIMAL | Amount |
| description | TEXT | Description |
| entry_date | DATE | Entry date |
| booking_id | UUID | FK to bookings |
| created_at | TIMESTAMP | Creation date |

---

## Mobile Responsive Testing

### Screen Sizes to Test
| Device | Width |
|--------|-------|
| iPhone SE | 375px |
| iPhone 12/13 | 390px |
| iPhone 12/13 Pro Max | 428px |
| Samsung Galaxy S21 | 360px |
| iPad Mini | 768px |
| iPad Pro | 1024px |

### Mobile Navigation
- [ ] Menu button on LEFT side of header
- [ ] Menu button opens Sheet (slide from left)
- [ ] Sheet shows full sidebar content
- [ ] Clicking nav item CLOSES menu
- [ ] Logo "Dragica" + slogan in header
- [ ] Header height: 72px

### Mobile Dashboard
- [ ] Stats cards stack vertically
- [ ] Quick actions full width
- [ ] Upcoming bookings scrollable
- [ ] All text readable (min 14px)

### Mobile Calendar
- [ ] Weekly view horizontally scrollable
- [ ] Day columns readable
- [ ] Booking cards fit content
- [ ] Tab switching works

### Mobile Tables (Evidencija, Usluge, Klijenti)
- [ ] Tables horizontally scrollable
- [ ] Column headers visible
- [ ] Action buttons accessible
- [ ] Row height comfortable for touch

### Mobile Popup Forms
- [ ] Dialogs full width on small screens
- [ ] Input fields min 16px font (prevent zoom)
- [ ] Buttons min 44px height (touch target)
- [ ] Keyboard doesn't obscure inputs
- [ ] Select dropdowns work properly

### Mobile Settings
- [ ] Tabs horizontally scrollable
- [ ] Forms full width
- [ ] Working hours grid readable
- [ ] Theme preview fits screen

---

## Localization Notes

- All UI text: Serbian (Latin script)
- Date format: `d. MMM yyyy` (e.g., "4. feb 2026")
- Time format: 24-hour `HH:mm` (e.g., "14:30")
- Day names: Serbian Latin (pon, uto, sre, čet, pet, sub, ned)
- Month names: Serbian Latin (jan, feb, mar, apr, maj, jun, jul, avg, sep, okt, nov, dec)
- Currency: RSD (Serbian Dinar)
- Locale library: `date-fns/locale/sr-Latn`

---

## Known Limitations

1. **No SMS/Email:** Notifications not yet implemented
2. **Single Staff:** Each salon has one staff member only
3. **No Payments:** Online payment not available
4. **No Mobile App:** Web only (responsive)
5. **Serbian Only:** No multi-language support

---

## Planned Features

| Feature | Priority |
|---------|----------|
| SMS notifications | High |
| Email notifications | High |
| Multi-staff support | High |
| Online payments | Medium |
| Analytics dashboard | Medium |
| Client loyalty program | Low |
| Mobile app | Low |
| Multi-language | Low |

---

**Document Version:** 2.0
**Updated by:** Claude Code
**Date:** February 4, 2026
