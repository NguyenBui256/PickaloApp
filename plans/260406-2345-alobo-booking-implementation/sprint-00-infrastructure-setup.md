---
title: "Sprint 0: Infrastructure & Setup"
description: "Project initialization, development environment setup, and CI/CD foundation"
status: completed
Completed: 2026-04-07
priority: P1
effort: 8h
tags: [infrastructure, setup, devops]
created: 2026-04-06
---

# Sprint 0: Infrastructure & Setup

## Overview

Establish the foundation for development including repository structure, development environment, database setup, and CI/CD pipeline.

**Priority:** P1 (Critical - blocks all other sprints)
**Current Status:** Completed

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 5: Tech Stack)
- CLAUDE.md: `D:\PTIT\PickaloApp\CLAUDE.md` (Development Commands)

## Key Insights

1. Monolithic FastAPI backend requires clear separation of concerns from day one
2. PostGIS must be installed alongside PostgreSQL for geospatial features
3. React Native Android development needs specific tooling (Android Studio, SDK)
4. Environment variable management is critical for payment API keys

## Requirements

### Functional Requirements

1. **Backend Project Structure**: Create FastAPI project with proper module organization
2. **Database Setup**: PostgreSQL 15+ with PostGIS 3.3+ extension
3. **Frontend Scaffold**: React Native project with Android configuration
4. **Development Tools**: ESLint, Prettier, pytest, alembic configured
5. **Environment Configuration**: .env templates for dev/staging/prod

### Non-Functional Requirements

1. **Python 3.11+** for backend
2. **Node.js 18+** for frontend
3. **Code quality tools** with pre-commit hooks
4. **API Documentation** auto-generated via OpenAPI

## Architecture

### Backend Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   ├── config.py        # Settings, environment variables
│   │   ├── security.py      # JWT, password hashing
│   │   └── database.py      # DB connection, session
│   ├── api/
│   │   ├── deps.py          # Dependencies
│   │   └── v1/
│   │       └── api.py       # API router aggregation
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── services/
│   │   └── __init__.py
│   └── utils/
│       └── __init__.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_main.py
├── alembic/
│   └── env.py
├── .env.example
├── .env.development
├── requirements.txt
└── pyproject.toml
```

### Frontend Directory Structure
```
frontend/
├── src/
│   ├── navigation/
│   │   └── navigator.tsx    # App navigation
│   ├── screens/
│   │   └── __init__.ts
│   ├── components/
│   │   └── __init__.ts
│   ├── services/
│   │   └── api.ts           # API client
│   ├── hooks/
│   │   └── __init__.ts
│   ├── types/
│   │   └── __init__.ts
│   ├── utils/
│   │   └── __init__.ts
│   └── constants/
│       └── __init__.ts
├── android/
├── __tests__/
├── .env.example
├── package.json
├── tsconfig.json
└── App.tsx
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI application entry point |
| `backend/app/core/config.py` | Pydantic settings for configuration |
| `backend/app/core/database.py` | Database session management |
| `backend/requirements.txt` | Python dependencies |
| `backend/alembic.ini` | Alembic configuration |
| `frontend/src/navigation/navigator.tsx` | React Navigation setup |
| `frontend/package.json` | NPM dependencies |
| `.gitignore` | Git ignore rules |
| `docker-compose.yml` | Local development containers |

### Files to Delete

None (new project)

## Implementation Steps

### Step 1: Backend Foundation (2h)

1. Create `backend/` directory structure
2. Initialize Python virtual environment
3. Create `requirements.txt` with:
   - fastapi>=0.109.0
   - uvicorn[standard]>=0.27.0
   - sqlalchemy>=2.0.25
   - alembic>=1.13.0
   - psycopg2-binary>=2.9.9
   - geoalchemy2>=0.14.0
   - pydantic>=2.5.0
   - pydantic-settings>=2.1.0
   - python-jose[cryptography]>=3.3.0
   - passlib[bcrypt]>=1.7.4
   - python-multipart>=0.0.6
   - pytest>=7.4.0
   - pytest-asyncio>=0.23.0
   - httpx>=0.26.0
4. Create `app/core/config.py` with Pydantic Settings
5. Create `app/core/database.py` with SQLAlchemy session
6. Create `app/main.py` with FastAPI app instance
7. Configure CORS for localhost development

### Step 2: Database Setup (2h)

1. Install PostgreSQL 15+ and PostGIS extension
2. Create development database `alobo_dev`
3. Enable PostGIS: `CREATE EXTENSION postgis;`
4. Configure Alembic:
   - Run `alembic init alembic`
   - Configure `alembic.ini` with database URL
   - Set up `alembic/env.py`
5. Create `.env.example` with database URL template
6. Create `.env.development` with local credentials
7. Test database connection from FastAPI

### Step 3: Frontend Foundation (2h)

1. Initialize React Native project:
   ```bash
   npx react-native@latest init ALOBO --pm npm
   ```
2. Configure for Android only:
   - Remove iOS directory
   - Update `package.json` scripts
3. Install navigation dependencies:
   - @react-navigation/native
   - @react-navigation/native-stack
   - @react-navigation/bottom-tabs
4. Install additional dependencies:
   - axios (API client)
   - @react-native-async-storage/async-storage
   - react-native-maps
   - react-native-webview
5. Create basic directory structure
6. Set up TypeScript configuration
7. Create `src/services/api.ts` with axios instance

### Step 4: Development Tools & CI/CD (2h)

1. **Python Tooling**:
   - Configure `pyproject.toml` for black, ruff, mypy
   - Set up pre-commit hooks
2. **JavaScript Tooling**:
   - Configure ESLint with React Native rules
   - Configure Prettier
   - Set up Husky pre-commit hooks
3. **Testing Setup**:
   - Configure `pytest.ini` for backend tests
   - Configure Jest for frontend tests
4. **Docker Compose** (optional but recommended):
   - PostgreSQL + PostGIS service
   - Backend service with hot reload
5. **Git Configuration**:
   - Create `.gitignore` for Python, Node, IDEs
   - Add `.env.example` to git
   - Exclude `.env.development`

## Todo List

- [ ] Create backend directory structure
- [ ] Set up Python virtual environment and install dependencies
- [ ] Create FastAPI app with basic health check endpoint
- [ ] Configure PostgreSQL with PostGIS extension
- [ ] Set up Alembic for database migrations
- [ ] Initialize React Native project for Android
- [ ] Install and configure React Navigation
- [ ] Create API service layer in frontend
- [ ] Configure ESLint, Prettier, black, ruff
- [ ] Set up pre-commit hooks
- [ ] Create docker-compose.yml for local development
- [ ] Verify all services start successfully

## Success Criteria

1. **Backend**: `uvicorn app.main:app --reload` starts without errors
2. **Database**: `psql -c "SELECT PostGIS_Version();"` returns version
3. **Frontend**: `npm start` launches Metro bundler successfully
4. **API Health**: `GET http://localhost:8000/api/v1/health` returns `{"status": "ok"}`
5. **Tests**: `pytest` and `npm test` run with 0 failures
6. **Linting**: Pre-commit hooks run and pass

## Test Scenarios

### Backend Health Check
```bash
# Test 1: Server starts
curl http://localhost:8000/docs | grep "swagger"
# Expected: OpenAPI documentation loads

# Test 2: Health endpoint
curl http://localhost:8000/api/v1/health
# Expected: {"status": "ok", "version": "0.1.0"}

# Test 3: Database connection
pytest tests/test_database.py::test_db_connection
# Expected: Pass
```

### Database Setup
```bash
# Test 4: PostGIS extension
psql -U postgres -d alogo_dev -c "SELECT PostGIS_Version();"
# Expected: Returns version string

# Test 5: Alembic connection
alembic current
# Expected: Shows current revision (base)
```

### Frontend Setup
```bash
# Test 6: Metro bundler starts
npm start
# Expected: Metro runs on port 8081

# Test 7: Android build
npm run android
# Expected: App installs on emulator/device

# Test 8: TypeScript compiles
npx tsc --noEmit
# Expected: No errors
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PostGIS installation fails | High | Use Docker PostGIS image as fallback |
| React Native Android setup issues | Medium | Follow official RN environment setup guide |
| Port conflicts (8000, 8081) | Low | Document port usage, provide alternatives |

## Security Considerations

1. **Environment Variables**: Never commit `.env.development`
2. **Database Credentials**: Use strong passwords in development
3. **API Keys**: Create placeholders for VNPay/Momo in `.env.example`
4. **CORS**: Restrict to known origins in production

## Next Steps

1. Sprint 1: Create database models and migrations
2. Sprint 2: Implement authentication endpoints

## Dependencies

- Blocks: Sprint 1 (Database & Models)
- Blocks: Sprint 10 (React Native Core)
