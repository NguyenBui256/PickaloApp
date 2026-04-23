# Phase 2: Swap auth-service to Real API

**Priority:** HIGH (blocks all other services — everything requires auth)
**Status:** Pending
**Depends on:** Phase 1
**Estimated effort:** 1 hour

## Overview
Replace all mock implementations in `auth-service.ts` with real API calls. The real API code is already written (commented out) in each function.

## File to Modify
- `frontend/src/services/auth-service.ts`

## Changes Per Function

### 2.1 `login()`
```
BEFORE: Mock returns MOCK_USER or MOCK_OWNER based on phone
AFTER:  POST /auth/login with { phone, password }
SPECIAL: After successful login, store tokens via auth-store + AsyncStorage
```

### 2.2 `register()`
```
BEFORE: Mock returns mock user
AFTER:  POST /auth/register with { phone, password, full_name, email?, role? }
```

### 2.3 `refreshToken()`
```
BEFORE: Mock returns new token
AFTER:  POST /auth/refresh with { refresh_token }
```

### 2.4 `logout()`
```
BEFORE: Mock returns success message
AFTER:  POST /auth/logout with { refresh_token }
```

### 2.5 `verifyPhone()`
```
BEFORE: Mock checks OTP === "123456"
AFTER:  POST /auth/verify-phone with { phone, otp }
```

### 2.6 `getMyProfile()`
```
BEFORE: Mock returns MOCK_USER
AFTER:  GET /auth/me
```

### 2.7 `updateMyProfile()`
```
BEFORE: Mock merges data
AFTER:  PATCH /auth/me with { full_name?, email?, avatar_url?, date_of_birth? }
```

### 2.8 `changePassword()`
```
BEFORE: Mock returns success
AFTER:  POST /auth/me/change-password with { old_password, new_password }
```

### 2.9 `uploadAvatar()`
```
STATUS: No BE endpoint yet — KEEP MOCK for now
NOTE:  Add TODO comment referencing backend gap
```

## Pattern For Each Function
For each function in `auth-service.ts`:
1. Delete the mock fallback code block
2. Uncomment the real API call code block
3. Remove `response.data` wrappers if `apiClient` already returns `response.data` (it does — `apiClient.get<T>` returns `T` directly)
4. Remove unused imports (`MOCK_USER`, `MOCK_OWNER`, `MOCK_REGISTER_PAYLOAD`)

## Token Storage Integration
After login/register succeeds, the caller (LoginScreen) must:
1. Store `access_token` and `refresh_token` in AsyncStorage via `APP_CONFIG.STORAGE_KEYS`
2. Update auth-store with user data

## Success Criteria
- [ ] Login with real phone + password returns JWT tokens
- [ ] Token persisted in AsyncStorage
- [ ] Subsequent API calls include `Authorization: Bearer <token>` header
- [ ] Token refresh works on 401
- [ ] Logout clears tokens from storage
- [ ] Profile fetch returns real user data
- [ ] Profile update persists to backend
