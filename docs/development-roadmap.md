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

### Sprint 1: Core Features Development 🔄 **IN PROGRESS**
**Planned:** April 7-20, 2026
**Status:** 0% Complete (Starting)

**Phase 1A: User Authentication & Profiles**
- [ ] User registration and login (JWT)
- [ ] User profile management
- [ ] Role-based access control (User/Merchant/Admin)
- [ ] Password reset functionality
- [ ] Email verification

**Phase 1B: Venue Management**
- [ ] Merchant registration and venue creation
- [ ] Venue listing with geospatial data
- [ ] Venue detail pages with photos and services
- [ ] Venue availability management
- [ ] Pricing configuration

**Phase 1C: Booking System**
- [ ] Time slot selection and booking
- [ ] Booking calendar and scheduling
- [ ] Payment integration (VNPay/Momo/QR)
- [ ] Booking confirmation and notifications
- [ ] Cancellation and modification

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
1. Begin Sprint 1: User Authentication implementation
2. Set up development environment for all team members
3. Establish coding standards and review process
4. Plan database migration strategy