#!/bin/bash
# ===========================================
# Dragica - Ubuntu Setup Script
# ===========================================
# Pokreni sa: chmod +x ubuntu-setup.sh && ./ubuntu-setup.sh

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

# Check if running on Ubuntu
check_ubuntu() {
    if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
        print_warning "Ovaj script je napravljen za Ubuntu. Nastavljam..."
    fi
}

# Update system
update_system() {
    print_header "1/7 - Ažuriranje sistema"
    sudo apt update && sudo apt upgrade -y
    print_status "Sistem ažuriran"
}

# Install basic tools
install_basics() {
    print_header "2/7 - Osnovni alati"
    sudo apt install -y curl wget git build-essential
    print_status "Git verzija: $(git --version)"
}

# Install Node.js via nvm
install_nodejs() {
    print_header "3/7 - Node.js (via nvm)"

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

        print_status "Node.js instaliran: $(node --version)"
        print_status "npm instaliran: $(npm --version)"
    fi
}

# Install Docker
install_docker() {
    print_header "4/7 - Docker"

    if command -v docker &> /dev/null; then
        print_warning "Docker već instaliran: $(docker --version)"
    else
        # Install Docker
        sudo apt install -y docker.io docker-compose

        # Add user to docker group
        sudo usermod -aG docker $USER

        # Enable Docker service
        sudo systemctl enable docker
        sudo systemctl start docker

        print_status "Docker instaliran"
        print_warning "VAŽNO: Moraš se ODJAVITI i PRIJAVITI ponovo da bi Docker radio bez sudo!"
    fi
}

# Install Supabase CLI
install_supabase() {
    print_header "5/7 - Supabase CLI"

    if command -v supabase &> /dev/null; then
        print_warning "Supabase CLI već instaliran: $(supabase --version)"
    else
        npm install -g supabase
        print_status "Supabase CLI instaliran: $(supabase --version)"
    fi
}

# Install VS Code
install_vscode() {
    print_header "6/7 - Visual Studio Code"

    if command -v code &> /dev/null; then
        print_warning "VS Code već instaliran"
    else
        # Add Microsoft repo
        wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
        sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
        sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
        rm -f packages.microsoft.gpg

        # Install
        sudo apt update
        sudo apt install -y code

        print_status "VS Code instaliran"
    fi
}

# Install fonts
install_fonts() {
    print_header "7/7 - Fontovi (DM Serif Display, Source Sans 3)"

    mkdir -p ~/.local/share/fonts
    cd ~/.local/share/fonts

    # DM Serif Display
    if [ ! -f "DMSerifDisplay-Regular.ttf" ]; then
        wget -q "https://github.com/google/fonts/raw/main/ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf"
        print_status "DM Serif Display instaliran"
    else
        print_warning "DM Serif Display već postoji"
    fi

    # Source Sans 3
    if [ ! -f "SourceSans3-Regular.ttf" ]; then
        wget -q "https://github.com/google/fonts/raw/main/ofl/sourcesans3/SourceSans3%5Bwght%5D.ttf" -O "SourceSans3-Variable.ttf"
        print_status "Source Sans 3 instaliran"
    else
        print_warning "Source Sans 3 već postoji"
    fi

    # Refresh font cache
    fc-cache -f -v > /dev/null 2>&1

    cd - > /dev/null
}

# Clone and setup project
setup_project() {
    print_header "Kloniranje Dragica projekta"

    cd ~

    if [ -d "dragica" ]; then
        print_warning "Folder ~/dragica već postoji"
    else
        git clone https://github.com/markokuler/dragica.git
        print_status "Projekat kloniran u ~/dragica"
    fi

    cd ~/dragica

    # Install dependencies
    print_status "Instaliram npm dependencies..."
    npm install

    print_status "Dependencies instalirane"
}

# Create .env.local template
create_env_template() {
    print_header "Environment fajl"

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

# Infobip - disabled for local dev
INFOBIP_BASE_URL=""
INFOBIP_API_KEY=""
INFOBIP_WHATSAPP_SENDER=""
INFOBIP_VIBER_SENDER=""
EOF
        print_status ".env.local kreiran za lokalni development"
    fi
}

# Summary
print_summary() {
    print_header "INSTALACIJA ZAVRŠENA"

    echo -e "${GREEN}Instalirano:${NC}"
    echo "  • Git"
    echo "  • Node.js + npm (via nvm)"
    echo "  • Docker"
    echo "  • Supabase CLI"
    echo "  • VS Code"
    echo "  • Fontovi (DM Serif Display, Source Sans 3)"
    echo "  • Dragica projekat (~/dragica)"
    echo ""

    echo -e "${YELLOW}SLEDEĆI KORACI:${NC}"
    echo ""
    echo "  1. ODJAVI SE i PRIJAVI PONOVO (za Docker permisije)"
    echo ""
    echo "  2. Pokreni lokalni development:"
    echo "     cd ~/dragica"
    echo "     ./scripts/dev.sh start"
    echo "     ./scripts/dev.sh reset"
    echo "     npm run dev"
    echo ""
    echo "  3. Otvori u browseru:"
    echo "     • App:    http://localhost:3000"
    echo "     • Studio: http://localhost:54323"
    echo ""

    echo -e "${BLUE}Za produkciju, dodaj prave kredencijale u .env.local${NC}"
    echo ""
}

# Main
main() {
    print_header "Dragica - Ubuntu Setup"
    echo "Ovaj script će instalirati sve potrebno za development."
    echo ""
    read -p "Nastavi? (y/n): " confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Otkazano."
        exit 0
    fi

    check_ubuntu
    update_system
    install_basics
    install_nodejs
    install_docker
    install_supabase
    install_vscode
    install_fonts
    setup_project
    create_env_template
    print_summary
}

main "$@"
