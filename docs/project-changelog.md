# Project Changelog

All significant changes to the PickAlo platform are documented here.

## [Unreleased]

### Added
- Sprint 3: Venue Management planning

---

## [0.3.0] - April 7, 2026

### Added
- **Authentication System**
  - Complete JWT authentication with access + refresh tokens
  - User registration with phone/password and role selection (User/Merchant/Admin)
  - Password hashing with bcrypt (cost factor 12)
  - Token refresh mechanism for seamless UX
  - Role-based access control (RBAC) with protected endpoints

- **User Management**
  - User profile management (get, update, change password)
  - Phone verification placeholder (OTP: 123456 for testing)
  - Comprehensive auth error handling and validation
  - OpenAPI documentation for all auth endpoints

- **Testing & Quality**
  - Comprehensive auth tests (15 test scenarios)
  - Test coverage for authentication flows and security features
  - Edge case handling and error scenario testing

### Technical Debt
- None - Sprint 2 focused on secure, production-ready authentication system

### Known Issues
- None - All Sprint 2 objectives completed successfully

---

## [Unreleased]

### Added
- Project initialization and planning phase

---

## [0.2.0] - April 7, 2026

### Added
- **Database Schema & Models**
  - Complete SQLAlchemy models: User, Venue, Booking, Post, AdminAction
  - PostGIS integration for geospatial venue location queries
  - Dynamic pricing system with configurable time slot multipliers
  - Soft delete support with audit logging
  - Role-based access control foundation
  - Comprehensive database relationships and constraints

- **Database Infrastructure**
  - Alembic migration system with GiST indexes for location searches
  - Seed data script with 20+ Hanoi venues with real coordinates
  - Database connection pooling and session management
  - Transaction handling with proper error management
  - Environment-specific database configurations

- **Pricing System**
  - Dynamic pricing formula: Total = (BasePrice × TimeSlotFactor) + ServiceFee
  - Configurable time slot multipliers (off-peak 1.0x, peak 1.5x, +20% weekends)
  - Holiday surcharge support per merchant settings
  - Price calculation utilities and validation

### Changed
- Updated development roadmap to reflect Sprint 1 completion
- Adjusted project timeline for subsequent sprints

### Technical Debt
- None - Sprint 1 focused on clean, production-ready database foundation

### Known Issues
- None - All Sprint 1 objectives completed successfully

---

## [0.1.0] - April 6, 2026

### Added
- **Project Structure**
  - Backend FastAPI project with modular architecture
  - Frontend React Native Android project setup
  - Docker Compose for local development environment

- **Backend Infrastructure**
  - Core modules: config, database, security, API
  - PostgreSQL database with PostGIS extension for geospatial queries
  - Alembic for database migrations
  - JWT authentication system
  - CORS middleware configuration
  - Error handling middleware

- **Frontend Infrastructure**
  - React Native Android project with Expo
  - Navigation structure with React Navigation
  - Axios API client with JWT authentication
  - TypeScript configuration
  - ESLint and Prettier setup for code quality

- **Development Tools**
  - Pre-commit hooks for code quality
  - Black code formatter
  - Ruff linter
  - MyPy type checker
  - Pytest for backend testing
  - Jest for frontend testing
  - Docker Compose for consistent development environment

- **Configuration Files**
  - `.gitignore` optimized for Python/React Native projects
  - `docker-compose.yml` for backend/database/frontend services
  - Environment configuration management
  - Development and production settings separation

### Changed
- Initial project setup and directory structure creation

### Technical Debt
- None - Sprint 0 focused on clean, production-ready infrastructure

### Known Issues
- None - All Sprint 0 objectives completed successfully

---

## Version History

### Version 0.3.0
**Release Date:** April 7, 2026
**Focus:** Authentication & Authorization completion

**Milestones Achieved:**
- ✅ Complete JWT authentication system with access + refresh tokens
- ✅ User registration and role selection (User/Merchant/Admin)
- ✅ Role-based access control (RBAC) implementation
- ✅ User profile management and password change functionality
- ✅ Comprehensive auth tests (15 test scenarios)
- ✅ Phone verification placeholder and error handling
- ✅ OpenAPI documentation for all auth endpoints

**Project Status:** Ready for Sprint 3 development

### Version 0.2.0
**Release Date:** April 7, 2026
**Focus:** Database & Models completion

**Milestones Achieved:**
- ✅ Complete database schema with all models
- ✅ PostGIS integration for geospatial queries
- ✅ Dynamic pricing system implementation
- ✅ Alembic migration system setup
- ✅ Comprehensive seed data with real venues
- ✅ Soft delete and audit logging features

**Project Status:** Ready for Sprint 2 development

### Version 0.1.0
**Release Date:** April 6, 2026
**Focus:** Infrastructure & Setup completion

**Milestones Achieved:**
- ✅ Complete backend API structure
- ✅ Database schema with PostGIS support
- ✅ React Native Android app foundation
- ✅ Development toolchain configured
- ✅ Docker-based development environment
- ✅ Pre-commit quality gates

**Project Status:** Ready for Sprint 1 development