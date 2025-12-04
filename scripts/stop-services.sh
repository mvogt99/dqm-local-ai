#!/bin/bash
# stop-services.sh - Stop all DQM LOCAL AI services
# Usage: ./scripts/stop-services.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  DQM LOCAL AI - Stopping Services"
echo "=============================================="
echo ""

cd "$PROJECT_DIR"

# Stop Docker containers
echo "=== Stopping Docker Containers ==="
if command -v docker &> /dev/null; then
    if docker compose version &> /dev/null 2>&1; then
        docker compose down
    else
        docker-compose down 2>/dev/null || true
    fi
    echo "Docker containers stopped"
else
    echo "Docker not available"
fi
echo ""

# Kill any running uvicorn processes for this project
echo "=== Stopping Development Processes ==="
pkill -f "uvicorn app.main:app.*8001" 2>/dev/null && echo "Backend process stopped" || echo "No backend process found"
pkill -f "vite.*3001" 2>/dev/null && echo "Frontend process stopped" || echo "No frontend process found"
echo ""

echo "=============================================="
echo "  All Services Stopped"
echo "=============================================="
