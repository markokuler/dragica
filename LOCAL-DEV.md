# Dragica - Local Development

Kompletno izolovano lokalno razvojno okruženje sa Docker + Supabase.

## Preduslovi

1. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
2. **Supabase CLI** - Instalacija:
   ```bash
   brew install supabase/tap/supabase
   ```

## Quick Start

```bash
# 1. Pokreni Supabase (Docker containers)
./scripts/dev.sh start

# 2. Resetuj bazu sa test podacima
./scripts/dev.sh reset

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

## Test Podaci

Posle `./scripts/dev.sh reset`:

### Test Saloni

| Salon | URL | Opis |
|-------|-----|------|
| Milana Nails | http://localhost:3000/book/milana-nails | 7 usluga, 5 klijenata, 9 termina |
| Lepota Salon | http://localhost:3000/book/lepota-salon | 6 usluga (frizerski) |

### Test Podaci uključuju:
- ✅ Usluge sa cenama
- ✅ Radno vreme (različito po danu)
- ✅ Klijenti sa imenima i brojevima
- ✅ Termini (pending, confirmed, completed, cancelled)
- ✅ Blokirani slotovi
- ✅ Finansije (prihodi i rashodi)

## Komande

```bash
./scripts/dev.sh start      # Pokreni Supabase
./scripts/dev.sh stop       # Zaustavi Supabase
./scripts/dev.sh reset      # Resetuj bazu + seed
./scripts/dev.sh status     # Prikaži status
./scripts/dev.sh migration <ime>  # Kreiraj migraciju
./scripts/dev.sh push       # Deploy na produkciju
./scripts/dev.sh pull       # Povuci schema sa produkcije
```

## Workflow

### Razvoj nove feature

```bash
# 1. Pokreni lokalno
./scripts/dev.sh start
npm run dev

# 2. Napravi promene u bazi (via Studio ili SQL)
# http://localhost:54323

# 3. Kreiraj migraciju
./scripts/dev.sh migration nova_kolona

# 4. Testiraj
./scripts/dev.sh reset  # resetuj i proveri

# 5. Deploy na produkciju
./scripts/dev.sh push
```

### Sinhronizacija sa produkcijom

```bash
# Povuci najnoviji schema
./scripts/dev.sh pull

# Resetuj lokalnu bazu
./scripts/dev.sh reset
```

## Kreiranje Test Usera

Supabase Studio → Authentication → Add User:

```
Email: admin@test.local
Password: test1234
```

Zatim u SQL Editor:
```sql
INSERT INTO users (id, email, role, tenant_id)
VALUES (
  '<user-id-from-auth>',
  'admin@test.local',
  'client',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  -- milana-nails
);
```

## Troubleshooting

### Docker ne radi
```bash
# Proveri da li je Docker pokrenut
docker info

# Ako nije, pokreni Docker Desktop
```

### Port zauzet
```bash
# Zaustavi sve Supabase kontejnere
supabase stop --no-backup

# Ili promeni portove u supabase/config.toml
```

### Resetovanje svega
```bash
# Potpuno čišćenje
supabase stop --no-backup
docker system prune -a
./scripts/dev.sh start
./scripts/dev.sh reset
```

## Arhitektura

```
┌─────────────────────────────────────────────────────┐
│                    LOCALHOST                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│   ┌──────────────┐      ┌──────────────────────┐   │
│   │   Next.js    │      │   Docker Containers   │   │
│   │   :3000      │─────▶│                       │   │
│   └──────────────┘      │  ┌──────────────────┐ │   │
│                         │  │ PostgreSQL :54322 │ │   │
│   ┌──────────────┐      │  ├──────────────────┤ │   │
│   │   Browser    │      │  │ Auth Server      │ │   │
│   │              │─────▶│  ├──────────────────┤ │   │
│   └──────────────┘      │  │ Storage          │ │   │
│                         │  ├──────────────────┤ │   │
│                         │  │ Studio :54323    │ │   │
│                         │  ├──────────────────┤ │   │
│                         │  │ Inbucket :54324  │ │   │
│                         │  └──────────────────┘ │   │
│                         └──────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   PRODUCTION                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│   ┌──────────────┐      ┌──────────────────────┐   │
│   │   Vercel     │      │   Supabase Cloud     │   │
│   │   dragica.app│─────▶│   (potpuno odvojeno)  │   │
│   └──────────────┘      └──────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Environment Fajlovi

| Fajl | Koristi se za |
|------|---------------|
| `.env.local` | Lokalni development (Supabase Docker) |
| `.env.production` | Produkcija (Vercel) |
| `.env.example` | Template za nove developere |

**Napomena**: `.env.local` ima prioritet nad ostalima u Next.js.
