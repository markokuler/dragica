# Dragica - Quick Start Guide

## URLs

| Environment | URL |
|-------------|-----|
| **Production** | https://dragica.app |
| **Staging** | Vercel Preview (SSO) |
| **Local** | http://localhost:3000 |
| **Repository** | https://github.com/markokuler/dragica |

---

## What's Built

### Core Platform (Phase 1-4)
- Admin Panel - full salon management, CRM, finances
- Salon Dashboard - services, clients, bookings, calendar, finances, settings
- Public Booking - 3-step flow with availability checking
- Branding - custom themes, logos, colors per salon

### Expansion (Phase 5-7)
- Admin expansion (analytics, CRM, promotions, audit, subscriptions)
- Demo system (demo login, daily cron reset)
- 3-environment setup (lokal/staging/production)

---

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 18+ (via nvm)
- Supabase CLI (`npm install -g supabase`)

### Setup

```bash
git clone https://github.com/markokuler/dragica.git
cd dragica
npm install

# Create .env.local (copy from .env.example and update)

supabase start       # Start Docker Supabase
supabase db reset    # Load migrations + seed data
npm run dev          # Start Next.js
```

Open http://localhost:3000

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dragica.local | admin123 |
| Salon Owner | milana@test.local | test1234 |
| Demo Admin | demo-admin@dragica.local | demo1234 |
| Demo Salon | demo-salon@dragica.local | demo1234 |

---

## Quick Test Flow

1. **Landing**: Visit `/` - see demo buttons
2. **Demo Admin**: Click "Demo Admin" -> auto-login -> `/admin`
3. **Admin**: See salon list, create salon (dialog), manage salons
4. **Demo Salon**: Click "Demo Salon" -> auto-login -> `/dashboard`
5. **Dashboard**: See stats, calendar, clients, finances
6. **Booking**: Visit `/book/milana-nails` -> book appointment
7. **Verify**: Check dashboard -> see new booking in calendar

---

## Navigation (Serbian)

### Admin
| Menu | Feature |
|------|---------|
| Saloni | Salon management |
| Finansije | Platform finances |
| Analitika | Analytics |
| Promocije | Coupons |
| Izvestaji | Reports/Export |
| Aktivnost | Audit log |
| Podesavanja | Settings |

### Dashboard
| Menu | Feature |
|------|---------|
| Pregled | Overview |
| Kalendar | Calendar + bookings |
| Usluge | Services |
| Klijenti | Clients CRM |
| Finansije | Finances |
| Podesavanja | Settings (general, hours, branding) |

---

## Deployment

```bash
# Staging
git push origin staging          # Vercel auto-deploy (Preview)

# Production
git checkout main
git merge staging
git push origin main             # Vercel auto-deploy (Production)

# Migrations (if new)
supabase link --project-ref <ref>
supabase db push --dry-run       # ALWAYS dry-run first
supabase db push
```

See `DEPLOY.md` for full deployment guide.

---

## Documentation

| File | Content |
|------|---------|
| README.md | Full project overview |
| QA_DOCUMENTATION.md | QA testing (100+ scenarios) |
| TESTING-PLAN.md | Testing strategy |
| DEPLOY.md | Deployment procedures |
| LOCAL-DEV.md | Local dev environment |
| MIGRATION-WSL2.md | WSL2 migration guide |
