# Dragica - Local Development

Kompletno izolovano lokalno razvojno okruzenje sa Docker + Supabase.

## Preduslovi

1. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
2. **Supabase CLI** - Instalacija:
   ```bash
   npm install -g supabase
   ```
3. **Node.js 18+** - via nvm

## Quick Start

```bash
# 1. Pokreni Supabase (Docker containers)
supabase start

# 2. Resetuj bazu sa test podacima
supabase db reset

# 3. Pokreni Next.js
npm run dev
```

## Dostupni Servisi

| Servis | URL | Opis |
|--------|-----|------|
| **App** | http://localhost:3000 | Next.js aplikacija |
| **Supabase Studio** | http://localhost:54323 | GUI za bazu |
| **Inbucket** | http://localhost:54324 | Email testing |
| **API** | http://localhost:54321 | Supabase API |
| **Database** | localhost:54322 | PostgreSQL direktno |

## Test Nalozi

Posle `supabase db reset`:

| Nalog | Email | Lozinka | Uloga |
|-------|-------|---------|-------|
| Admin | admin@dragica.local | admin123 | admin |
| Salon Owner | milana@test.local | test1234 | client (Milana Nails) |
| Demo Admin | demo-admin@dragica.local | demo1234 | admin (is_demo) |
| Demo Salon | demo-salon@dragica.local | demo1234 | client (is_demo) |

## Test Saloni

| Salon | Booking URL | Opis |
|-------|-------------|------|
| Milana Nails | /book/milana-nails | 7 usluga, 5 klijenata, 9+ termina |
| Lepota Salon | /book/lepota-salon | 6 usluga (frizerski) |

### Test podaci ukljucuju:
- Usluge sa cenama i razlicitim trajanjima
- Radno vreme (razlicito po danu, vikend slobodan)
- Klijenti sa imenima, brojevima, beleškama, notification_channel
- Termini (pending, confirmed, completed, cancelled, noshow)
- Blokirani slotovi
- Finansije: prihodi (booking, products, tips, other) + rashodi (supplies, rent, utilities, salaries, marketing, other)
- Demo korisnici sa is_demo=true flag

## Komande

```bash
supabase start            # Pokreni Docker Supabase containers
supabase stop             # Zaustavi containers
supabase db reset         # Resetuj bazu (migrations + seed)
supabase status           # Prikazi status i URL-ove
npm run dev               # Pokreni Next.js dev server
npm run build             # Production build (provera gresaka)
```

## Workflow

### Razvoj nove feature

```bash
# 1. Pokreni lokalno
supabase start
npm run dev

# 2. Napravi promene (kod + baza)

# 3. Ako menjas schema, kreiraj migraciju
supabase migration new <ime_migracije>

# 4. Testiraj
supabase db reset   # resetuj i proveri sa seed podacima

# 5. Push na staging
git checkout staging
git add <files>
git commit -m "description"
git push origin staging
```

### Sinhronizacija sa production schema

```bash
# Povuci najnoviji schema sa production-a
supabase link --project-ref dakmcfvhsfshkssmeqoy
supabase db pull

# Resetuj lokalnu bazu
supabase db reset
```

## Environment Fajlovi

| Fajl | Koristi se za |
|------|---------------|
| `.env.local` | Lokalni development (Docker Supabase) |
| `.env.example` | Template za nove developere |

`.env.local` vrednosti (Docker defaults):
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_DOMAIN="localhost"
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG...demo-anon-key"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG...demo-service-role-key"
DEMO_ADMIN_EMAIL="demo-admin@dragica.local"
DEMO_ADMIN_PASSWORD="demo1234"
DEMO_OWNER_EMAIL="demo-salon@dragica.local"
DEMO_OWNER_PASSWORD="demo1234"
CRON_SECRET="local-cron-secret"
```

## Arhitektura

```
+-----------------------------------------------------+
|                    LOCALHOST                          |
+-----------------------------------------------------+
|                                                      |
|   +-------------+      +----------------------+     |
|   |  Next.js    |      |  Docker Containers   |     |
|   |  :3000      |----->|                      |     |
|   +-------------+      |  +----------------+  |     |
|                         |  | PostgreSQL     |  |     |
|   +-------------+      |  | :54322         |  |     |
|   |  Browser    |      |  +----------------+  |     |
|   |             |----->|  | Auth Server    |  |     |
|   +-------------+      |  +----------------+  |     |
|                         |  | Storage        |  |     |
|                         |  +----------------+  |     |
|                         |  | Studio :54323  |  |     |
|                         |  +----------------+  |     |
|                         |  | Inbucket :54324|  |     |
|                         |  +----------------+  |     |
|                         +----------------------+     |
+-----------------------------------------------------+

+-----------------------------------------------------+
|                    STAGING                            |
+-----------------------------------------------------+
|                                                      |
|   +-------------------+   +----------------------+  |
|   | Vercel Preview    |   | Supabase Cloud       |  |
|   | (SSO protected)   |-->| ammlbwvefnylqvorrilr |  |
|   +-------------------+   +----------------------+  |
|                                                      |
+-----------------------------------------------------+

+-----------------------------------------------------+
|                   PRODUCTION                         |
+-----------------------------------------------------+
|                                                      |
|   +-------------------+   +----------------------+  |
|   | Vercel            |   | Supabase Cloud       |  |
|   | dragica.app       |-->| dakmcfvhsfshkssmeqoy |  |
|   +-------------------+   +----------------------+  |
|                                                      |
+-----------------------------------------------------+
```

## Troubleshooting

### Docker ne radi
```bash
docker info          # Proveri da li Docker Desktop radi
docker ps            # Lista aktivnih kontejnera
```

### Port zauzet
```bash
supabase stop --no-backup    # Zaustavi sve Supabase kontejnere
npx kill-port 3000           # Oslobodi port 3000
```

### Resetovanje svega
```bash
supabase stop --no-backup
docker system prune -a
supabase start
supabase db reset
```

### Seed greske
- `uuid_generate_v4()` not found: Docker Supabase ima extensions u path-u po defaultu
- UNIQUE constraint na phone: ne koristiti '' za vise korisnika u auth.users
- GoTrue zahteva da sve varchar kolone budu '' ne NULL
