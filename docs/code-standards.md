# Code Standards

## Overview

This document defines the coding standards and best practices for the PickAlo project. All developers must adhere to these standards to ensure code quality, maintainability, and consistency across the codebase.

## File Naming Conventions

### General Rules
- Use **kebab-case** for all file names with descriptive, meaningful names
- File names should be self-documenting - clear purpose without reading content
- No abbreviations unless they are widely understood
- Maximum length: 100 characters (descriptive names take priority)

### Python Files (Backend)
```python
# ✅ Good Examples
user_authentication_service.py
venue_management_repository.py
booking_system_api.py
payment_processing_gateway.py

# ❌ Bad Examples
auth.py                 # Too generic
user_service.py        # Could be more descriptive
booking.py             # Missing context
venue_mgr.py           # Abbreviation not clear
```

### TypeScript/JavaScript Files (Frontend)
```typescript
// ✅ Good Examples
user-authentication-service.ts
venue-management-repository.ts
booking-system-api.ts
payment-processing-gateway.ts
user-profile-screen.tsx
venue-detail-component.tsx

// ❌ Bad Examples
auth.ts                 # Too generic
user-service.ts        # Could be more descriptive
booking.ts             # Missing context
venue.ts               # Could be more descriptive
```

### Configuration Files
```bash
# ✅ Good Examples
.eslintrc.js
.prettierrc.js
babel.config.js
metro.config.js
jest.config.js
docker-compose.yml

# ❌ Bad Examples
.eslint.js              # Not descriptive
.config.js              # Too generic
docker-compose.yaml     # .yml is preferred for Docker
```

## File Size Limits

### Maximum File Sizes
- **Maximum 200 lines per file** - Split when exceeded
- **Maximum 50 lines per function** - Break into smaller functions
- **Maximum 4 levels of nesting** - Use early returns to reduce nesting

### File Splitting Strategy
When files exceed 200 lines:
1. **Identify logical boundaries** by functionality
2. **Extract related functions** into separate modules
3. **Create service classes** for business logic
4. **Use composition** over inheritance for complex components

### Example - Large File Splitting
```python
# ❌ Large file (300+ lines)
venue_management_api.py  # Too large, needs splitting

# ✅ Split into smaller files
venue_management_api.py     # Main API endpoints (100 lines)
venue_service.py            # Business logic (80 lines)
venue_repository.py         # Data access (70 lines)
venue_validators.py         # Validation logic (50 lines)
```

## Code Quality Standards

### Python (Backend)

#### Import Organization
```python
# ✅ Standard import order
import os
from typing import Optional, List
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.services.user_service import UserService

# ✅ Relative imports within module
from .models import Booking
from .schemas import BookingCreate
from .services import BookingService
```

#### Function Structure
```python
# ✅ Good function structure
def create_user_booking(
    user_id: int,
    venue_id: int,
    booking_data: BookingCreate,
    db: Session
) -> Booking:
    """
    Create a new booking for a user at a venue.

    Args:
        user_id: The ID of the user making the booking
        venue_id: The ID of the venue being booked
        booking_data: Booking details including time slots
        db: Database session

    Returns:
        Booking: The created booking record

    Raises:
        HTTPException: If venue not available or user not found
    """
    # Validate user exists
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check venue availability
    if not is_venue_available(venue_id, booking_data.time_slots, db):
        raise HTTPException(status_code=400, detail="Venue not available")

    # Create booking
    booking = BookingService.create_booking(user_id, venue_id, booking_data, db)

    return booking
```

#### Error Handling
```python
# ✅ Proper error handling
try:
    user = UserService.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not UserService.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return user

except DatabaseError as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(status_code=500, detail="Database error occurred")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

#### Type Hints
```python
# ✅ Comprehensive type hints
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class BookingCreate(BaseModel):
    venue_id: int
    start_time: datetime
    end_time: datetime
    services: List[int] = []
    special_requests: Optional[str] = None

def get_user_bookings(
    user_id: int,
    db: Session,
    limit: int = 10
) -> List[Booking]:
    """Get user's bookings with pagination."""
    pass
```

### TypeScript (Frontend)

#### Import Organization
```typescript
// ✅ Standard import order
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import axios from 'axios';
import { store } from '../store/auth-store';
import { VenueService } from '../services/venue-service';
import { VenueCard } from '../components/common/venue-card';
import { useVenueSearch } from '../hooks/use-venue-search';
```

#### Component Structure
```typescript
// ✅ Good component structure
interface VenueCardProps {
  venue: Venue;
  onPress: (venue: Venue) => void;
  isBookmarked: boolean;
  onBookmarkToggle: (venueId: number) => void;
}

const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onPress,
  isBookmarked,
  onBookmarkToggle,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handlePress = () => {
    onPress(venue);
  };

  const handleBookmark = () => {
    onBookmarkToggle(venue.id);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image
        source={{ uri: venue.images[0] }}
        style={styles.image}
        onLoad={() => setImageLoaded(true)}
      />
      {imageLoaded && (
        <>
          <Text style={styles.name}>{venue.name}</Text>
          <Text style={styles.price}>¥{venue.pricePerHour}/hour</Text>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleBookmark}
          >
            <Text style={styles.bookmarkText}>
              {isBookmarked ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
};
```

#### API Service Pattern
```typescript
// ✅ Good API service structure
import axios, { AxiosInstance } from 'axios';

class VenueService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:8000/api/v1',
      timeout: 10000,
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getVenues(params: VenueSearchParams): Promise<Venue[]> {
    try {
      const response = await this.api.get('/venues', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw new Error('Failed to fetch venues');
    }
  }

  async getVenueDetails(venueId: number): Promise<Venue> {
    try {
      const response = await this.api.get(`/venues/${venueId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching venue details:', error);
      throw new Error('Failed to fetch venue details');
    }
  }
}

export const venueService = new VenueService();
```

## Testing Standards

### Python Testing
```python
# ✅ Good test structure
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.user import User

client = TestClient(app)

@pytest.fixture
def test_user():
    return {
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test User"
    }

def test_user_registration(test_user):
    """Test user registration endpoint."""
    response = client.post("/api/v1/auth/register", json=test_user)

    assert response.status_code == 201
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_user_login(test_user):
    """Test user login endpoint."""
    # First register user
    client.post("/api/v1/auth/register", json=test_user)

    # Then login
    login_data = {"email": test_user["email"], "password": test_user["password"]}
    response = client.post("/api/v1/auth/login", json=login_data)

    assert response.status_code == 200
    assert "access_token" in response.json()
```

### Frontend Testing
```typescript
// ✅ Good test structure
import { render, fireEvent, screen } from '@testing-library/react-native';
import { VenueCard } from '../venue-card';
import { mockVenue } from '../../__mocks__/venue-mocks';

describe('VenueCard', () => {
  const mockOnPress = jest.fn();
  const mockOnBookmarkToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders venue information correctly', () => {
    render(
      <VenueCard
        venue={mockVenue}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    expect(screen.getByText(mockVenue.name)).toBeTruthy();
    expect(screen.getByText(`¥${mockVenue.pricePerHour}/hour`)).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    render(
      <VenueCard
        venue={mockVenue}
        onPress={mockOnPress}
        isBookmarked={false}
        onBookmarkToggle={mockOnBookmarkToggle}
      />
    );

    fireEvent.press(screen.getByTestId('venue-card'));
    expect(mockOnPress).toHaveBeenCalledWith(mockVenue);
  });
});
```

## Git Workflow Standards

### Commit Messages
```bash
# ✅ Good commit messages
feat: add user authentication with JWT login
fix: resolve venue availability calculation bug
docs: update API documentation for booking endpoints
refactor: extract user service into separate module
test: add unit tests for venue repository
style: fix code formatting and linting issues

# ❌ Bad commit messages
fixed bug
update code
add new feature
work on authentication
```

### Branch Naming
```bash
# ✅ Good branch names
feature/user-authentication
fix/venue-availability-bug
docs/api-documentation
hotfix/security-patch
chore/update-dependencies

# ❌ Bad branch names
feature1
bugfix
new-work
update
```

## Code Review Standards

### Review Checklist
Before approving a PR, ensure:

#### Code Quality
- [ ] Code follows naming conventions
- [ ] Functions are under 50 lines
- [ ] Files are under 200 lines
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] Type hints are comprehensive

#### Functionality
- [ ] All tests pass
- [ ] Code meets requirements
- [ ] Edge cases are handled
- [ ] Performance is adequate
- [ ] Security considerations addressed

#### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic has comments
- [ ] API endpoints are documented
- [ ] README/updated if needed

### Review Process
1. **Automated checks** must pass (linting, type checking, tests)
2. **Manual review** for code quality and architecture
3. **Testing** in review environment
4. **Documentation** review if applicable
5. **Final approval** before merge

## Performance Standards

### Backend Performance
- **Database queries** should be optimized with proper indexing
- **API response time** should be under 500ms for most operations
- **Database connections** should use connection pooling
- **Cache frequently accessed** data

### Frontend Performance
- **Bundle size** should be minimized
- **Image optimization** with proper compression
- **Component re-renders** should be optimized
- **Navigation** should be fast and responsive

## Security Standards

### Backend Security
- **Input validation** for all API endpoints
- **SQL injection** prevention with parameterized queries
- **XSS protection** with proper escaping
- **JWT tokens** with proper expiration
- **Password hashing** with bcrypt

### Frontend Security
- **No hardcoded credentials** in source code
- **Secure storage** of authentication tokens
- **Input validation** on forms
- **HTTPS** for all API calls
- **Error handling** that doesn't expose sensitive information

## Development Environment Setup

### Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Run linting
npm run lint
```

## Code Quality Tools

### Backend Tools
- **Black**: Code formatting
- **Ruff**: Linting and formatting
- **MyPy**: Type checking
- **Pytest**: Testing framework
- **Pre-commit**: Git hooks

### Frontend Tools
- **ESLint**: Linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Jest**: Testing framework
- **React Native Testing Library**: React Native testing

## Monitoring and Maintenance

### Code Quality Metrics
- **Test Coverage**: 80% minimum
- **Code Complexity**: Keep cyclomatic complexity low
- **Bug Rate**: Track and fix bugs promptly
- **Performance**: Monitor response times
- **Security**: Regular security audits

### Documentation Updates
- **API Documentation**: Keep updated with code changes
- **README**: Update with setup instructions
- **Changelog**: Document all changes
- **Architecture**: Update if significant changes occur

## Conclusion

These code standards ensure that the PickAlo project remains maintainable, scalable, and of high quality. All developers should familiarize themselves with these standards and follow them consistently.

**Remember:** Quality is everyone's responsibility.