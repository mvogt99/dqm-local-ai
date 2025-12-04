#!/bin/bash
# start-docker.sh - Start all services using Docker Compose
# Usage: ./scripts/start-docker.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  DQM LOCAL AI - Starting Docker Services"
echo "=============================================="
echo ""

cd "$PROJECT_DIR"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi

# Build and start services
echo "Building and starting services..."
if docker compose version &> /dev/null 2>&1; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check status
echo ""
"$SCRIPT_DIR/status.sh"

echo ""
echo "=============================================="
echo "  Services Started!"
echo "=============================================="
echo ""
echo "  Backend API:  http://localhost:8001"
echo "  Swagger Docs: http://localhost:8001/docs"
echo "  Frontend UI:  http://localhost:3001"
echo ""
