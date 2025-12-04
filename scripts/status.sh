#!/bin/bash
# status.sh - Check status of all DQM LOCAL AI services
# Usage: ./scripts/status.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  DQM LOCAL AI - Service Status Check"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    local name="$1"
    local url="$2"
    local port="$3"

    printf "%-20s" "$name (port $port):"

    if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
        echo -e " ${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e " ${RED}NOT RUNNING${NC}"
        return 1
    fi
}

check_docker_container() {
    local name="$1"
    printf "%-20s" "$name:"

    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${name}$"; then
        echo -e " ${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e " ${RED}NOT RUNNING${NC}"
        return 1
    fi
}

echo "=== API Services ==="
check_service "Backend API" "http://localhost:8001/health" "8001" || true
check_service "Frontend UI" "http://localhost:3001" "3001" || true
echo ""

echo "=== Database ==="
if command -v docker &> /dev/null; then
    check_docker_container "dqm-postgres" || true
else
    echo "Docker not available - cannot check PostgreSQL container"
fi

# Check if PostgreSQL is accessible
printf "%-20s" "PostgreSQL (5432):"
if pg_isready -h localhost -p 5432 -U dqm_user -d northwind > /dev/null 2>&1; then
    echo -e " ${GREEN}ACCESSIBLE${NC}"
elif docker exec dqm-postgres pg_isready -U dqm_user -d northwind > /dev/null 2>&1; then
    echo -e " ${GREEN}ACCESSIBLE (via Docker)${NC}"
else
    echo -e " ${YELLOW}NOT ACCESSIBLE${NC}"
fi
echo ""

echo "=== Docker Containers ==="
if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "dqm|NAMES" || echo "No DQM containers running"
else
    echo "Docker not available"
fi
echo ""

echo "=== Quick Access URLs ==="
echo "  Backend API:  http://localhost:8001"
echo "  Swagger Docs: http://localhost:8001/docs"
echo "  Frontend UI:  http://localhost:3001"
echo ""

echo "=== Health Check Details ==="
echo "Backend:"
curl -s http://localhost:8001/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "  Not available"
echo ""
