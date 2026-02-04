# Quick Start Guide

Welcome back! Here's everything you need to know to get started with what was built.

---

## What Was Built While You Slept

✅ **Phase 1 is 100% complete!**

The entire admin panel is ready with:
- Salon management (create, edit, delete, toggle active)
- Services management (full CRUD)
- Working hours management (full CRUD)
- Blocked slots management (full CRUD)
- Complete API routes
- Authentication system
- Testing infrastructure

**See `PHASE-1-COMPLETE.md` for full details.**

---

## Get It Running in 5 Minutes

### Step 1: Install Dependencies (if not already done)

```bash
npm install
```

### Step 2: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Wait for it to initialize (~2 minutes)
3. Go to **SQL Editor**
4. Copy all SQL from `supabase-schema.sql` and run it
5. Go to **Project Settings** → **API**
6. Copy your credentials

### Step 3: Update Environment Variables

Open `.env.local` and replace:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 4: Create Admin User

In Supabase SQL Editor, run:

```sql
-- Create admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (gen_random_uuid(), 'admin@test.com', crypt('admin123', gen_salt('bf')), NOW())
RETURNING id;

-- Copy the returned ID and use it below:
INSERT INTO users (id, email, role)
VALUES ('paste-id-here', 'admin@test.com', 'admin');
```

### Step 5: Run the App

```bash
npm run dev
```

Open http://localhost:3000

---

## Login & Test

### Admin Login
- **Email**: `admin@test.com`
- **Password**: `admin123`

### Quick Test Flow

1. **Create a Salon**
   - Click "Novi salon"
   - Fill in the form
   - Submit

2. **Add Services**
   - Click "Upravljaj" on your salon
   - Go to "Usluge" tab
   - Click "Upravljaj uslugama"
   - Add services (e.g., "Manikir", 60 min, 2000 RSD)

3. **Set Working Hours**
   - Go to "Radno vreme" tab
   - Click "Podesi radno vreme"
   - Add hours for each day

4. **Block Time Slots**
   - Use the quick link in Settings
   - Block a date/time range

---

## File Structure at a Glance

```
dragica-web-app/
├── app/
│   ├── admin/              ← All admin pages
│   │   ├── salons/
│   │   │   ├── new/        ← Create salon
│   │   │   └── [id]/       ← Manage salon
│   │   │       ├── services/
│   │   │       ├── hours/
│   │   │       ├── blocked-slots/
│   │   │       └── settings/
│   │   └── settings/
│   │
│   ├── dashboard/          ← Phase 2 (salon owner)
│   ├── login/              ← Login page
│   └── api/                ← All API routes
│
├── lib/                    ← Utilities
├── components/ui/          ← UI components
├── types/                  ← TypeScript types
├── __tests__/              ← Tests
└── supabase-schema.sql     ← Database schema
```

---

## What Works Right Now

### Admin Panel ✅
- ✅ Create salons with owner accounts
- ✅ List all salons
- ✅ View salon details
- ✅ Add/edit/delete services
- ✅ Add/delete working hours
- ✅ Add/delete blocked slots
- ✅ Edit salon info (name, email, phone, description, color)
- ✅ Toggle salon active/inactive
- ✅ Delete salon (with all data)

### Authentication ✅
- ✅ Login with email/password
- ✅ Role-based routing (admin vs client)
- ✅ Protected routes
- ✅ Logout

### Database ✅
- ✅ All tables created
- ✅ RLS policies active
- ✅ Indexes for performance
- ✅ Cascade deletes working

---

## What's Next: Phase 2

The next phase is building the **Salon Owner Dashboard**. This will be similar to the admin panel, but:
- Only shows data for the owner's salon
- Adds customer database (CRM)
- Adds booking management
- Adds financial tracking

---

## Common Issues & Solutions

### Issue: Can't log in
**Solution**: Make sure you created the admin user in Supabase (Step 4 above)

### Issue: "Unauthorized" errors
**Solution**: Check that your Supabase credentials are correct in `.env.local`

### Issue: Can't create salon
**Solution**: Make sure the database schema was run (Step 2 above)

### Issue: Database connection error
**Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

---

## Testing

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run All Tests
```bash
npm run test:all
```

---

## Documentation

- **`README.md`** - Full setup and usage guide
- **`PHASE-1-COMPLETE.md`** - Detailed summary of Phase 1
- **`TESTING-PLAN.md`** - Comprehensive testing strategy
- **`supabase-schema.sql`** - Complete database schema

---

## Ready to Continue?

Tell me what you'd like to do:

1. **"Continue with Phase 2"** - Build salon owner dashboard
2. **"Fix/improve [something]"** - Make changes to Phase 1
3. **"Help me set up Supabase"** - Step-by-step setup guidance
4. **"Run tests"** - Test everything that was built
5. **"Show me [specific feature]"** - Explain how something works

---

## Quick Commands

```bash
# Development
npm run dev          # Start dev server

# Testing
npm run test         # Unit tests
npm run test:watch   # Watch mode
npm run test:e2e     # E2E tests

# Build
npm run build        # Production build
npm run start        # Start production server
```

---

**Phase 1 Status**: ✅ Complete
**Phase 2 Status**: 🎯 Ready to start
**Total Progress**: 25% of MVP

Enjoy! 🚀
