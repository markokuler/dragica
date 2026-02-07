#!/bin/bash
# ===========================================
# Dragica - WSL2 Setup Script
# ===========================================
# Za Windows + WSL2 + Docker Desktop
# Pokreni sa: chmod +x wsl2-setup.sh && ./wsl2-setup.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running in WSL
check_wsl() {
    if ! grep -q "microsoft" /proc/version 2>/dev/null; then
        print_error "Ovaj script je za WSL2. Pokreni ga u Ubuntu terminalu."
        exit 1
    fi
    print_status "WSL2 detektovan"
}

# Check Docker Desktop
check_docker() {
    print_header "Provera Docker Desktop"

    if command -v docker &> /dev/null && docker ps &> /dev/null; then
        print_status "Docker Desktop radi: $(docker --version)"
    else
        print_error "Docker nije dostupan!"
        echo ""
        echo "Proveri:"
        echo "  1. Da li je Docker Desktop pokrenut na Windows-u?"
        echo "  2. Settings → Resources → WSL Integration → Ubuntu uključen?"
        echo ""
        exit 1
    fi
}

# Update system
update_system() {
    print_header "1/5 - Ažuriranje sistema"
    sudo apt update && sudo apt upgrade -y
    print_status "Sistem ažuriran"
}

# Install basic tools
install_basics() {
    print_header "2/5 - Osnovni alati"
    sudo apt install -y curl wget git build-essential
    print_status "Git: $(git --version)"
}

# Install Node.js via nvm
install_nodejs() {
    print_header "3/5 - Node.js (via nvm)"

    if command -v node &> /dev/null; then
        print_warning "Node.js već instaliran: $(node --version)"
    else
        # Install nvm
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

        # Load nvm
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

        # Install Node.js LTS
        nvm install --lts
        nvm use --lts
        nvm alias default node

        print_status "Node.js: $(node --version)"
        print_status "npm: $(npm --version)"
    fi
}

# Install Supabase CLI
install_supabase() {
    print_header "4/5 - Supabase CLI"

    # Load nvm if needed
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    if command -v supabase &> /dev/null; then
        print_warning "Supabase CLI već instaliran: $(supabase --version)"
    else
        npm install -g supabase
        print_status "Supabase CLI: $(supabase --version)"
    fi
}

# Clone and setup project
setup_project() {
    print_header "5/5 - Dragica projekat"

    cd ~

    if [ -d "dragica" ]; then
        print_warning "~/dragica već postoji, preskačem kloniranje"
        cd ~/dragica
        git pull origin main
    else
        git clone https://github.com/markokuler/dragica.git
        cd ~/dragica
    fi

    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    print_status "Instaliram dependencies..."
    npm install

    print_status "Projekat spreman"
}

# Create .env.local
create_env() {
    if [ -f ~/dragica/.env.local ]; then
        print_warning ".env.local već postoji"
    else
        cat > ~/dragica/.env.local << 'EOF'
# ===========================================
# LOCAL DEVELOPMENT - Supabase Local (Docker)
# ===========================================
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
        print_status ".env.local kreiran"
    fi
}

# Summary
print_summary() {
    print_header "INSTALACIJA ZAVRŠENA"

    echo -e "${GREEN}Instalirano:${NC}"
    echo "  • Git, curl, wget"
    echo "  • Node.js + npm (via nvm)"
    echo "  • Supabase CLI"
    echo "  • Dragica projekat (~/dragica)"
    echo ""
    echo -e "${YELLOW}Docker koristi Docker Desktop sa Windows-a${NC}"
    echo ""

    echo -e "${BLUE}SLEDEĆI KORACI:${NC}"
    echo ""
    echo "  1. Pokreni Supabase:"
    echo "     cd ~/dragica"
    echo "     ./scripts/dev.sh start"
    echo "     ./scripts/dev.sh reset"
    echo ""
    echo "  2. Pokreni app:"
    echo "     npm run dev"
    echo ""
    echo "  3. Otvori u Windows browseru:"
    echo "     http://localhost:3000"
    echo "     http://localhost:54323 (Studio)"
    echo ""
    echo "  4. VS Code:"
    echo "     code ."
    echo ""
}

# Main
main() {
    print_header "Dragica - WSL2 Setup"
    echo "Ovaj script instalira sve potrebno za development u WSL2."
    echo ""
    echo -e "${YELLOW}Preduslovi:${NC}"
    echo "  • Docker Desktop instaliran i pokrenut na Windows-u"
    echo "  • WSL Integration uključen u Docker Desktop settings"
    echo ""
    read -p "Nastavi? (y/n): " confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Otkazano."
        exit 0
    fi

    check_wsl
    check_docker
    update_system
    install_basics
    install_nodejs
    install_supabase
    setup_project
    create_env
    print_summary
}

main "$@"
