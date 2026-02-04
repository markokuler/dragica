# Dragica - SaaS Nail Salon Platform

Multi-tenant SaaS platform for nail salons with online booking, CRM, and business management.

## Live Demo

- **Application:** https://dragica-web-app.vercel.app
- **Repository:** https://github.com/markokuler/dragica

## Features

### Admin Panel
- Manage all salons from a central dashboard
- Create, edit, activate/deactivate salons
- View all tenant data

### Salon Owner Dashboard
- **Services**: Create and manage salon services with pricing
- **Clients**: CRM with contact info, notes, and booking history
- **Bookings**: View, create, edit bookings with status management
- **Calendar**: Visual monthly calendar with booking indicators
- **Finances**: Revenue tracking and reporting
- **Working Hours**: Configure weekly schedule
- **Blocked Slots**: Block specific times (holidays, breaks)
- **Branding**: Customize public booking page (logo, colors, themes)

### Public Booking System
- 3-step booking flow (service → date/time → contact)
- Real-time availability checking
- Respects working hours and blocked slots
- Mobile-responsive design
- Customizable branding per salon

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (for logos/banners)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel + Supabase
- **Language**: Serbian (Latin script)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/markokuler/dragica.git
cd dragica
npm install
```

2. **Set up Supabase**

- Create a new project at [supabase.com](https://supabase.com)
- Run the SQL schema from `supabase-schema.sql` in the SQL Editor
- Create a storage bucket called `salon-assets` with public access

3. **Configure environment variables**

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App Config (for local development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
```

**For production (Vercel)**, set these environment variables:
- `NEXT_PUBLIC_APP_URL` = `https://dragica-web-app.vercel.app`
- `NEXT_PUBLIC_BASE_DOMAIN` = `dragica-web-app.vercel.app`

4. **Create admin user**

In Supabase Dashboard:
- Go to Authentication → Users → Add user
- Create a user with email/password
- Then run this SQL (replace with actual user ID):

```sql
INSERT INTO users (id, email, role)
VALUES ('user-id-from-auth', 'admin@example.com', 'admin');
```

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
dragica/
├── app/
│   ├── admin/                 # Admin panel
│   ├── dashboard/             # Salon owner dashboard
│   │   ├── brendiranje/       # Branding settings
│   │   ├── finansije/         # Finances
│   │   ├── kalendar/          # Calendar view
│   │   ├── klijenti/          # Clients CRM
│   │   ├── podesavanja/       # Settings (hours, blocked slots)
│   │   ├── usluge/            # Services
│   │   └── zakazivanja/       # Bookings
│   ├── book/[slug]/           # Public booking pages
│   ├── login/                 # Login page
│   └── api/
│       ├── admin/             # Admin API routes
│       ├── dashboard/         # Dashboard API routes
│       └── public/            # Public booking API routes
│
├── components/ui/             # shadcn/ui components
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── auth.ts                # Auth utilities
│   └── utils.ts               # General utilities
│
├── middleware.ts              # Subdomain handling
├── supabase-schema.sql        # Database schema
└── QA_DOCUMENTATION.md        # QA testing guide
```

## Development Phases

### ✅ Phase 1: Admin Panel (Complete)
- Project setup and infrastructure
- Supabase integration with RLS
- Admin authentication
- Salon CRUD operations

### ✅ Phase 2: Salon Dashboard (Complete)
- Dashboard layout with Serbian navigation
- Services management
- Clients CRM
- Bookings management
- Calendar view
- Working hours configuration
- Blocked slots management
- Financial tracking

### ✅ Phase 3: Public Booking (Complete)
- Public booking page with 3-step flow
- Availability calculation
- Working hours enforcement
- Blocked slots enforcement
- Booking confirmation

### ✅ Phase 4: Branding (Complete)
- Logo and banner upload
- Custom colors and presets
- Button styles and themes
- Welcome message
- Live preview

### 📋 Phase 5: Notifications (Planned)
- SMS booking confirmations
- Email notifications
- Appointment reminders

### 📋 Phase 6: Analytics (Planned)
- Booking trends
- Revenue reports
- Popular services

## API Routes

### Dashboard APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/dashboard/salon` | Salon details |
| PUT | `/api/dashboard/branding` | Branding settings |
| POST | `/api/dashboard/upload` | File upload |
| CRUD | `/api/dashboard/services` | Services |
| CRUD | `/api/dashboard/clients` | Clients |
| CRUD | `/api/dashboard/bookings` | Bookings |
| GET/PUT | `/api/dashboard/working-hours` | Working hours |
| CRUD | `/api/dashboard/blocked-slots` | Blocked slots |
| GET | `/api/dashboard/finances` | Financial data |
| GET | `/api/dashboard/stats` | Dashboard stats |

### Public APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/[slug]` | Salon info + services |
| GET | `/api/public/[slug]/availability` | Available time slots |
| POST | `/api/public/[slug]/book` | Create booking |

## Database Schema

Key tables:
- **tenants**: Salon information and branding
- **users**: Admin and salon owner accounts
- **services**: Services with pricing
- **clients**: Customer CRM data
- **bookings**: Appointments
- **working_hours**: Weekly schedule
- **blocked_slots**: Blocked time periods

See `supabase-schema.sql` for complete schema.

## Deployment

### Vercel (Automatic)

The project auto-deploys on push to `main`:
1. Push changes to GitHub
2. Vercel builds and deploys automatically
3. Environment variables configured in Vercel dashboard

### Manual Deploy

```bash
vercel --prod
```

## Documentation

- **QA_DOCUMENTATION.md**: Complete QA testing guide with test scenarios
- **supabase-schema.sql**: Database schema and RLS policies

## License

Proprietary - All rights reserved
