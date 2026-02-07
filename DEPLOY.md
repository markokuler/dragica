# Dragica - Deployment Guide

## 3-Environment Setup

| Environment | Branch | App Host | Database | Auto-Deploy |
|-------------|--------|----------|----------|-------------|
| **Production** | `main` | Vercel (dragica.app) | Supabase `dakmcfvhsfshkssmeqoy` | Yes |
| **Staging** | `staging` | Vercel Preview (SSO) | Supabase `ammlbwvefnylqvorrilr` | Yes |
| **Local** | any | localhost:3000 | Docker (`supabase start`) | Manual |

---

## Staging Deployment

### App Code
```bash
git checkout staging
# ... make changes ...
git add <files>
git commit -m "description"
git push origin staging
# Vercel auto-deploys Preview
```

### Database Migrations (if new migrations exist)
```bash
# 1. Link to staging
supabase link --project-ref ammlbwvefnylqvorrilr

# 2. Dry-run first (ALWAYS)
SUPABASE_ACCESS_TOKEN=<token> supabase db push --dry-run

# 3. Push migrations
SUPABASE_ACCESS_TOKEN=<token> supabase db push

# 4. Relink to production (ALWAYS do this after)
supabase link --project-ref dakmcfvhsfshkssmeqoy
```

### Seed Data (staging only)
```bash
supabase link --project-ref ammlbwvefnylqvorrilr
SUPABASE_ACCESS_TOKEN=<token> supabase db push --include-seed
supabase link --project-ref dakmcfvhsfshkssmeqoy  # relink
```

---

## Production Deployment

### App Code
```bash
git checkout main
git merge staging          # merge when satisfied with staging
git push origin main       # Vercel auto-deploys Production
```

### Database Migrations (if new migrations exist)
```bash
# 1. Already linked to production (default)
# Verify: check .supabase/.temp/project-ref

# 2. Dry-run first (ALWAYS)
SUPABASE_ACCESS_TOKEN=<token> supabase db push --dry-run

# 3. Push migrations
SUPABASE_ACCESS_TOKEN=<token> supabase db push
```

### CRITICAL RULES
- **NIKADA** ne salji seed data na production
- **NIKADA** ne salji test korisnike na production
- **SAMO** app kod (git push) + schema migracije (supabase db push)
- UVEK `--dry-run` prvo

---

## Vercel Environment Variables

### Production (main branch)
```
NEXT_PUBLIC_SUPABASE_URL=https://dakmcfvhsfshkssmeqoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
NEXT_PUBLIC_APP_URL=https://dragica.app
NEXT_PUBLIC_BASE_DOMAIN=dragica.app
```

### Preview (staging branch)
```
NEXT_PUBLIC_SUPABASE_URL=https://ammlbwvefnylqvorrilr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
NEXT_PUBLIC_APP_URL=https://dragica-web-app-git-staging-markos-projects-bdb2b3bf.vercel.app
NEXT_PUBLIC_BASE_DOMAIN=dragica-web-app-git-staging-markos-projects-bdb2b3bf.vercel.app
DEMO_ADMIN_EMAIL=demo-admin@dragica.local
DEMO_ADMIN_PASSWORD=demo1234
DEMO_OWNER_EMAIL=demo-salon@dragica.local
DEMO_OWNER_PASSWORD=demo1234
CRON_SECRET=staging-cron-secret-dragica
```

Env vars are managed in Vercel Dashboard -> Settings -> Environment Variables.
Production and Preview environments have separate values.

---

## Custom Domain (dragica.app)

Domain is purchased through Vercel, DNS is automatic.
- `dragica.app` -> Production
- `www.dragica.app` -> Redirect to `dragica.app`

---

## URL Structure

| Page | Production | Staging |
|------|------------|---------|
| Landing | dragica.app | staging-preview.vercel.app |
| Login | dragica.app/login | staging-preview.vercel.app/login |
| Admin | dragica.app/admin | staging-preview.vercel.app/admin |
| Dashboard | dragica.app/dashboard | staging-preview.vercel.app/dashboard |
| Booking | dragica.app/book/{slug} | staging-preview.vercel.app/book/{slug} |

---

## Cron Jobs

Defined in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/reset-demo",
    "schedule": "0 3 * * *"
  }]
}
```

- Runs daily at 3 AM UTC
- Resets demo salon data
- Protected by `CRON_SECRET` header

---

## Post-Deploy Checklist

### After Staging Deploy
- [ ] Landing page loads
- [ ] Demo buttons work (admin + salon)
- [ ] Login works with test accounts
- [ ] Admin panel accessible
- [ ] Dashboard accessible
- [ ] Public booking works

### After Production Deploy
- [ ] Landing page loads
- [ ] Login works
- [ ] Admin panel accessible
- [ ] Existing salon data intact
- [ ] Public booking works
- [ ] HTTPS active

---

## Troubleshooting

### Build Failed
1. Check Vercel logs: Deployments -> failed deploy -> View Build Logs
2. Common: missing env vars, TypeScript errors

### Env Vars Not Working
1. Verify target (Production vs Preview) in Vercel dashboard
2. After adding new env vars, push a new commit to trigger fresh deploy

### Migration Errors
1. `uuid_generate_v4()` not found -> Run in SQL Editor:
   ```sql
   ALTER DATABASE postgres SET search_path TO public, extensions;
   ```
2. Always check which project-ref is linked: `cat .supabase/.temp/project-ref`

### Supabase CLI Not Linked
```bash
# Check current link
cat .supabase/.temp/project-ref

# Relink to production (default)
supabase link --project-ref dakmcfvhsfshkssmeqoy

# Relink to staging (temporary, always relink back)
supabase link --project-ref ammlbwvefnylqvorrilr
```
