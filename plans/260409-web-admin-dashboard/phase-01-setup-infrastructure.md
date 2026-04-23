---
title: "Phase 1: Project Setup & Infrastructure"
description: "Initialize Vite + React + TypeScript project with shadcn/ui"
status: pending
priority: P1
effort: 4h
tags: [setup, infrastructure, vite]
---

# Phase 1: Project Setup & Infrastructure

## Context Links
- Main Plan: [plan.md](./plan.md)
- Backend APIs: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/admin.py](../../../backend/app/api/v1/endpoints/admin.py)
- Auth Endpoints: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/auth.py](../../../backend/app/api/v1/endpoints/auth.py)

## Overview
**Priority:** P1
**Current Status:** Pending
**Estimated Effort:** 4 hours

Initialize the web admin dashboard project with modern tooling and configure the foundation for all subsequent phases.

## Key Insights
- Backend APIs are 100% complete and tested
- Use Vite for fast development (faster than CRA)
- shadcn/ui provides modern, accessible components
- TanStack Query handles server state efficiently

## Requirements

### Functional Requirements
1. Initialize Vite + React 19 + TypeScript project
2. Configure TailwindCSS for styling
3. Setup shadcn/ui component library
4. Configure TanStack Query for data fetching
5. Setup React Router v7 for routing
6. Create base layout with sidebar navigation
7. Configure Axios with auth interceptors

### Non-Functional Requirements
- Bundle size < 500KB (gzipped)
- First Contentful Paint < 1.5s
- TypeScript strict mode enabled
- ESLint + Prettier configured

## Architecture

### Project Structure
```
web-admin/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.tsx                    # Entry point
    ├── App.tsx                     # Root component
    ├── lib/
    │   ├── api.ts                  # Axios instance
    │   ├── query-client.ts         # TanStack Query setup
    │   ├── query-keys.ts           # Query keys factory
    │   └── utils.ts                # Helper functions
    ├── components/
    │   ├── ui/                     # shadcn/ui components
    │   └── layout/
    │       ├── sidebar.tsx
    │       ├── header.tsx
    │       └── main-layout.tsx
    ├── routes/
    │   └── index.tsx               # Route definitions
    └── types/
        └── api.types.ts            # API types
```

### Data Flow
```
Component → useQuery → API Service → Axios → Backend
         ← useMutation ←           ←          ←
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `web-admin/vite.config.ts` | Vite configuration |
| `web-admin/tailwind.config.js` | TailwindCSS configuration |
| `web-admin/tsconfig.json` | TypeScript configuration |
| `web-admin/src/lib/api.ts` | Axios instance with interceptors |
| `web-admin/src/lib/query-client.ts` | TanStack Query setup |
| `web-admin/src/lib/query-keys.ts` | Query keys factory pattern |
| `web-admin/src/components/layout/main-layout.tsx` | Main layout wrapper |
| `web-admin/src/components/layout/sidebar.tsx` | Navigation sidebar |
| `web-admin/src/components/layout/header.tsx` | Top header bar |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `docker-compose.yml` | Add web-admin service |
| `.gitignore` | Add web-admin exclusions |

## Implementation Steps

### Step 1: Initialize Vite Project (30 min)
```bash
cd D:/PTIT/PickaloApp
npm create vite@latest web-admin -- --template react-ts
cd web-admin
npm install
```

### Step 2: Install Dependencies (30 min)
```bash
# Core dependencies
npm install react-router-dom@7
npm install @tanstack/react-query@5
npm install axios
npm install react-hook-form
npm install zod

# UI dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @tailwindcss/typography
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# shadcn/ui setup
npm install -D @types/node
npx shadcn@latest init
```

### Step 3: Configure TailwindCSS (15 min)
```javascript
// tailwind.config.js
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
```

### Step 4: Setup TanStack Query (30 min)
```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 10 * 60 * 1000,       // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### Step 5: Create API Client (45 min)
```typescript
// src/lib/api.ts
import axios from 'axios'
import type { AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosError & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`
          }
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
```

### Step 6: Create Query Keys Factory (15 min)
```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  // Auth
  auth: {
    current: ['auth', 'current'] as const,
  },
  // Dashboard
  dashboard: {
    metrics: ['dashboard', 'metrics'] as const,
    revenue: (start: string, end: string) =>
      ['dashboard', 'revenue', start, end] as const,
    bookings: (start: string, end: string) =>
      ['dashboard', 'bookings', start, end] as const,
    users: (start: string, end: string) =>
      ['dashboard', 'users', start, end] as const,
    venues: (start: string, end: string, limit: number) =>
      ['dashboard', 'venues', start, end, limit] as const,
  },
  // Users
  users: {
    all: (params: Record<string, unknown>) =>
      ['users', 'all', params] as const,
    detail: (id: string) => ['users', id] as const,
  },
  // Venues
  venues: {
    all: (params: Record<string, unknown>) =>
      ['venues', 'all', params] as const,
    detail: (id: string) => ['venues', id] as const,
  },
  // Bookings
  bookings: {
    all: (params: Record<string, unknown>) =>
      ['bookings', 'all', params] as const,
    detail: (id: string) => ['bookings', id] as const,
  },
  // Content
  posts: (params: Record<string, unknown>) =>
    ['posts', 'all', params] as const,
  comments: (params: Record<string, unknown>) =>
    ['comments', 'all', params] as const,
  // Audit
  auditLog: (params: Record<string, unknown>) =>
    ['audit', 'all', params] as const,
} as const
```

### Step 7: Create Layout Components (45 min)

**Main Layout:**
```typescript
// src/components/layout/main-layout.tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

**Sidebar:**
```typescript
// src/components/layout/sidebar.tsx
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Building, Calendar, MessageSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/venues', label: 'Venues', icon: Building },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/content', label: 'Content', icon: MessageSquare },
  { href: '/audit', label: 'Audit Log', icon: FileText },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">PickAlo Admin</h1>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

**Header:**
```typescript
// src/components/layout/header.tsx
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { api } from '@/lib/api'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { data: user } = useQuery({
    queryKey: queryKeys.auth.current,
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data.data
    },
  })

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-6">
        <div className="text-sm text-muted-foreground">
          Welcome back, {user?.full_name || 'Admin'}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            {user?.email}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
```

### Step 8: Setup Environment Variables (15 min)
```bash
# .env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Step 9: Configure ESLint and Prettier (15 min)
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "prettier"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Step 10: Update Docker Compose (15 min)
```yaml
# docker-compose.yml - add web-admin service
services:
  web-admin:
    build:
      context: ./web-admin
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://backend:8000/api/v1
    volumes:
      - ./web-admin:/app
      - /app/node_modules
```

## Todo List
- [ ] Initialize Vite project with React + TypeScript
- [ ] Install and configure TailwindCSS
- [ ] Setup shadcn/ui
- [ ] Configure TanStack Query
- [ ] Setup React Router
- [ ] Create API client with auth interceptors
- [ ] Create query keys factory
- [ ] Build main layout component
- [ ] Build sidebar navigation
- [ ] Build header component
- [ ] Configure ESLint and Prettier
- [ ] Update docker-compose.yml
- [ ] Test development server

## Success Criteria
- [ ] Development server starts without errors
- [ ] TailwindCSS classes work correctly
- [ ] Sidebar navigation renders
- [ ] API client configured with interceptors
- [ ] TanStack Query configured
- [ ] TypeScript strict mode enabled
- [ ] All imports resolve correctly

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| shadcn/ui setup issues | Follow official docs, use npx init |
| CORS errors | Configure backend CORS settings |
| Path alias issues | Configure tsconfig paths correctly |

## Security Considerations
- Enable TypeScript strict mode
- Configure CSP headers in Vite
- Use environment variables for API URL
- No credentials in source code

## Next Steps
- Proceed to Phase 2: Authentication Flow
- Test API connectivity
- Verify CORS configuration

## Related Documentation
- [Vite Documentation](https://vitejs.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
