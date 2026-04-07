---
title: "Sprint 2: Authentication & Authorization"
description: "JWT-based authentication, role-based access control, and user profile management"
status: pending
priority: P1
effort: 10h
tags: [authentication, authorization, jwt, security]
created: 2026-04-06
---

# Sprint 2: Authentication & Authorization

## Overview

Implement secure authentication using JWT tokens, role-based access control (RBAC), and user profile management endpoints.

**Priority:** P1 (Critical - blocks all protected features)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.2, 3.3: User/Merchant features)
- Sprint 1: `./sprint-01-database-models.md` (User model dependencies)

## Key Insights

1. **Phone-based Auth**: Vietnamese users prefer phone numbers over email
2. **Three Roles**: USER (players), MERCHANT (venue owners), ADMIN (platform)
3. **JWT Refresh**: Access tokens (15min) + refresh tokens (7 days)
4. **Role-Based Endpoints**: Different permissions per role

## Requirements

### Functional Requirements

1. **Registration**: Phone + password, role selection
2. **Login**: Phone/password, returns JWT tokens
3. **Token Refresh**: Refresh access token using refresh token
4. **Logout**: Invalidate refresh token
5. **Profile**: Get/update user profile
6. **OTP**: Phone verification via SMS (future - placeholder)

### Non-Functional Requirements

1. **Security**: bcrypt for password hashing (cost factor 12)
2. **JWT**: RS256 or HS256 with strong secret
3. **Rate Limiting**: Prevent brute force on login
4. **Session Management**: Refresh token storage

## Architecture

### Auth Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│ Client  │         │  API    │         │ Database │
└────┬────┘         └────┬────┘         └────┬─────┘
     │                   │                   │
     │ POST /auth/login  │                   │
     │──────────────────>│                   │
     │                   │ Verify password   │
     │                   │──────────────────>│
     │                   │<──────────────────│
     │ {access_token,    │                   │
     │  refresh_token}   │                   │
     │<──────────────────│                   │
     │                   │                   │
     │ GET /api/v1/me    │                   │
     │ (Bearer token)    │                   │
     │──────────────────>│ Validate JWT      │
     │                   │──────────────────>│
     │                   │<──────────────────│
     │ user data         │                   │
     │<──────────────────│                   │
```

### Token Structure

**Access Token (15min):**
```json
{
  "sub": "user_uuid",
  "role": "USER",
  "exp": 1234567890,
  "iat": 1234567890,
  "type": "access"
}
```

**Refresh Token (7 days):**
```json
{
  "sub": "user_uuid",
  "exp": 1234567890,
  "iat": 1234567890,
  "type": "refresh",
  "jti": "token_uuid"
}
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/core/security.py` | JWT utilities, password hashing |
| `backend/app/schemas/user.py` | User Pydantic schemas |
| `backend/app/schemas/auth.py` | Auth request/response schemas |
| `backend/app/services/auth.py` | Auth business logic |
| `backend/app/api/deps.py` | Auth dependencies |
| `backend/app/api/v1/auth.py` | Auth endpoints |
| `backend/app/api/v1/users.py` | User profile endpoints |
| `backend/tests/test_auth.py` | Auth tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/user.py` | Add refresh_token relationship |
| `backend/app/core/config.py` | Add JWT settings |

## Implementation Steps

### Step 1: Security Utilities (1.5h)

1. Create `backend/app/core/security.py`:
   - `verify_password(plain, hashed)` function
   - `get_password_hash(password)` function
   - `create_access_token(data)` function
   - `create_refresh_token(user_id)` function
   - `decode_token(token)` function
2. Configure in `config.py`:
   - `SECRET_KEY` environment variable
   - `ACCESS_TOKEN_EXPIRE_MINUTES = 15`
   - `REFRESH_TOKEN_EXPIRE_DAYS = 7`
   - `ALGORITHM = "HS256"`

### Step 2: Create Pydantic Schemas (1.5h)

1. Create `backend/app/schemas/auth.py`:
   - `RegisterRequest`: phone, password, full_name, role
   - `LoginRequest`: phone, password
   - `AuthResponse`: access_token, refresh_token, token_type, user
   - `RefreshTokenRequest`: refresh_token
   - `TokenResponse`: access_token, token_type
2. Create `backend/app/schemas/user.py`:
   - `UserBase`: full_name, email, avatar_url
   - `UserCreate`: inherit UserBase + phone, password
   - `UserResponse`: UserBase + id, phone, role, is_verified
   - `UserUpdate`: partial update fields

### Step 3: Create Auth Service (2h)

1. Create `backend/app/services/auth.py`:
   - `authenticate_user(phone, password)`: Verify credentials
   - `create_user(user_data)`: Register new user
   - `create_tokens(user_id)`: Generate access + refresh tokens
   - `refresh_access_token(refresh_token)`: Validate and issue new access
   - `logout_user(refresh_token)`: Invalidate refresh token
2. Implement refresh token storage (in-memory or Redis)

### Step 4: Create API Dependencies (1h)

1. Update `backend/app/api/deps.py`:
   - `get_db()`: Database session dependency
   - `get_current_user(token)`: Extract and validate JWT
   - `get_current_active_user()`: Check user.is_active
   - `require_role(*roles)`: Role-based authorization
   - `get_refresh_token()`: Extract refresh token from request

### Step 5: Create Auth Endpoints (2h)

1. Create `backend/app/api/v1/auth.py`:

**POST /api/v1/auth/register**
- Input: phone, password, full_name, role (default: USER)
- Validation: Phone format, password strength
- Output: User + tokens
- Status: 201 Created

**POST /api/v1/auth/login**
- Input: phone, password
- Logic: Verify password, generate tokens
- Output: User + tokens
- Status: 200 OK

**POST /api/v1/auth/refresh**
- Input: refresh_token
- Logic: Validate refresh token, issue new access
- Output: New access_token
- Status: 200 OK

**POST /api/v1/auth/logout**
- Input: refresh_token
- Logic: Invalidate refresh token
- Output: Success message
- Status: 200 OK

**POST /api/v1/auth/verify-phone** (placeholder)
- Input: phone, otp
- Logic: Verify OTP, mark user as verified
- Status: 200 OK

### Step 6: Create User Profile Endpoints (1h)

1. Create `backend/app/api/v1/users.py`:

**GET /api/v1/users/me**
- Auth: Required
- Output: Current user profile
- Status: 200 OK

**PATCH /api/v1/users/me**
- Auth: Required
- Input: partial user fields
- Output: Updated user profile
- Status: 200 OK

**PUT /api/v1/users/me/avatar**
- Auth: Required
- Input: file upload
- Logic: Upload to cloud storage, update URL
- Status: 200 OK

**POST /api/v1/users/me/change-password**
- Auth: Required
- Input: old_password, new_password
- Logic: Verify old, hash new
- Status: 200 OK

### Step 7: Register Routes (30m)

1. Update `backend/app/api/v1/api.py`:
   - Include auth router
   - Include users router
   - Add tags for OpenAPI grouping

### Step 8: Write Tests (1.5h)

1. Create `tests/test_auth.py`:
   - Test registration with valid data
   - Test registration with duplicate phone
   - Test login with valid credentials
   - Test login with invalid credentials
   - Test token refresh
   - Test logout
   - Test protected endpoint without token
   - Test protected endpoint with expired token
   - Test role-based access

## Todo List

- [ ] Create password hashing utilities (bcrypt)
- [ ] Create JWT token creation/decoding utilities
- [ ] Create auth Pydantic schemas
- [ ] Create user Pydantic schemas
- [ ] Implement auth service (login, register, refresh)
- [ ] Create auth dependencies (get_current_user, require_role)
- [ ] Implement POST /auth/register endpoint
- [ ] Implement POST /auth/login endpoint
- [ ] Implement POST /auth/refresh endpoint
- [ ] Implement POST /auth/logout endpoint
- [ ] Implement GET /users/me endpoint
- [ ] Implement PATCH /users/me endpoint
- [ ] Add rate limiting to auth endpoints
- [ ] Write comprehensive auth tests
- [ ] Document auth flow in API docs

## Success Criteria

1. **Registration**: New user can register and receive tokens
2. **Login**: Valid credentials return JWT tokens
3. **Token Validation**: Protected endpoints reject invalid tokens
4. **Token Refresh**: Expired access tokens can be refreshed
5. **Role Check**: Users cannot access admin-only endpoints
6. **Tests**: All auth tests pass (80%+ coverage)

## Test Scenarios

### Registration Flow
```bash
# Test 1: Successful registration
POST /api/v1/auth/register
{
  "phone": "+84901234567",
  "password": "SecurePass123!",
  "full_name": "Nguyen Van A",
  "role": "USER"
}
# Expected: 201 Created, returns user + tokens

# Test 2: Duplicate phone
POST /api/v1/auth/register
{ "phone": "+84901234567", ... }
# Expected: 400 Bad Request, phone already exists

# Test 3: Weak password
POST /api/v1/auth/register
{ "password": "123", ... }
# Expected: 400 Bad Request, password too weak
```

### Login Flow
```bash
# Test 4: Valid login
POST /api/v1/auth/login
{
  "phone": "+84901234567",
  "password": "SecurePass123!"
}
# Expected: 200 OK, returns access_token + refresh_token

# Test 5: Invalid credentials
POST /api/v1/auth/login
{ "phone": "+84901234567", "password": "wrong" }
# Expected: 401 Unauthorized

# Test 6: Access protected endpoint
GET /api/v1/users/me
Authorization: Bearer <access_token>
# Expected: 200 OK, returns user profile

# Test 7: No token
GET /api/v1/users/me
# Expected: 401 Unauthorized
```

### Token Refresh
```bash
# Test 8: Refresh access token
POST /api/v1/auth/refresh
{ "refresh_token": "<valid_refresh_token>" }
# Expected: 200 OK, returns new access_token

# Test 9: Invalid refresh token
POST /api/v1/auth/refresh
{ "refresh_token": "invalid" }
# Expected: 401 Unauthorized

# Test 10: Expired refresh token
POST /api/v1/auth/refresh
{ "refresh_token": "<expired>" }
# Expected: 401 Unauthorized
```

### Role-Based Access
```bash
# Test 11: User accessing admin endpoint
GET /api/v1/admin/dashboard
Authorization: Bearer <user_token>
# Expected: 403 Forbidden

# Test 12: Admin accessing admin endpoint
GET /api/v1/admin/dashboard
Authorization: Bearer <admin_token>
# Expected: 200 OK
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT secret exposure | Critical | Use environment variables, rotate regularly |
| Brute force attacks | High | Rate limiting, account lockout |
| Token hijacking | Medium | Use HTTPS, short access token expiry |
| Refresh token storage | Medium | Consider Redis for production |

## Security Considerations

1. **Password Strength**: Min 8 chars, uppercase, lowercase, number
2. **Password Hashing**: bcrypt with cost factor 12
3. **JWT Secret**: 32+ character random string
4. **Rate Limiting**: 5 login attempts per 15 minutes per IP
5. **HTTPS Only**: Production must use TLS
6. **Token Expiry**: Short access tokens (15min), longer refresh (7 days)
7. **CORS**: Configure allowed origins strictly

## Next Steps

1. Sprint 3: Create venue management endpoints
2. Sprint 8: Add merchant-specific auth flows

## Dependencies

- Requires: Sprint 1 (Database Models)
- Blocks: Sprint 3 (Venue Management)
- Blocks: Sprint 4 (Booking)
- Blocks: Sprint 7 (Newsfeed)
