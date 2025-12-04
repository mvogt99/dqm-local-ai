# DQM LOCAL AI Scripts

This folder contains utility scripts for managing the DQM LOCAL AI application.

## Quick Reference

| Script | Description | Usage |
|--------|-------------|-------|
| `status.sh` | Check status of all services | `./scripts/status.sh` |
| `start-docker.sh` | Start with Docker Compose | `./scripts/start-docker.sh` |
| `start-dev.sh` | Start for development | `./scripts/start-dev.sh` |
| `stop-services.sh` | Stop all services | `./scripts/stop-services.sh` |

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8001 | http://localhost:8001 |
| Swagger Docs | 8001 | http://localhost:8001/docs |
| ReDoc | 8001 | http://localhost:8001/redoc |
| Frontend UI | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |

## Scripts

### status.sh

Check the status of all DQM LOCAL AI services.

```bash
./scripts/status.sh
```

**Output includes:**
- Backend API health check
- Frontend availability
- PostgreSQL container status
- Docker container list
- Quick access URLs

### start-docker.sh

Start all services using Docker Compose (recommended for production-like setup).

```bash
./scripts/start-docker.sh
```

**What it does:**
1. Builds Docker images (if needed)
2. Starts PostgreSQL, Backend, and Frontend containers
3. Waits for services to be ready
4. Shows status

**Prerequisites:**
- Docker installed
- Docker Compose installed

### start-dev.sh

Start services for local development with hot-reload.

```bash
./scripts/start-dev.sh
```

**What it does:**
1. Starts PostgreSQL container (if not running)
2. Starts Backend with uvicorn --reload
3. Starts Frontend with Vite dev server
4. Keeps running until Ctrl+C

**Prerequisites:**
- Docker (for PostgreSQL)
- Python 3.10+ with dependencies
- Node.js 18+ (for frontend)

### stop-services.sh

Stop all running services.

```bash
./scripts/stop-services.sh
```

**What it does:**
1. Stops Docker Compose services
2. Kills any development processes (uvicorn, vite)

## Troubleshooting

### Backend not starting

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check backend logs:
   ```bash
   docker logs dqm-local-ai
   ```

3. Verify database connection:
   ```bash
   docker exec dqm-postgres pg_isready -U dqm_user -d northwind
   ```

### Frontend not accessible

1. Check if frontend container is running:
   ```bash
   docker ps | grep frontend
   ```

2. Check frontend logs:
   ```bash
   docker logs dqm-local-ai-frontend
   ```

3. For development mode, ensure npm dependencies are installed:
   ```bash
   cd frontend && npm install
   ```

### Port conflicts

If ports are already in use:

```bash
# Find what's using port 8001
lsof -i :8001

# Find what's using port 3001
lsof -i :3001

# Kill process using a port
kill -9 $(lsof -t -i :8001)
```

## Making Scripts Executable

After cloning the repository:

```bash
chmod +x scripts/*.sh
```

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `LOCAL_AI_URL` - RTX 5090 AI endpoint (for AI analysis)
- `LOCAL_AI_MODEL` - Model name for AI analysis
