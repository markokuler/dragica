# Dragica - SaaS Nail Salon CRM

Multi-tenant SaaS platform for nail salons with CRM, online booking, and financial tracking.

## Features

- **Multi-tenant Architecture**: Each salon gets their own subdomain
- **Admin Panel**: God-mode access to manage all salons
- **Salon Dashboard**: Full-featured management for salon owners
- **Public Booking**: SMS OTP-verified booking system for customers
- **Financial Tracking**: Income/expense management and reporting
- **Serbian UI**: All interfaces in Serbian (Latin script)
- **Black & Pink Theme**: Custom metallic pink and black color scheme

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL via Supabase
- **Styling**: Tailwind CSS + shadcn/ui
- **SMS**: Twilio
- **Testing**: Jest + React Testing Library + Playwright
- **Deployment**: Vercel + Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Twilio account

### Installation

1. **Clone and install dependencies**

```bash
cd dragica-web-app
npm install
```

2. **Set up Supabase**

- Create a new project at [supabase.com](https://supabase.com)
- Run the SQL schema from `supabase-schema.sql` in the SQL Editor
- Get your project URL and keys

3. **Set up Twilio**

- Create account at [twilio.com](https://twilio.com)
- Get a phone number
- Get your Account SID and Auth Token

4. **Configure environment variables**

Copy `.env.local` and fill in your credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
```

5. **Create admin user**

Run this SQL in Supabase SQL Editor:

```sql
-- Create admin user (replace with your email/password)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@example.com', crypt('your-password', gen_salt('bf')), NOW());

-- Get the user ID from the auth.users table, then:
INSERT INTO users (id, email, role)
VALUES ('user-id-from-above', 'admin@example.com', 'admin');
```

6. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to login.

## Testing

### Unit & Integration Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Run All Tests

```bash
npm run test:all
```

## Project Structure

```
dragica-web-app/
├── app/
│   ├── admin/              # Admin panel (god mode)
│   ├── dashboard/          # Salon owner dashboard
│   ├── login/              # Login page
│   ├── api/                # API routes
│   │   ├── admin/
│   │   ├── auth/
│   │   └── ...
│   └── [tenant]/           # Dynamic tenant booking pages
│
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── admin/              # Admin components
│   ├── dashboard/          # Dashboard components
│   ├── booking/            # Booking components
│   └── shared/             # Shared components
│
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── auth.ts             # Auth utilities
│   ├── tenant.ts           # Tenant utilities
│   ├── twilio.ts           # SMS functionality
│   └── utils.ts            # General utilities
│
├── types/
│   └── database.ts         # Database type definitions
│
├── __tests__/              # Unit & integration tests
├── e2e/                    # E2E tests
│
├── middleware.ts           # Tenant detection middleware
├── supabase-schema.sql     # Database schema
├── TESTING-PLAN.md         # Comprehensive testing plan
└── README.md
```

## Development Phases

### ✅ Phase 1: Foundation (Completed)

- [x] Project setup with Next.js + TypeScript
- [x] Supabase integration
- [x] Tailwind + shadcn/ui setup
- [x] Database schema
- [x] Authentication system
- [x] Admin panel layout
- [x] Create salon functionality
- [x] Login page
- [x] Testing infrastructure

### 🚧 Phase 2: Salon Dashboard (In Progress)

- [ ] Dashboard layout
- [ ] Services management
- [ ] Working hours configuration
- [ ] Blocked slots management
- [ ] Customer database (CRM)
- [ ] Bookings management
- [ ] Financial tracking
- [ ] Reports & analytics

### 📋 Phase 3: Public Booking (Planned)

- [ ] Tenant detection middleware
- [ ] Public booking page
- [ ] Service selection
- [ ] Date & time picker
- [ ] Availability calculation
- [ ] SMS OTP system
- [ ] Booking confirmation

### 📋 Phase 4: Polish & Launch (Planned)

- [ ] UI/UX refinements
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment

## Database Schema

See `supabase-schema.sql` for the complete schema.

### Key Tables:

- **tenants**: Salon information
- **users**: Admin and salon owner accounts
- **services**: Services offered by salons
- **working_hours**: Operating hours
- **blocked_slots**: Unavailable time slots
- **customers**: Customer database (CRM)
- **bookings**: Appointment bookings
- **financial_entries**: Income and expenses

## API Routes

### Authentication
- `POST /api/auth/signout` - Sign out user

### Admin
- `POST /api/admin/salons` - Create new salon
- `GET /api/admin/salons` - List all salons
- `PUT /api/admin/salons/:id` - Update salon
- `DELETE /api/admin/salons/:id` - Delete salon

### Services (coming soon)
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

## Testing Strategy

See `TESTING-PLAN.md` for comprehensive testing documentation.

### Coverage Goals
- Unit tests: 80%+
- Integration tests: 100% for API routes
- E2E tests: All critical user flows

### Test for Each Feature
Every feature includes:
- ✅ Unit tests for utilities
- ✅ Component tests for UI
- ✅ Integration tests for APIs
- ✅ E2E tests for user flows
- ✅ Error handling tests
- ✅ Security tests

## Multi-Tenant Architecture

### Subdomain-based Routing

Each salon gets a unique subdomain:
- Admin panel: `dragica.vercel.app/admin`
- Salon dashboard: `dragica.vercel.app/dashboard`
- Public booking: `milana.dragica.vercel.app`

### Data Isolation

- Row-level security (RLS) in Supabase
- All queries filtered by `tenant_id`
- Middleware validates tenant access
- Admin has override capability

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved

## Support

For setup help or questions:
1. Check this README
2. Review `TESTING-PLAN.md`
3. Check Supabase documentation
4. Contact the development team
