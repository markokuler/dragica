#!/bin/bash
# ===========================================
# Dragica - Local Development Helper
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Dragica - Local Development${NC}"
    echo -e "${BLUE}========================================${NC}"
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker nije pokrenut. Pokreni Docker Desktop."
        exit 1
    fi
    print_status "Docker je aktivan"
}

# Start Supabase
start_supabase() {
    print_header
    echo ""
    echo "Pokrećem Supabase lokalno..."
    echo ""

    check_docker

    # Start Supabase
    supabase start

    echo ""
    print_status "Supabase pokrenut!"
    echo ""
    echo -e "${BLUE}Dostupni servisi:${NC}"
    echo "  • API:      http://localhost:54321"
    echo "  • Studio:   http://localhost:54323"
    echo "  • Inbucket: http://localhost:54324 (email testing)"
    echo "  • Database: postgresql://postgres:postgres@localhost:54322/postgres"
    echo ""
    echo -e "${YELLOW}Pokreni Next.js:${NC} npm run dev"
}

# Stop Supabase
stop_supabase() {
    echo "Zaustavljam Supabase..."
    supabase stop
    print_status "Supabase zaustavljen"
}

# Reset database (apply migrations + seed)
reset_db() {
    print_header
    echo ""
    echo "Resetujem bazu sa test podacima..."
    echo ""

    supabase db reset

    echo ""
    print_status "Baza resetovana sa seed podacima!"
    echo ""
    echo -e "${BLUE}Test saloni:${NC}"
    echo "  • milana-nails - http://localhost:3000/book/milana-nails"
    echo "  • lepota-salon - http://localhost:3000/book/lepota-salon"
}

# Show status
status() {
    print_header
    echo ""
    supabase status 2>/dev/null || print_warning "Supabase nije pokrenut"
}

# Push schema to production
push_prod() {
    print_warning "OPREZ: Ovo će primeniti promene na PRODUKCIJSKU bazu!"
    echo ""
    read -p "Da li si siguran? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        echo "Povezujem se na produkciju..."
        supabase link --project-ref dakmcfvhsfshkssmeqoy
        echo "Primenjujem migracije..."
        supabase db push
        print_status "Promene primenjene na produkciju!"
    else
        echo "Otkazano."
    fi
}

# Pull schema from production
pull_prod() {
    echo "Povlačim schema sa produkcije..."
    supabase link --project-ref dakmcfvhsfshkssmeqoy
    supabase db pull
    print_status "Schema sinhronizovan sa produkcijom"
}

# Create migration
create_migration() {
    if [ -z "$1" ]; then
        echo "Upotreba: ./scripts/dev.sh migration <ime_migracije>"
        exit 1
    fi

    supabase db diff -f "$1"
    print_status "Migracija kreirana: supabase/migrations/*_$1.sql"
}

# Help
show_help() {
    print_header
    echo ""
    echo "Upotreba: ./scripts/dev.sh <komanda>"
    echo ""
    echo "Komande:"
    echo "  start       Pokreni Supabase lokalno"
    echo "  stop        Zaustavi Supabase"
    echo "  reset       Resetuj bazu + učitaj test podatke"
    echo "  status      Prikaži status servisa"
    echo "  migration   Kreiraj novu migraciju"
    echo "  push        Primeni promene na produkciju"
    echo "  pull        Povuci schema sa produkcije"
    echo ""
    echo "Primeri:"
    echo "  ./scripts/dev.sh start"
    echo "  ./scripts/dev.sh reset"
    echo "  ./scripts/dev.sh migration add_notes_column"
    echo ""
}

# Main
case "${1:-help}" in
    start)
        start_supabase
        ;;
    stop)
        stop_supabase
        ;;
    reset)
        reset_db
        ;;
    status)
        status
        ;;
    migration)
        create_migration "$2"
        ;;
    push)
        push_prod
        ;;
    pull)
        pull_prod
        ;;
    *)
        show_help
        ;;
esac
