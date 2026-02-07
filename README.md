# Dragica - SaaS Platform za Salone Lepote

Multi-tenant SaaS platforma za salone lepote (noktići, frizeri, kozmetika) sa online zakazivanjem, CRM-om i upravljanjem poslovanja. Srpsko tržište.

## URLs

| Okruženje | URL | Branch |
|-----------|-----|--------|
| **Production** | https://dragica.app | `main` |
| **Staging** | https://dragica-web-app-git-staging-markos-projects-bdb2b3bf.vercel.app | `staging` |
| **Lokal** | http://localhost:3000 | (bilo koji) |

**Repository:** https://github.com/markokuler/dragica

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL via Supabase (RLS enabled)
- **Auth**: Supabase Auth (email/password + auth sync trigger)
- **Storage**: Supabase Storage (salon-assets bucket)
- **Styling**: Tailwind CSS 4 + shadcn/ui (16 components)
- **Deployment**: Vercel (auto-deploy) + Supabase Cloud
- **Notifications**: Infobip (WhatsApp, Viber, SMS) - planned
- **Language**: Serbian (Latin script)
- **Branding**: Dark grey (#181920) + Gold (#CDA661), font Poppins

## Features

### Landing Page
- Prezentacija platforme
- Demo dugmad (Admin demo / Salon demo)
- Demo login sistem sa `is_demo` zaštitom
- Daily cron reset demo podataka (`/api/cron/reset-demo`)

### Admin Panel (`/admin/*`)
- **Salon Management**: CRUD, aktivacija/deaktivacija, import
- **Salon Detail**: Pregled, CRM (kontakti), uplate, statistika, podešavanja
- **Finansije**: Platform-level prihodi i rashodi
- **Analitika**: Statistike po salonu
- **Promocije**: Kuponi i popusti
- **Pretplate**: Upravljanje subscription planovima
- **Podešavanja**: Nalog, lozinka, app podešavanja
- **Aktivnost**: Audit log
- **Izveštaji**: Export podataka

### Salon Owner Dashboard (`/dashboard/*`)
- **Pregled**: Stat kartice, brze akcije (popup), predstojeći termini
- **Kalendar**: Nedeljni prikaz + evidencija (lista) + novo zakazivanje (popup)
- **Usluge**: CRUD sa cenama i statusom
- **Klijenti**: CRM sa istorijom poseta, beleškama, pretragom
- **Finansije**: Prihodi/rashodi sa grafikonom, kategorije, filteri
- **Podešavanja**: Opšte info, radno vreme, blokirani slotovi, brendiranje

### Public Booking (`/book/[slug]`)
- 3-step booking flow (usluga → datum/vreme → kontakt)
- Real-time provera dostupnosti
- Poštuje radno vreme i blokirane slotove
- Responsive design
- Custom branding po salonu (boje, logo, teme)
- Potvrda zakazivanja (`/potvrda`)
- Upravljanje terminom (`/izmena/[token]`)

### Auth System
- Email/password login sa role-based routing
- `on_auth_user_created` trigger (auto-sync auth → public.users)
- `/api/auth/role` endpoint (server-side, bypasses RLS)
- Demo login endpoint (`/api/auth/demo-login`)
- Middleware za subdomain handling

## Project Structure

```
dragica/
├── app/
│   ├── page.tsx                    # Landing page + demo buttons
│   ├── login/                      # Login page
│   ├── setup/                      # Initial setup
│   ├── admin/                      # Admin panel (10 pages)
│   │   ├── page.tsx               # Admin dashboard
│   │   ├── saloni/                # Salon management
│   │   │   ├── page.tsx          # Lista salona + novi salon dialog
│   │   │   ├── novi/             # Novi salon form (full page)
│   │   │   └── [id]/            # Salon detail (5 tabs + sub-pages)
│   │   ├── finansije/            # Platform finansije
│   │   ├── analitika/            # Analitika
│   │   ├── promocije/            # Kuponi/popusti
│   │   ├── izvestaji/            # Izveštaji/export
│   │   ├── aktivnost/            # Audit log
│   │   ├── podesavanja/          # Admin podešavanja
│   │   └── settings/             # App settings
│   ├── dashboard/                  # Salon owner (6 pages)
│   │   ├── page.tsx              # Pregled
│   │   ├── kalendar/             # Kalendar + evidencija
│   │   ├── usluge/               # Usluge
│   │   ├── klijenti/             # Klijenti CRM
│   │   ├── finansije/            # Finansije
│   │   └── podesavanja/          # Settings (3 tabs)
│   ├── book/[slug]/                # Public booking (3 pages)
│   └── api/                        # 48+ API routes
│       ├── auth/                  # Auth (callback, signout, role, demo-login)
│       ├── cron/                  # Cron jobs (reset-demo)
│       ├── admin/                 # Admin APIs (salons, stats, finances, etc.)
│       ├── dashboard/             # Dashboard APIs
│       └── public/                # Public booking APIs
├── components/ui/                   # 16 shadcn/ui components
├── lib/
│   ├── supabase/                  # Supabase clients (client, server, admin)
│   ├── infobip/                   # Infobip notification client
│   ├── otp/                       # OTP store
│   ├── auth.ts                    # Auth utilities
│   ├── tenant.ts                  # Tenant detection
│   ├── phone-utils.ts             # Phone formatting
│   ├── demo-data.ts               # Demo data generator
│   └── utils.ts                   # General utilities
├── supabase/
│   ├── migrations/                # 11 migration files
│   ├── seed.sql                   # Test/demo data
│   └── config.toml                # Supabase CLI config
├── scripts/                        # Dev scripts (setup-demo, dev.sh)
├── types/database.ts               # TypeScript DB types
├── middleware.ts                    # Subdomain routing
└── vercel.json                     # Cron job config
```

## Database Schema

11 migracija, ključne tabele:

| Tabela | Opis |
|--------|------|
| `tenants` | Saloni sa branding, slug, kontakt |
| `users` | Admin/client korisnici sa `is_demo`, `full_name` |
| `services` | Usluge sa cenama i trajanjem |
| `customers` | Klijenti sa `notes`, `notification_channel` |
| `bookings` | Termini (status: pending/confirmed/completed/cancelled/noshow) |
| `working_hours` | Radno vreme po danu |
| `blocked_slots` | Blokirani termini |
| `financial_entries` | Finansijski zapisi (income/expense, kategorije) |
| `subscription_plans` | Planovi pretplate |
| `subscriptions` | Aktivne pretplate |
| `payments` | Istorija plaćanja |
| `coupons` | Promotivni kuponi |
| `platform_settings` | Globalna podešavanja |

## Environments

### 3-Tier Setup

| | Lokal | Staging | Production |
|---|---|---|---|
| **Branch** | bilo koji | `staging` | `main` |
| **App URL** | localhost:3000 | Vercel Preview | dragica.app |
| **Database** | Docker (supabase start) | Supabase Cloud `ammlbwvefnylqvorrilr` | Supabase Cloud `dakmcfvhsfshkssmeqoy` |
| **Deploy** | Manual (npm run dev) | Auto (git push staging) | Auto (git push main) |
| **Data** | seed.sql (db reset) | seed.sql (db push --include-seed) | Real + demo |
| **Access** | Developer only | SSO protected | Public |

### Local Development

```bash
# Prerequisites: Docker Desktop, Supabase CLI, Node.js 18+

# 1. Start Supabase
supabase start

# 2. Reset database with seed data
supabase db reset

# 3. Start dev server
npm run dev

# Test accounts:
# Admin: admin@dragica.local / admin123
# Salon: milana@test.local / test1234
# Demo Admin: demo-admin@dragica.local / demo1234
# Demo Salon: demo-salon@dragica.local / demo1234
```

### Deployment

```bash
# Staging
git checkout staging
git push origin staging              # Vercel auto-deploy (Preview)
# If new migrations:
supabase link --project-ref ammlbwvefnylqvorrilr
supabase db push --dry-run           # Always dry-run first
supabase db push
supabase link --project-ref dakmcfvhsfshkssmeqoy  # Relink to production

# Production
git checkout main && git merge staging
git push origin main                 # Vercel auto-deploy (Production)
# If new migrations:
supabase link --project-ref dakmcfvhsfshkssmeqoy
supabase db push --dry-run
supabase db push
```

## Development Phases

### Phase 1: Admin Panel
### Phase 2: Salon Dashboard
### Phase 3: Public Booking
### Phase 4: Branding
### Phase 5: Admin Expansion (analitika, CRM, finansije, promocije)
### Phase 6: Demo System (demo login, cron reset, is_demo flags)
### Phase 7: 3-Environment Setup (lokal/staging/production)

**Status:** Phase 1-7 complete. Phase 8+ planned.

### Planned Features
| Feature | Priority |
|---------|----------|
| SMS/WhatsApp/Viber notifikacije (Infobip) | High |
| Multi-staff podrška | High |
| Online plaćanja | Medium |
| Napredna analitika | Medium |
| Client loyalty program | Low |
| Mobile app (React Native) | Low |
| Multi-language support | Low |

## Documentation

| Fajl | Sadržaj |
|------|---------|
| `README.md` | Ovaj fajl - pregled projekta |
| `QA_DOCUMENTATION.md` | QA testiranje (80+ scenarija) |
| `TESTING-PLAN.md` | Testing strategija (Jest, Playwright) |
| `DEPLOY.md` | Deployment procedura |
| `LOCAL-DEV.md` | Lokalno razvojno okruženje |
| `QUICK-START.md` | Quick start guide |
| `MIGRATION-WSL2.md` | Migracija na Windows/WSL2 |

## License

Proprietary - All rights reserved
