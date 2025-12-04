#!/bin/bash
# start-dev.sh - Start services for local development (without full Docker)
# Usage: ./scripts/start-dev.sh
#
# Prerequisites:
# - PostgreSQL running (via Docker or locally)
# - Python 3.10+ with dependencies installed
# - Node.js 18+ (for frontend)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  DQM LOCAL AI - Development Mode"
echo "=============================================="
echo ""

cd "$PROJECT_DIR"

# Start PostgreSQL if not running
echo "=== Step 1: Starting PostgreSQL ==="
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^dqm-postgres$"; then
    echo "PostgreSQL container already running"
else
    echo "Starting PostgreSQL container..."
    if docker compose version &> /dev/null 2>&1; then
        docker compose up -d postgres
    else
        docker-compose up -d postgres
    fi
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
fi
echo ""

# Start Backend
echo "=== Step 2: Starting Backend API ==="
echo "Starting FastAPI on port 8001..."

# Find Python
PYTHON_CMD=""
if [ -f "$PROJECT_DIR/../../../hybrid-ai-windows/.venv-linux/bin/python" ]; then
    PYTHON_CMD="$PROJECT_DIR/../../../hybrid-ai-windows/.venv-linux/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "ERROR: Python not found"
    exit 1
fi

cd "$PROJECT_DIR/backend"
PYTHONPATH=. $PYTHON_CMD -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
cd "$PROJECT_DIR"
echo ""

# Wait for backend
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 1
done
echo ""

# Start Frontend (optional)
echo "=== Step 3: Starting Frontend ==="
if [ -d "$PROJECT_DIR/frontend" ] && [ -f "$PROJECT_DIR/frontend/package.json" ]; then
    cd "$PROJECT_DIR/frontend"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi

    echo "Starting Vite dev server on port 3001..."
    npm run dev -- --port 3001 &
    FRONTEND_PID=$!
    echo "Frontend started (PID: $FRONTEND_PID)"
    cd "$PROJECT_DIR"
else
    echo "Frontend not configured for development mode"
fi
echo ""

echo "=============================================="
echo "  Development Services Started!"
echo "=============================================="
echo ""
echo "  Backend API:  http://localhost:8001"
echo "  Swagger Docs: http://localhost:8001/docs"
echo "  Frontend UI:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
