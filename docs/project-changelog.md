# Project Changelog

All significant changes to the PickAlo platform are documented here.

## [Unreleased]

### Added
- Project initialization and planning phase

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