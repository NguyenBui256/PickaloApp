# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PickAlo** is a sports facility booking platform connecting venue owners (Merchants) and players (Users) in Hanoi, Vietnam.

**User Personas:**
- **Users**: Find venues, book slots, pay online, find opponents/teammates
- **Merchants**: Register venues, manage schedules, approve bookings, manage services
- **Admin**: Dashboard, user management, content moderation

## Tech Stack

- **Frontend**: React Native (Android)
- **Backend**: Python FastAPI (Monolithic architecture)
- **Database**: PostgreSQL + PostGIS (for geospatial queries)
- **Maps**: Leaflet JS + OpenStreetMap API
- **Payment**: VNPay/Momo/QR transfer

## Development Commands

### Backend (FastAPI)
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload

# Run tests
pytest

# Run single test
pytest tests/test_specific.py::test_name

# Database migration
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

### Database (PostgreSQL + PostGIS)
```bash
# Connect to database
psql -U username -d database_name

# Run SQL file
psql -U username -d database_name -f file.sql

# Check PostGIS version
SELECT PostGIS_Version();
```

### Frontend (React Native)
```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android emulator
npm run android

# Run tests
npm test
```

## Architecture

### Monolithic Backend Structure
```
app/
├── api/           # API route handlers
├── models/        # SQLAlchemy database models
├── schemas/       # Pydantic schemas (request/response)
├── services/      # Business logic layer
├── core/          # Configuration, security, database
└── utils/         # Helper functions
```

### Key Design Patterns
- **Repository Pattern**: Encapsulate data access behind interfaces
- **Service Layer**: Business logic separated from route handlers
- **Dependency Injection**: Use FastAPI's Depends() for dependencies

## Pricing Logic

**Formula:** `Total = (BasePrice × TimeSlotFactor) + ServiceFee`

| Time Slot | Factor | Notes |
|-----------|--------|-------|
| 05:00 - 16:00 | 1.0 | Off-peak |
| 16:00 - 22:00 | 1.5 | Peak hours |
| Weekends | +20% | Surcharge |
| Holidays | Additional | Per merchant setting |

## Project Rules

### File Conventions
- **Naming**: kebab-case with descriptive, meaningful names
- **Size Limit**: Under 200 lines per file (split when exceeded)
- **Principles**: YAGNI, KISS, DRY

### Workflow
1. **Planning**: Use `planner` agent to create implementation plan in `./plans/`
2. **Research**: Use `researcher` agents in parallel for technical topics
3. **Implementation**: Write real code (no mocking/simulation)
4. **Testing**: Use `tester` agent, ensure all tests pass
5. **Review**: Use `code-reviewer` agent after implementation
6. **Documentation**: Update `./docs/` via `docs-manager` agent

### Skills to Activate
- `docs-seeker`: For exploring latest documentation
- `ai-multimodal`: For image/video/document analysis
- `sequential-thinking` + `debug`: For debugging
- `code-reviewer`: After every implementation

### Pre-commit Rules
- Run linting
- Run tests (never ignore failures)
- No confidential data in commits (dotenv, API keys, credentials)
- Conventional commit format

## Documentation

Essential docs in `./docs/`:
- `development-roadmap.md`: Project phases and milestones
- `project-changelog.md`: Changes and features
- `system-architecture.md`: Architecture decisions
- `code-standards.md`: Coding standards

Plans in `./plans/`: Use format `YYMMDD-HHMM-descriptive-name/`

## Geospatial Queries (PostGIS)

Venues use latitude/longitude coordinates. Example queries:

```sql
-- Find venues within radius (in meters)
SELECT * FROM venues
WHERE ST_DWithin(
  location,
  ST_MakePoint($lng, $lat)::geography,
  $radius_meters
);

-- Add point to record
UPDATE venues
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE id = $id;
```

## Important Notes

- Always implement real code, never simulations
- Update existing files directly, avoid creating "enhanced" versions
- Use try-catch error handling
- Cover security standards (input validation, no SQL injection, etc.)
- Project is in early stage - documentation structure may be created as we go
- All services use Docker and docker-compose to manage, run and setup
