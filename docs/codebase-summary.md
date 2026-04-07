# Codebase Summary

## Project Overview
PickAlo is a sports facility booking platform connecting venue owners (Merchants) and players (Users) in Hanoi, Vietnam. The project consists of a FastAPI backend with PostgreSQL + PostGIS database and a React Native Android frontend.

## Project Structure

```
D:\PTIT\PickaloApp\
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── api/               # API route handlers
│   │   ├── core/              # Core modules (config, database, security)
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic schemas for validation
│   │   ├── services/          # Business logic layer
│   │   └── utils/             # Utility functions
│   ├── alembic/               # Database migrations
│   └── tests/                 # Test suite
├── frontend/                  # React Native Android
│   ├── src/
│   │   ├── navigation/       # Navigation setup
│   │   ├── screens/          # Screen components
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # API services
│   │   ├── store/            # State management
│   │   ├── utils/           # Utility functions
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript type definitions
│   └── tests/                # Frontend test suite
├── docs/                     # Documentation
├── plans/                    # Development plans
└── docker-compose.yml        # Development environment
```

## Key Features Implemented

### Backend (FastAPI)
- **Project Structure**: Modular architecture with clean separation of concerns
- **Database**: PostgreSQL with PostGIS for geospatial queries
- **Authentication**: JWT-based authentication with role-based access control
- **API Design**: RESTful API with OpenAPI documentation
- **Data Models**: User, Venue, Booking, Payment models with proper relationships
- **Services**: Business logic layer separated from API endpoints
- **Migrations**: Alembic for database schema management

### Frontend (React Native)
- **Framework**: React Native Android with TypeScript
- **Navigation**: React Navigation with stack and tab navigation
- **State Management**: Zustand for global state
- **API Integration**: Axios with JWT authentication
- **Components**: Modular component architecture with TypeScript
- **Testing**: Jest with React Native Testing Library
- **Code Quality**: ESLint and Prettier for consistent formatting

## Development Environment

### Backend Dependencies
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **PostgreSQL**: Primary database with PostGIS extension
- **Pydantic**: Data validation and serialization
- **JWT Authentication**: Secure user authentication
- **Testing**: Pytest for comprehensive testing

### Frontend Dependencies
- **React Native**: Mobile application framework
- **TypeScript**: Type safety and better development experience
- **React Navigation**: Navigation system for mobile apps
- **Zustand**: Lightweight state management
- **Axios**: HTTP client for API calls
- **Jest**: Testing framework
- **ESLint & Prettier**: Code quality and formatting

### Tools & Configuration
- **Docker**: Containerized development environment
- **Pre-commit**: Git hooks for code quality
- **Black**: Code formatting for Python
- **Ruff**: Linting and formatting
- **MyPy**: Type checking for Python
- **Metro**: React Native bundler configuration

## API Architecture

### Core Endpoints
- **Authentication**: `/api/v1/auth/` (login, register, refresh)
- **Users**: `/api/v1/users/` (CRUD operations)
- **Venues**: `/api/v1/venues/` (venue discovery, details, search)
- **Bookings**: `/api/v1/bookings/` (booking management)
- **Payments**: `/api/v1/payments/` (payment processing)

### Authentication Flow
1. User registration with email verification
2. JWT token generation on successful login
3. Token-based authentication for protected endpoints
4. Role-based access control (User, Merchant, Admin)

### Database Design
- **PostgreSQL**: Primary database with spatial capabilities
- **PostGIS**: Geographic information system extension
- **Models**: Structured data with proper relationships
- **Indexes**: Optimized for query performance
- **Migrations**: Version-controlled schema changes

## Current Status

### Completed (Sprint 0: Infrastructure & Setup)
- ✅ Backend FastAPI project structure
- ✅ PostgreSQL + PostGIS database setup
- ✅ React Native Android project foundation
- ✅ Development tools and configuration
- ✅ Docker Compose for local development
- ✅ Pre-commit hooks and CI/CD pipeline

### In Progress (Sprint 1: Core Features)
- ⏳ User authentication and profiles
- ⏳ Venue discovery and search
- ⏳ Booking system foundation
- ⏳ Payment processing integration

### Planned (Future Sprints)
- ⏳ Team formation and social features
- ⏳ Advanced merchant tools
- ⏳ Admin dashboard
- ⏳ Performance optimization
- ⏳ Mobile app store deployment

## Code Quality Standards

### Python (Backend)
- **File Size**: Maximum 200 lines per file
- **Functions**: Maximum 50 lines per function
- **Naming**: kebab-case for files, snake_case for variables
- **Type Hints**: Comprehensive type annotations
- **Error Handling**: Proper exception handling with logging
- **Testing**: 80%+ test coverage required

### TypeScript (Frontend)
- **File Size**: Maximum 200 lines per file
- **Components**: Follow React best practices
- **Naming**: kebab-case for files, camelCase for variables
- **Type Safety**: Strict TypeScript configuration
- **Testing**: Jest with React Native Testing Library

## Security Features

### Backend Security
- JWT-based authentication
- Role-based access control
- Input validation with Pydantic
- SQL injection prevention
- XSS protection
- Rate limiting

### Frontend Security
- Secure token storage
- Input validation on forms
- HTTPS for all API calls
- Error handling that doesn't expose sensitive data

## Performance Optimization

### Backend
- Database indexing for frequent queries
- Connection pooling
- Caching strategies (Redis integration planned)
- API response optimization

### Frontend
- Code splitting and lazy loading
- Image optimization
- Component optimization
- Bundle size reduction

## Deployment Strategy

### Development
- Docker Compose for local development
- Pre-commit hooks for code quality
- Automated testing on development branches

### Production
- Containerized deployment with Docker
- Environment-specific configurations
- Database migrations
- Monitoring and logging

## Future Enhancements

### Technical Improvements
- Microservices architecture (future migration)
- Advanced caching with Redis
- Background job processing with Celery
- Enhanced monitoring and analytics

### Feature Expansion
- iOS development
- New city expansion
- Advanced analytics dashboard
- Premium features and subscriptions

## Conclusion

The PickAlo codebase is built with modern, scalable technologies following best practices for web and mobile development. The current sprint 0 infrastructure provides a solid foundation for implementing the core booking platform features, with clear architecture and comprehensive documentation for future development.