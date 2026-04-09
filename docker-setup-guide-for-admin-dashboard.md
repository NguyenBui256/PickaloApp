# Docker Setup Guide for ALOBO Admin Dashboard

## Overview

This guide explains how to run the complete ALOBO Booking platform with Docker Compose, including the admin dashboard frontend.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed

## Services

The Docker Compose setup includes 4 services:

1. **PostgreSQL (PostGIS)** - Database on port `5432`
2. **Redis** - Caching on port `6379`
3. **Backend API (FastAPI)** - REST API on port `8000`
4. **Admin Dashboard (React)** - Web interface on port `5173`

## Quick Start

### Start All Services

```bash
docker-compose up -d
```

This will start all services in detached mode (background).

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f admin-dashboard
```

### Stop Services

```bash
docker-compose down
```

## Access Points

Once services are running:

- **Admin Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Development Workflow

### Hot Reload

All services support hot reload during development:

- **Backend**: Code changes in `backend/` directory auto-reload
- **Admin Dashboard**: Code changes in `admin-dashboard/` directory auto-reload

### Database Access

Connect to database:

```bash
docker exec -it alogo-postgres-dev psql -U postgres -d alogo_dev
```

### Rebuild Services

If you need to rebuild a service:

```bash
docker-compose up -d --build admin-dashboard
```

## Troubleshooting

### Port Conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### Database Connection Issues

If backend can't connect to database:

1. Check database is healthy: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Restart services: `docker-compose restart backend`

### Admin Dashboard Issues

If admin dashboard shows blank page or errors:

1. Check backend is running: `curl http://localhost:8000/docs`
2. Check admin dashboard logs: `docker-compose logs admin-dashboard`
3. Verify CORS configuration includes admin dashboard origin

### Network Issues

Services communicate using Docker service names:

- Backend → Database: `postgres:5432`
- Backend → Redis: `redis:6379`
- Admin Dashboard → Backend: `http://backend:8000`

## Production Deployment

For production, use the production Dockerfile target:

```yaml
admin-dashboard:
  build:
    context: ./admin-dashboard
    dockerfile: Dockerfile
    target: production  # Use production stage
  # ... rest of configuration
```

## Environment Variables

### Backend Environment

Set in `backend/.env` or `docker-compose.yml`:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - JWT secret key
- `CORS_ORIGINS` - Allowed frontend origins

### Admin Dashboard Environment

Set in `admin-dashboard/.env.docker`:

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name

## Data Persistence

Database data is persisted in Docker volumes:

- `postgres-data` - PostgreSQL data
- `redis-data` - Redis data

To reset data:

```bash
docker-compose down -v  # Remove volumes
docker-compose up -d     # Start fresh
```
