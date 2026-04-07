---
title: "Sprint 10: React Native - Core & Navigation"
description: "React Native project setup, navigation structure, theme system, and core UI components"
status: pending
priority: P1
effort: 10h
tags: [react-native, navigation, ui-components, theme]
created: 2026-04-06
---

# Sprint 10: React Native - Core & Navigation

## Overview

Set up the React Native application foundation including navigation structure, theme system, core UI components, and API integration layer.

**Priority:** P1 (High - foundation for all frontend work)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 5: Tech Stack - React Native)
- Sprint 0: `./sprint-00-infrastructure-setup.md` (Frontend scaffold)

## Key Insights

1. **Role-Based Navigation**: Different flows for USER, MERCHANT, ADMIN
2. **Bottom Tabs**: Main navigation for authenticated users
3. **Stack Navigation**: Hierarchical screen flow
4. **Theme System**: Consistent colors, typography, spacing
5. **Type Safety**: TypeScript for all components

## Requirements

### Functional Requirements

1. **Navigation Structure**: Auth stack, app stack (role-based)
2. **Theme System**: Colors, typography, spacing, shadows
3. **Core Components**: Button, Input, Card, Modal, Loading
4. **API Client**: Axios instance with interceptors
5. **State Management**: Context or Zustand for auth state
6. **Storage**: AsyncStorage for tokens
7. **Error Handling**: Global error boundary
8. **Localization**: Vietnamese language support

### Non-Functional Requirements

1. **Performance**: Smooth 60fps navigation
2. **Type Safety**: Full TypeScript coverage
3. **Accessibility**: Proper labels, roles
4. **Responsive**: Different screen sizes

## Architecture

### Navigation Structure

```
Navigation Flow:
┌─────────────────────────────────────────────────────────────┐
│                      Root Navigation                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐      ┌──────────────────────────────┐  │
│  │  Auth Stack    │      │  App Stack (Authenticated)   │  │
│  │  - Login       │      │  ┌────────────────────────┐  │  │
│  │  - Register    │      │  │  User Tabs             │  │  │
│  │  - Forgot PW   │      │  │  - Home                │  │  │
│  └────────────────┘      │  │  - Venues (Map)        │  │  │
│                          │  │  - Bookings            │  │  │
│                          │  │  - Newsfeed            │  │  │
│                          │  │  - Profile             │  │  │
│                          │  └────────────────────────┘  │  │
│                          │                               │  │
│                          │  ┌────────────────────────┐  │  │
│                          │  │  Merchant Tabs         │  │  │
│                          │  │  - Dashboard           │  │  │
│                          │  │  - Venues              │  │  │
│                          │  │  - Bookings            │  │  │
│                          │  │  - Profile             │  │  │
│                          │  └────────────────────────┘  │  │
│                          │                               │  │
│                          │  ┌────────────────────────┐  │  │
│                          │  │  Admin Stack           │  │  │
│                          │  │  - Dashboard           │  │  │
│                          │  │  - Users               │  │  │
│                          │  │  - Venues              │  │  │
│                          │  │  - Posts               │  │  │
│                          │  └────────────────────────┘  │  │
│                          └──────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `frontend/src/navigation/types.ts` | Navigation type definitions |
| `frontend/src/navigation/auth-navigator.tsx` | Authentication stack |
| `frontend/src/navigation/user-tab-navigator.tsx` | User bottom tabs |
| `frontend/src/navigation/merchant-tab-navigator.tsx` | Merchant bottom tabs |
| `frontend/src/navigation/admin-navigator.tsx` | Admin stack |
| `frontend/src/navigation/app-navigator.tsx` | Main authenticated navigator |
| `frontend/src/navigation/root-navigator.tsx` | Root navigator |
| `frontend/src/theme/colors.ts` | Color tokens |
| `frontend/src/theme/typography.ts` | Typography tokens |
| `frontend/src/theme/spacing.ts` | Spacing tokens |
| `frontend/src/theme/index.ts` | Theme export |
| `frontend/src/components/button/button.tsx` | Button component |
| `frontend/src/components/input/input.tsx` | Input component |
| `frontend/src/components/card/card.tsx` | Card component |
| `frontend/src/components/loading/loading.tsx` | Loading indicator |
| `frontend/src/components/modal/modal.tsx` | Modal component |
| `frontend/src/services/api-client.ts` | Axios configuration |
| `frontend/src/services/auth-service.ts` | Auth API calls |
| `frontend/src/services/storage.ts` | AsyncStorage wrapper |
| `frontend/src/contexts/auth-context.tsx` | Auth state provider |
| `frontend/src/containers/error-boundary.tsx` | Error boundary |
| `frontend/src/types/api.ts` | API type definitions |

### Files to Modify

| Path | Changes |
|------|---------|
| `frontend/App.tsx` | Set up navigation |
| `frontend/package.json` | Add dependencies |

## Implementation Steps

### Step 1: Install Dependencies (1h)

```bash
cd frontend

# Navigation
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs

# Dependencies for navigation
npm install react-native-screens react-native-safe-area-context

# UI & Icons
npm install react-native-vector-icons
npm install @react-native-async-storage/async-storage

# HTTP & State
npm install axios
npm install zustand

# Utilities
npm install date-fns
npm install @react-native-community/netinfo

# WebView (for maps)
npm install react-native-webview
```

### Step 2: Create Theme System (1.5h)

1. Create `frontend/src/theme/colors.ts`:

```typescript
export const Colors = {
  // Brand colors
  primary: '#00A8E8',
  primaryDark: '#0077A3',
  primaryLight: '#4DC3F0',

  // Semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Surface colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',

  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textHint: '#9E9E9E',
  textDisabled: '#BDBDBD',

  // Status colors
  bookingPending: '#FF9800',
  bookingConfirmed: '#4CAF50',
  bookingCancelled: '#F44336',
  bookingCompleted: '#2196F3',
};

export const DarkColors = {
  // Dark mode colors (future)
};
```

2. Create `frontend/src/theme/typography.ts`:

```typescript
export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xl2: 24,
    xl3: 30,
    xl4: 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '600' as const,
  },
};
```

3. Create `frontend/src/theme/spacing.ts`:

```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xl2: 48,
  xl3: 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
```

### Step 3: Create API Client (1.5h)

1. Create `frontend/src/services/api-client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:8000/api/v1'  // Android emulator
  : 'https://api.alobo.vn/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, attempt refresh
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        await AsyncStorage.setItem('access_token', response.data.access_token);
      } catch (error) {
        // Refresh failed, logout
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      }
    }
  }

  public get() { return this.client.get; }
  public post() { return this.client.post; }
  public put() { return this.client.put; }
  public patch() { return this.client.patch; }
  public delete() { return this.client.delete; }
}

export const apiClient = new ApiClient();
```

### Step 4: Create Auth Context (1.5h)

1. Create `frontend/src/contexts/auth-context.tsx`:

```typescript
import React, { createContext, useContext, useState } from 'react';
import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api';
import { authService } from '@/services/auth-service';
import { storage } from '@/services/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  React.useEffect(() => {
    loadStoredUser();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    await storage.setTokens(response.access_token, response.refresh_token);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    await storage.clearTokens();
    setUser(null);
  };

  // ... other methods

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### Step 5: Create Core UI Components (2h)

1. Create `frontend/src/components/button/button.tsx`:

```typescript
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ... styles using theme tokens
});
```

2. Create other components: Input, Card, Loading, Modal

### Step 6: Create Navigation Structure (2h)

1. Create `frontend/src/navigation/auth-navigator.tsx`:

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/auth/login-screen';
import { RegisterScreen } from '@/screens/auth/register-screen';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

2. Create User, Merchant, Admin navigators
3. Create Root navigator that switches based on auth

### Step 7: Update App.tsx (30m)

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/auth-context';
import { RootNavigator } from '@/navigation/root-navigator';
import { ErrorBoundary } from '@/containers/error-boundary';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default App;
```

## Todo List

- [ ] Install React Native and dependencies
- [ ] Create theme system (colors, typography, spacing)
- [ ] Create API client with interceptors
- [ ] Create auth context and provider
- [ ] Create Button component
- [ ] Create Input component
- [ ] Create Card component
- [ ] Create Loading component
- [ ] Create Modal component
- [ ] Create Auth navigator
- [ ] Create User tab navigator
- [ ] Create Merchant tab navigator
- [ ] Create Admin navigator
- [ ] Create Root navigator
- [ ] Update App.tsx with navigation
- [ ] Test navigation flows

## Success Criteria

1. **Navigation**: Auth → App flow works
2. **Role Navigation**: Different tabs for different roles
3. **Theme**: Consistent styling across app
4. **API Client**: Requests go through with auth headers
5. **Auth State**: Login persists across app restart
6. **Components**: Reusable components render correctly
7. **Type Safety**: No TypeScript errors

## Test Scenarios

### Navigation
```typescript
// Test 1: Not logged in -> Auth stack
// Expected: Shows Login screen

// Test 2: Login as USER -> User tabs
// Expected: Shows Home, Venues, Bookings, Newsfeed, Profile tabs

// Test 3: Login as MERCHANT -> Merchant tabs
// Expected: Shows Dashboard, Venues, Bookings, Profile tabs

// Test 4: Login as ADMIN -> Admin stack
// Expected: Shows Dashboard, Users, Venues, Posts screens

// Test 5: Logout -> Auth stack
// Expected: Returns to Login screen
```

### Theme
```typescript
// Test 6: Button variants render
// Expected: primary, secondary, outline, text variants display correctly

// Test 7: Dark mode (future)
// Expected: Colors switch to dark theme
```

### API Client
```typescript
// Test 8: Authenticated request
// Expected: Bearer token added to headers

// Test 9: 401 response
// Expected: Token refresh attempted

// Test 10: Network error
// Expected: Handled gracefully
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Navigation state loss | Medium | Persist navigation state |
| Token refresh race | Medium | Queue requests during refresh |
| Type errors | High | Strict TypeScript config |
| Component re-renders | Low | React.memo where needed |

## Security Considerations

1. **Token Storage**: AsyncStorage (secure as possible)
2. **HTTPS Only**: Production API calls over HTTPS
3. **Certificate Pinning**: Future enhancement
4. **Screen Capture**: Prevent sensitive screens (optional)

## Next Steps

1. Sprint 11: User features (venues, bookings, newsfeed)
2. Sprint 12: Merchant features

## Dependencies

- Requires: Sprint 0 (Infrastructure)
- Requires: Sprint 2 (Auth API)
- Blocks: Sprint 11 (RN User Features)
- Blocks: Sprint 12 (RN Merchant Features)
- Blocks: Sprint 13 (RN Admin Features)
