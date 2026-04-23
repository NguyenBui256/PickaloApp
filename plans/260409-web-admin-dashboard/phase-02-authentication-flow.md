---
title: "Phase 2: Authentication Flow"
description: "Implement login, token management, and protected routes"
status: pending
priority: P1
effort: 4h
tags: [authentication, jwt, protected-routes]
---

# Phase 2: Authentication Flow

## Context Links
- Main Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-setup-infrastructure.md](./phase-01-setup-infrastructure.md)
- Auth API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/auth.py](../../../backend/app/api/v1/endpoints/auth.py)
- Auth Schemas: [D:/PTIT/PickaloApp/backend/app/schemas/auth.py](../../../backend/app/schemas/auth.py)

## Overview
**Priority:** P1
**Current Status:** Pending
**Estimated Effort:** 4 hours

Implement complete authentication flow including login, token management, auto-refresh, and protected routes.

## Key Insights
- Backend uses JWT with 15-minute access token expiration
- Refresh token rotation implemented on backend
- Admin role required for all admin endpoints
- Token must be included in Authorization header

## Requirements

### Functional Requirements
1. Login form with phone/password
2. JWT token storage (secure approach)
3. Automatic token refresh on expiration
4. Protected route wrapper
5. Logout functionality
6. Login state persistence

### Non-Functional Requirements
- Tokens stored securely (httpOnly cookie or secure localStorage)
- Automatic redirect to login on 401
- Clear error messages for auth failures
- Loading states during auth operations

## Architecture

### Auth Flow Diagram
```
User → Login Form → POST /auth/login
                    ↓
              { access_token, refresh_token, user }
                    ↓
              Store tokens securely
                    ↓
              Set Axios auth header
                    ↓
              Navigate to Dashboard

401 Response → Attempt token refresh
                ↓
          POST /auth/refresh
                ↓
          { access_token }
                ↓
          Retry original request
```

### Protected Route Pattern
```
App → ProtectedRoute → Check auth status
                          ↓ (not authenticated)
                       Redirect to /login
                          ↓ (authenticated)
                       Render child route
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `src/features/auth/components/login-form.tsx` | Login form component |
| `src/features/auth/components/protected-route.tsx` | Route protection wrapper |
| `src/features/auth/hooks/use-auth.ts` | Auth state hook |
| `src/features/auth/api/auth-api.ts` | Auth API calls |
| `src/features/auth/types/auth.types.ts` | Auth TypeScript types |
| `src/routes/auth.routes.tsx` | Auth route definitions |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `src/lib/api.ts` | Ensure auth interceptors work correctly |
| `src/App.tsx` | Add routing setup |

## Implementation Steps

### Step 1: Create Auth Types (20 min)
```typescript
// src/features/auth/types/auth.types.ts
import { UserRole } from '@/types/user.types'

export interface LoginCredentials {
  phone: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface User {
  id: string
  phone: string
  full_name: string
  email: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}
```

### Step 2: Create Auth API Service (30 min)
```typescript
// src/features/auth/api/auth-api.ts
import { api } from '@/lib/api'
import type {
  LoginCredentials,
  AuthResponse,
  TokenResponse,
  User,
} from '../types/auth.types'

export const authApi = {
  /**
   * Login with phone and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data
  },

  /**
   * Logout and invalidate refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refresh_token: refreshToken })
  },
}
```

### Step 3: Create Token Storage (30 min)
```typescript
// src/features/auth/lib/token-storage.ts
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

export const tokenStorage = {
  /**
   * Store auth tokens and user data
   */
  setTokens(authData: {
    access_token: string
    refresh_token: string
    user: unknown
  }): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token)
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user))
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  /**
   * Get stored user data
   */
  getUser(): unknown | null {
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  /**
   * Clear all auth data
   */
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  },
}
```

### Step 4: Create useAuth Hook (45 min)
```typescript
// src/features/auth/hooks/use-auth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '../api/auth-api'
import { tokenStorage } from '../lib/token-storage'
import { queryKeys } from '@/lib/query-keys'
import type { LoginCredentials, User } from '../types/auth.types'

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Get current user query
  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.auth.current,
    queryFn: () => authApi.getCurrentUser(),
    enabled: tokenStorage.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      tokenStorage.setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      })
      queryClient.setQueryData(queryKeys.auth.current, data.user)
      toast.success('Login successful')
      navigate('/')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    },
    onMutate: async () => {
      // Clear data immediately for better UX
      tokenStorage.clear()
      queryClient.clear()
      navigate('/login')
    },
    onSuccess: () => {
      toast.success('Logged out successfully')
    },
    onError: () => {
      // Still clear local data even if API call fails
      tokenStorage.clear()
      queryClient.clear()
    },
  })

  return {
    user: user as User | undefined,
    isAuthenticated: !!user,
    isLoading,
    login: loginMutation.mutate,
    logout: () => logoutMutation.mutate(),
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}
```

### Step 5: Create Login Form Component (60 min)
```typescript
// src/features/auth/components/login-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Lock, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+84\d{9}$/, 'Invalid Vietnamese phone number'),
  password: z.string()
    .min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login, isLoggingIn } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    login(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">PickAlo Admin</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+84xxxxxxxxx"
                  className="pl-10"
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

### Step 6: Create Protected Route Component (30 min)
```typescript
// src/features/auth/components/protected-route.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check admin role if required
  if (requireAdmin && user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

### Step 7: Create Auth Routes (15 min)
```typescript
// src/routes/auth.routes.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import { LoginForm } from '@/features/auth/components/login-form'
import { MainLayout } from '@/components/layout/main-layout'

// Lazy load protected routes
const Dashboard = lazy(() => import('@/features/dashboard/screens/dashboard-screen'))

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      // More routes will be added in subsequent phases
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
```

### Step 8: Update App.tsx (15 min)
```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { queryClient } from './lib/query-client'
import { AppRouter } from './routes/auth.routes'

import './index.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster position="top-right" richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
```

### Step 9: Add Required UI Components (30 min)
```bash
# Install shadcn/ui components
npx shadcn@latest add button input label card
npx shadcn@latest add toast sonner
```

### Step 10: Configure Backend CORS (15 min)
```python
# backend/app/core/config.py - Update CORS settings
from fastapi.middleware.cors import CORSMiddleware

# In main.py or config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Todo List
- [ ] Create auth TypeScript types
- [ ] Implement auth API service
- [ ] Create token storage utilities
- [ ] Build useAuth hook
- [ ] Create login form component
- [ ] Create protected route wrapper
- [ ] Setup auth routes
- [ ] Update App.tsx with router
- [ ] Add shadcn/ui components
- [ ] Configure backend CORS
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test token refresh
- [ ] Test protected routes

## Success Criteria
- [ ] Login form accepts valid credentials
- [ ] Successful login stores tokens
- [ ] Authenticated users can access protected routes
- [ ] Unauthenticated users redirected to login
- [ ] Logout clears tokens and redirects
- [ ] Token refresh works on 401 responses
- [ ] Admin role check prevents non-admin access
- [ ] Loading states display during auth operations

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Token theft from XSS | Consider httpOnly cookies, implement CSP |
| CORS issues | Configure backend CORS properly |
| Token refresh loops | Add retry limit to refresh logic |
| Stale tokens on page load | Check token validity on mount |

## Security Considerations
- Implement Content-Security-Policy headers
- Consider using httpOnly cookies for token storage
- Short access token expiration (15 min)
- Clear tokens on logout
- HTTPS only in production

## Next Steps
- Proceed to Phase 3: Dashboard Screen
- Test with real admin credentials
- Verify role-based access control

## Related Documentation
- [React Router v7 Docs](https://reactrouter.com/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Backend Auth Implementation](../../../backend/app/api/v1/endpoints/auth.py)
