# Development Roadmap

## Project Overview
PickAlo is a sports facility booking platform connecting venue owners (Merchants) and players (Users) in Hanoi, Vietnam.

## Sprint Overview

### Sprint 0: Infrastructure & Setup ✅ **COMPLETE**
**Completed:** April 6, 2026
**Status:** 100% Complete

**Accomplishments:**
- ✅ Backend FastAPI project structure with core modules (config, database, security, API)
- ✅ PostgreSQL + PostGIS database setup with Alembic migrations
- ✅ React Native Android project with navigation structure
- ✅ API client with axios and JWT authentication
- ✅ Development tools: ESLint, Prettier, pytest, Jest, black, ruff, mypy
- ✅ Docker Compose for local development
- ✅ .gitignore and pre-commit hooks configured

---

### Sprint 1: Database & Models ✅ **COMPLETE**
**Completed:** April 7, 2026
**Status:** 100% Complete

**Accomplishments:**
- ✅ Complete database schema with SQLAlchemy models (User, Venue, Booking, Post, AdminAction)
- ✅ PostGIS integration for geospatial venue location queries with GiST indexes
- ✅ Dynamic pricing time slots with configurable multipliers and merchant settings
- ✅ Alembic migration system with full database schema setup
- ✅ Seed data script with 20+ Hanoi venues with real coordinates
- ✅ Soft delete support, audit logging, and role-based access control foundation
- ✅ Comprehensive database relationships and constraints

---

### Sprint 2: User Authentication & Profiles ⏳ **PLANNED**
**Planned:** April 8-21, 2026
**Status:** 0% Complete

**Key Features:**
- [ ] User registration and login (JWT)
- [ ] User profile management
- [ ] Role-based access control (User/Merchant/Admin)
- [ ] Password reset functionality
- [ ] Email verification

---

### Sprint 3: Venue Management ⏳ **PLANNED**
**Planned:** April 22-May 5, 2026
**Status:** 0% Complete

**Key Features:**
- [ ] Merchant registration and venue creation
- [ ] Venue listing with geospatial data
- [ ] Venue detail pages with photos and services
- [ ] Venue availability management
- [ ] Pricing configuration

---

### Sprint 2: Advanced Features ⏳ **PLANNED**
**Planned:** April 21-May 4, 2026
**Status:** 0% Complete

**Key Features:**
- [ ] Search and filtering system
- [ ] Reviews and ratings
- [ ] Team formation features
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] Analytics and reporting

---

### Sprint 3: Optimization & Scaling ⏳ **PLANNED**
**Planned:** May 5-18, 2026
**Status:** 0% Complete

**Key Tasks:**
- [ ] Performance optimization
- [ ] Database indexing and query optimization
- [ ] Caching implementation
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation completion

---

## Success Metrics

### Sprint 0 Metrics
- [x] Project structure established
- [x] Development environment configured
- [x] Database schema designed
- [x] Frontend framework setup
- [x] CI/CD pipeline basics in place

### Sprint 1 Metrics
- [x] Complete database schema implementation
- [x] PostGIS integration for geospatial queries
- [x] Dynamic pricing system with time slots
- [x] Alembic migration system setup
- [x] Seed data with real Hanoi venues
- [x] Soft delete and audit logging features

### Overall Project Metrics
- **Target Launch:** Q2 2026
- **Code Coverage:** 80%+
- **Performance:** LCP < 2.5s, INP < 200ms
- **Security:** OWASP Top 10 compliance

## Dependencies & Risks

### Current Dependencies
- PostgreSQL 14+ with PostGIS
- FastAPI with SQLAlchemy
- React Native Android
- Docker for development environment

### Known Risks
- [ ] Payment gateway integration complexity
- [ ] Geospatial query performance
- [ ] Mobile app store approval
- [ ] Local market competition

## Next Steps
1. Begin Sprint 2: User Authentication implementation
2. Set up API endpoints for user registration and authentication
3. Implement role-based access control system
4. Create frontend user interface components for login/register