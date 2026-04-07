# System Architecture

## Overview

PickAlo is a monolithic backend architecture with a React Native Android frontend. The system is designed for scalability, maintainability, and performance with a focus on sports facility booking in Hanoi, Vietnam.

## Architecture Principles

### Design Patterns
- **Repository Pattern**: Encapsulates data access behind consistent interfaces
- **Service Layer**: Business logic separated from route handlers
- **Dependency Injection**: Uses FastAPI's `Depends()` for clean dependency management
- **Middleware Pattern**: Request/response processing through chainable middleware

### Key Principles
- **YAGNI** (You Aren't Gonna Need It): Build only what's needed
- **KISS** (Keep It Simple, Stupid): Maintain simplicity in implementation
- **DRY** (Don't Repeat Yourself): Eliminate code duplication through abstractions

---

## Backend Architecture

### Monolithic FastAPI Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── api/                    # API route handlers
│   │   ├── v1/                 # API version 1
│   │   │   ├── api.py          # Main API router
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── users.py        # User management endpoints
│   │   │   ├── venues.py      # Venue management endpoints
│   │   │   ├── bookings.py     # Booking system endpoints
│   │   │   └── payments.py     # Payment processing endpoints
│   │   └── deps.py             # Dependency injection
│   ├── core/                   # Core application components
│   │   ├── config.py          # Application configuration
│   │   ├── database.py        # Database connection and session
│   │   ├── security.py        # Security utilities and JWT handling
│   │   └── __init__.py
│   ├── models/                 # SQLAlchemy database models
│   │   ├── user.py             # User model (roles: user, merchant, admin)
│   │   ├── venue.py            # Venue model with PostGIS location
│   │   ├── booking.py          # Booking model with time slots
│   │   ├── payment.py          # Payment transaction model
│   │   ├── review.py           # Review and rating model
│   │   └── __init__.py
│   ├── schemas/                # Pydantic schemas for validation
│   │   ├── user.py             # User request/response schemas
│   │   ├── venue.py            # Venue request/response schemas
│   │   ├── booking.py          # Booking request/response schemas
│   │   ├── payment.py          # Payment request/response schemas
│   │   └── __init__.py
│   ├── services/               # Business logic layer
│   │   ├── auth_service.py     # Authentication and authorization
│   │   ├── user_service.py     # User management logic
│   │   ├── venue_service.py    # Venue management logic
│   │   ├── booking_service.py  # Booking system logic
│   │   ├── payment_service.py  # Payment processing logic
│   │   └── __init__.py
│   ├── utils/                  # Utility functions
│   │   ├── security.py        # Security helper functions
│   │   ├── validators.py       # Custom validators
│   │   ├── geography.py       # PostGIS utilities
│   │   └── __init__.py
│   └── __init__.py
├── tests/                     # Test suite
├── requirements.txt           # Python dependencies
├── alembic/                   # Database migrations
└── .env.example               # Environment variables template
```

### Core Components

#### 1. Configuration Management (`app/core/config.py`)
- Environment-based configuration (development/production)
- Database connection settings
- JWT secret keys and expiration times
- CORS and security settings
- External API configurations

#### 2. Database Layer (`app/core/database.py`)
- SQLAlchemy ORM setup with PostgreSQL
- Session management
- Connection pooling
- Transaction handling
- PostGIS extension support

#### 3. Security Layer (`app/core/security.py`)
- JWT token generation and validation
- Password hashing and verification
- Role-based access control (RBAC)
- CORS middleware
- Rate limiting

#### 4. API Layer (`app/api/`)
- RESTful API endpoints following REST principles
- OpenAPI/Swagger documentation
- Request validation with Pydantic
- Response serialization
- Error handling middleware

#### 5. Business Logic Layer (`app/services/`)
- **Service Layer Pattern**: Separates business logic from API routes
- Transaction management
- Business rule enforcement
- Validation and sanitization
- Integration with external services

#### 6. Data Models (`app/models/`)
- **User Model**: Multi-role system (user, merchant, admin)
- **Venue Model**: Geospatial data with PostGIS integration
- **Booking Model**: Time slot management and availability
- **Payment Model**: Transaction tracking and status
- **Review Model**: User feedback and ratings

### Database Architecture

#### PostgreSQL with PostGIS
- **Location Storage**: Geography type for precise spatial queries
- **Geospatial Indexing**: Optimized for radius-based venue searches
- **Transaction Support**: ACID compliance for booking operations
- **Migration Management**: Alembic for schema evolution

#### Key Database Features
```sql
-- Geospatial venue search within radius (meters)
SELECT * FROM venues
WHERE ST_DWithin(
  location,
  ST_MakePoint($lng, $lat)::geography,
  $radius_meters
);

-- Time slot availability management
SELECT * FROM time_slots
WHERE venue_id = $venue_id
  AND start_time >= $start_time
  AND end_time <= $end_time
  AND is_available = true;
```

---

## Frontend Architecture

### React Native Android Structure

```
frontend/
├── App.tsx                    # Main application component
├── index.js                   # App entry point
├── babel.config.js            # Babel configuration
├── metro.config.js            # Metro bundler configuration
├── jest.config.js            # Jest testing configuration
├── package.json               # Node.js dependencies
├── .eslintrc.js              # ESLint configuration
├── .prettierrc.js            # Prettier configuration
└── src/
    ├── navigation/            # Navigation setup
    │   └── AppNavigator.tsx  # Main navigation stack
    ├── screens/              # Screen components
    │   ├── auth/             # Authentication screens
    │   ├── venues/           # Venue discovery screens
    │   ├── bookings/         # Booking management screens
    │   └── profile/          # User profile screens
    ├── components/            # Reusable UI components
    │   ├── common/           # Common components (Button, Input, etc.)
    │   ├── venues/           # Venue-specific components
    │   └── bookings/         # Booking-specific components
    ├── services/             # API services
    │   ├── api-client.ts     # Axios configuration
    │   ├── auth-service.ts   # Authentication API calls
    │   ├── venue-service.ts  # Venue API calls
    │   └── booking-service.ts # Booking API calls
    ├── store/                # State management
    │   ├── auth-store.ts     # Authentication state
    │   ├── venue-store.ts    # Venue search state
    │   └── booking-store.ts  # Booking state
    ├── utils/                # Utility functions
    │   ├── validators.ts     # Form validators
    │   ├── formatters.ts     # Data formatters
    │   └── constants.ts      # App constants
    ├── hooks/                # Custom React hooks
    │   ├── use-auth.ts       # Authentication hook
    │   ├── use-venues.ts     # Venue search hook
    │   └── use-bookings.ts   # Booking management hook
    └── types/                # TypeScript type definitions
        ├── auth.types.ts     # Authentication types
        ├── venue.types.ts    # Venue-related types
        └── booking.types.ts  # Booking-related types
```

### Frontend Components

#### 1. Navigation System
- **React Navigation**: Stack and tab navigation
- **Navigation Guards**: Protected routes for authenticated users
- **Deep Linking**: URL-based navigation
- **Tab Navigation**: Bottom tab bar for main sections

#### 2. API Integration
- **Axios HTTP Client**: Configured with JWT authentication
- **Request/Interceptors**: Automatic token management
- **Response Handling**: Centralized error handling
- **Type Safety**: Full TypeScript integration

#### 3. State Management
- **Zustand**: Lightweight state management
- **Local State**: Component-level state for UI interactions
- **Global State**: Cross-component state (auth, bookings, etc.)
- **Persistence**: Secure storage for authentication tokens

#### 4. Component Architecture
- **Presentational Components**: Focus on UI rendering
- **Container Components**: Handle data fetching and logic
- **Custom Hooks**: Reusable logic for common operations
- **Error Boundaries**: Graceful error handling

---

## Data Flow Architecture

### Request Flow
```
1. User Action → Frontend Component
2. Component → API Service (axios)
3. Service → API Route (FastAPI endpoint)
4. Route → Service Layer (Business Logic)
5. Service → Repository (Data Access)
6. Repository → Database (PostgreSQL)
7. Response flows back through the same layers
```

### Authentication Flow
```
1. User Login → Frontend Auth Component
2. → AuthService → POST /api/v1/auth/login
3. → AuthController → JWT Token Generation
4. → Frontend Storage → Future API Requests
5. → API Interceptor → Automatic Token Attachment
```

### Booking Flow
```
1. User Selects Venue → Frontend Venue Detail
2. → Time Slot Selection → Availability Check
3. → Booking Creation → Payment Processing
4. → Confirmation Email/SMS Notification
5. → Booking Status Updates → User Dashboard
```

---

## External Dependencies

### Backend Dependencies
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **PostgreSQL**: Primary database with PostGIS
- **Pydantic**: Data validation and serialization
- **Python-Jose**: JWT handling
- **Passlib**: Password hashing
- **Uvicorn**: ASGI server

### Frontend Dependencies
- **React Native**: Mobile application framework
- **React Navigation**: Navigation library
- **Axios**: HTTP client
- **Zustand**: State management
- **Jest**: Testing framework
- **TypeScript**: Type safety
- **ESLint & Prettier**: Code quality

### Infrastructure Dependencies
- **Docker**: Containerization
- **PostgreSQL**: Database service
- **Redis**: Caching (future implementation)
- **External APIs**: Maps, Payment Gateways

---

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access Control**: User, Merchant, Admin roles
- **Password Security**: Bcrypt hashing
- **Session Management**: Token expiration and refresh

### Data Protection
- **Input Validation**: Pydantic schemas for all API endpoints
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Proper cross-origin settings

### API Security
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Request Validation**: Comprehensive input validation
- **Response Sanitization**: No sensitive data exposure
- **Error Handling**: Secure error messages

---

## Performance Considerations

### Database Optimization
- **Geospatial Indexes**: Optimized for location queries
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Efficient SQL queries
- **Caching Strategy**: Redis for frequent data (future)

### Frontend Performance
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Proper compression and caching
- **Bundle Optimization**: Tree shaking and minification
- **State Management**: Efficient re-renders

### API Performance
- **Response Caching**: Cache frequently accessed data
- **Pagination**: Efficient data retrieval
- **Background Tasks**: Celery for async operations (future)
- **Compression**: Gzip compression for responses

---

## Scalability & Future Growth

### Current Architecture
- **Monolithic Backend**: Simple deployment and maintenance
- **Micro-Ready**: Service layer can be extracted to microservices
- **Database-First**: PostgreSQL can handle significant scale
- **API-First**: Well-defined contracts for future expansion

### Future Scaling Paths
- **Microservices**: Extract services as needed
- **Database Sharding**: Geographic data distribution
- **Caching Layer**: Redis for performance
- **Load Balancing**: Horizontal scaling capability
- **CDN Integration**: Static asset optimization