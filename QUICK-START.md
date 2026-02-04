# Dragica - Quick Start Guide

## Live Application

**Production:** https://dragica-web-app.vercel.app
**Repository:** https://github.com/markokuler/dragica

---

## What's Built

### ✅ Phase 1: Admin Panel
- Salon management (create, edit, delete, toggle active)
- User management

### ✅ Phase 2: Salon Owner Dashboard
- Services management
- Clients CRM with booking history
- Bookings management with status updates
- Calendar view
- Working hours configuration
- Blocked slots management
- Financial tracking

### ✅ Phase 3: Public Booking
- 3-step booking flow
- Real-time availability checking
- Mobile responsive design

### ✅ Phase 4: Branding
- Logo and banner upload
- Custom colors and presets
- Button styles and themes
- Welcome message

---

## Local Development Setup

### Step 1: Clone & Install

```bash
git clone https://github.com/markokuler/dragica.git
cd dragica
npm install
```

### Step 2: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Go to **SQL Editor** and run `supabase-schema.sql`
3. Create storage bucket `salon-assets` (public access)
4. Go to **Project Settings** → **API** and copy credentials

### Step 3: Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Create Admin User

In Supabase Dashboard:
1. Go to **Authentication** → **Users** → **Add user**
2. Create user with email/password
3. Copy the user ID
4. Run in SQL Editor:

```sql
INSERT INTO users (id, email, role)
VALUES ('paste-user-id-here', 'your@email.com', 'admin');
```

### Step 5: Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Application URLs

| URL | Description |
|-----|-------------|
| `/login` | Login page |
| `/admin` | Admin panel (admin users) |
| `/dashboard` | Salon dashboard (salon owners) |
| `/dashboard/brendiranje` | Branding settings |
| `/book/[slug]` | Public booking page |

---

## Quick Test Flow

1. **Admin**: Log in → Create a salon
2. **Salon Owner**: Log in as the owner → Add services → Set working hours
3. **Customize**: Go to Brendiranje → Upload logo → Pick colors
4. **Public**: Visit `/book/[salon-slug]` → Book an appointment
5. **Verify**: Check dashboard → See the new booking

---

## Dashboard Navigation (Serbian)

| Menu Item | Feature |
|-----------|---------|
| Pregled | Dashboard overview |
| Kalendar | Calendar view |
| Usluge | Services |
| Klijenti | Clients CRM |
| Zakazivanja | Bookings |
| Finansije | Finances |
| Brendiranje | Branding |
| Podešavanja | Settings (hours, blocked slots) |

---

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production
npm run test     # Run tests
```

---

## Documentation

- **README.md** - Full documentation
- **QA_DOCUMENTATION.md** - QA testing guide (80+ test scenarios)
- **supabase-schema.sql** - Database schema

---

## Deployment

Automatic deployment via Vercel:
1. Push to `main` branch
2. Vercel auto-builds and deploys
3. Live at https://dragica-web-app.vercel.app

---

**Status:** All 4 phases complete!
