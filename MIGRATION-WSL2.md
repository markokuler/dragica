# Migracija na Windows WSL2

Ovaj fajl sadrži sve potrebno za migraciju sa Mac-a na Windows + WSL2.

---

## KREDENCIJALI (sačuvaj ovo!)

### Lokalni development (.env.local)
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_DOMAIN="localhost"
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
INFOBIP_BASE_URL=""
INFOBIP_API_KEY=""
INFOBIP_WHATSAPP_SENDER=""
INFOBIP_VIBER_SENDER=""
```

### Produkcija (.env.production)
```bash
NEXT_PUBLIC_APP_URL="https://dragica.app"
NEXT_PUBLIC_BASE_DOMAIN="dragica.app"
NEXT_PUBLIC_SUPABASE_URL="https://dakmcfvhsfshkssmeqoy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRha21jZnZoc2ZzaGtzc21lcW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzcyNTMsImV4cCI6MjA4NTcxMzI1M30.K-nVPMNbW-j03WkWOSRqjGSQng3xAEMYTNF9a52Usac"
```

### Online nalozi
| Servis | URL | Napomena |
|--------|-----|----------|
| GitHub | github.com/markokuler/dragica | Kod |
| Vercel | vercel.com | Hosting |
| Supabase | supabase.com | Database |
| Infobip | portal.infobip.com | Notifikacije |

---

## FAZA 1: Windows Setup (30 min)

### 1.1 Instaliraj WSL2
PowerShell (Admin):
```powershell
wsl --install -d Ubuntu
```
Restartuj. Kreiraj Linux username/password.

### 1.2 Instaliraj Docker Desktop
- Preuzmi: https://www.docker.com/products/docker-desktop/
- Tokom instalacije: ✅ Use WSL 2
- Posle: Settings → Resources → WSL Integration → ✅ Ubuntu

### 1.3 Instaliraj VS Code
- Preuzmi: https://code.visualstudio.com/
- Instaliraj extension: "WSL"

---

## FAZA 2: Ubuntu Setup (15 min)

Otvori Ubuntu terminal i pokreni:

```bash
# Ažuriraj sistem
sudo apt update && sudo apt upgrade -y

# Instaliraj osnovne alate
sudo apt install -y curl wget git build-essential

# Instaliraj Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts

# Instaliraj Supabase CLI
npm install -g supabase

# Proveri verzije
node --version
npm --version
docker --version
supabase --version
```

---

## FAZA 3: Kloniraj projekat (5 min)

```bash
cd ~
git clone https://github.com/markokuler/dragica.git
cd dragica
npm install
```

---

## FAZA 4: Podesi environment (5 min)

```bash
# Kreiraj .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_DOMAIN="localhost"
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
INFOBIP_BASE_URL=""
INFOBIP_API_KEY=""
INFOBIP_WHATSAPP_SENDER=""
INFOBIP_VIBER_SENDER=""
EOF
```

---

## FAZA 5: Testiraj (10 min)

```bash
cd ~/dragica

# Pokreni Supabase
./scripts/dev.sh start

# Učitaj test podatke
./scripts/dev.sh reset

# Pokreni app
npm run dev
```

### Proveri u Windows browseru:
- [ ] http://localhost:3000 - App radi
- [ ] http://localhost:54323 - Supabase Studio radi
- [ ] http://localhost:3000/book/milana-nails - Booking radi

---

## FAZA 6: VS Code setup

```bash
cd ~/dragica
code .
```

VS Code će se otvoriti na Windows-u, povezan na WSL2.

---

## FAZA 7: Potvrda i čišćenje Mac-a

Kad sve radi na Windows-u, javi Claude-u:

> "Migracija završena, obriši projekat sa Mac-a"

---

## Troubleshooting

### Docker ne radi
```bash
# Proveri da li Docker Desktop radi na Windows-u
docker ps
```
Ako ne radi, otvori Docker Desktop app na Windows-u.

### Port zauzet
```bash
sudo lsof -i :3000
# ili
npx kill-port 3000
```

### Supabase spor prvi put
Normalno - preuzima Docker images (~2GB). Sačekaj.
