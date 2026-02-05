# 🚀 Dragica.app - Deployment Guide

## Pre-Deploy Checklist

### 1. Supabase Production Setup
- [ ] Kreiraj novi Supabase projekat na [supabase.com](https://supabase.com)
- [ ] Kopiraj SQL šemu iz development projekta (Settings → Database → Backup)
- [ ] Kreiraj Storage bucket `salon-assets` (public)
- [ ] Kopiraj API ključeve (Settings → API)

### 2. Environment Variables za Vercel
Dodaj ove varijable u Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-key
SUPABASE_SERVICE_ROLE_KEY=tvoj-service-role-key
NEXT_PUBLIC_APP_URL=https://dragica.app
NEXT_PUBLIC_BASE_DOMAIN=dragica.app
```

Opciono (za notifikacije):
```
INFOBIP_BASE_URL=https://xxxxx.api.infobip.com
INFOBIP_API_KEY=tvoj-infobip-key
INFOBIP_WHATSAPP_SENDER=447860088970
INFOBIP_VIBER_SENDER=IBSelfServe
```

---

## Deployment na Vercel

### Korak 1: Povezivanje sa GitHub
1. Idi na [vercel.com](https://vercel.com)
2. Sign in sa GitHub nalogom
3. "Add New..." → "Project"
4. Izaberi `dragica-web-app` repository
5. Framework: Next.js (automatski detektovan)

### Korak 2: Environment Variables
1. Pre klika na "Deploy", dodaj Environment Variables
2. Kopiraj vrednosti iz gornje sekcije
3. Klikni "Deploy"

### Korak 3: Custom Domain (dragica.app)
1. Po završetku deploya, idi u Settings → Domains
2. Klikni "Add"
3. Unesi `dragica.app`
4. Pošto si kupio domen preko Vercel-a, DNS je automatski konfigurisan!
5. Dodaj i `www.dragica.app` → redirect na `dragica.app`

---

## URL Struktura u Produkciji

| Stranica | URL |
|----------|-----|
| Landing | https://dragica.app |
| Login | https://dragica.app/login |
| Admin | https://dragica.app/admin |
| Dashboard | https://dragica.app/dashboard |
| **Booking** | https://dragica.app/book/{slug} |
| Potvrda | https://dragica.app/book/{slug}/potvrda |
| Izmena | https://dragica.app/book/{slug}/izmena/{token} |

---

## Post-Deploy Testiranje

### Kritični Testovi
- [ ] Landing page učitava se
- [ ] Login radi (koristi test kredencijale)
- [ ] Admin panel dostupan
- [ ] Dashboard salon vidljiv
- [ ] Public booking: `/book/test-salon` radi
- [ ] Booking flow: izaberi uslugu → datum → vreme → potvrdi
- [ ] HTTPS aktivan (zeleni lokot)

### Test Scenario (End-to-End)
1. Otvori `https://dragica.app/admin`
2. Login kao admin
3. Kreiraj test salon sa slug-om `test-salon`
4. Dodaj uslugu (npr. "Manikir", 30min, 1500 RSD)
5. Otvori `https://dragica.app/book/test-salon`
6. Zakaži termin
7. Proveri da li se prikazuje na Dashboard → Kalendar

---

## Automatski Deploys

Vercel automatski deploya svaki push na `main` branch:
```
git add .
git commit -m "Update feature X"
git push origin main
```

Za preview deploys (feature branches):
```
git checkout -b feature/nova-funkcionalnost
# ... changes ...
git push origin feature/nova-funkcionalnost
```
Vercel kreira preview URL: `dragica-web-app-xyz.vercel.app`

---

## Troubleshooting

### Build Failed
1. Proveri Vercel logs: Deployments → klikni na failed deploy → View Build Logs
2. Često uzroci: missing env variables, TypeScript greške

### 500 Error na API
1. Vercel Functions logs: Settings → Functions → Logs
2. Supabase logs: Database → Logs

### Domain Issues
1. DNS propagacija može trajati do 48h (retko)
2. Proveri: Settings → Domains → zelena kvačica

---

## Kontakti za Pomoć
- Vercel Support: help.vercel.com
- Supabase Discord: discord.supabase.com
