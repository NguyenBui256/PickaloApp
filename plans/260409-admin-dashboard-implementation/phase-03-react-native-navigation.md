# Phase 3: React Native - Admin Navigation Structure

**Status:** Pending
**Priority:** P1
**Estimated Effort:** 4 hours

## Overview

Create the navigation structure for the admin dashboard in React Native. This includes the admin navigator, screen layouts, and route protection to ensure only admin users can access these screens.

## Related Files

### Files to Create
- `frontend/src/navigators/admin-navigator.tsx` - Admin stack navigator
- `frontend/src/screens/admin/admin-dashboard-screen.tsx` - Dashboard home
- `frontend/src/screens/admin/admin-users-screen.tsx` - User management
- `frontend/src/screens/admin/admin-merchants-screen.tsx` - Merchant management
- `frontend/src/screens/admin/admin-bookings-screen.tsx` - Booking oversight
- `frontend/src/screens/admin/admin-content-screen.tsx` - Content moderation
- `frontend/src/screens/admin/admin-audit-log-screen.tsx` - Audit history

### Files to Modify
- `frontend/src/navigators/app-navigator.tsx` - Add admin route
- `frontend/src/services/api/admin.ts` - Admin API client

---

## Implementation Steps

### Step 1: Create Admin API Client

**File:** `frontend/src/services/api/admin.ts`

```typescript
import { apiClient } from '../client';
import type {
  DashboardMetrics,
  UserListResponse,
  UserBanRequest,
  UserRoleUpdate,
  MerchantListResponse,
  VenueVerificationRequest,
  BookingListResponse,
  AdminBookingCancel,
  PostListResponse,
  ContentDelete,
  AuditLogResponse,
} from './types/admin';

// Dashboard
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data;
};

// User Management
export const listUsers = async (filters: {
  page?: number;
  limit?: number;
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
  search?: string;
}): Promise<UserListResponse> => {
  const response = await apiClient.get('/admin/users', { params: filters });
  return response.data;
};

export const banUser = async (
  userId: string,
  request: UserBanRequest
): Promise<{ message: string; user_id: string }> => {
  const response = await apiClient.patch(`/admin/users/${userId}/ban`, request);
  return response.data;
};

export const unbanUser = async (
  userId: string,
  reason: string
): Promise<{ message: string }> => {
  const response = await apiClient.patch(`/admin/users/${userId}/unban`, { reason });
  return response.data;
};

export const updateUserRole = async (
  userId: string,
  request: UserRoleUpdate
): Promise<{ message: string; new_role: string }> => {
  const response = await apiClient.patch(`/admin/users/${userId}/role`, request);
  return response.data;
};

// Merchant Management
export const listMerchants = async (filters: {
  page?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
}): Promise<MerchantListResponse> => {
  const response = await apiClient.get('/admin/merchants', { params: filters });
  return response.data;
};

export const verifyVenue = async (
  venueId: string,
  request: VenueVerificationRequest
): Promise<{ message: string; venue_id: string; is_verified: boolean }> => {
  const response = await apiClient.patch(`/admin/venues/${venueId}/verify`, request);
  return response.data;
};

// Booking Management
export const listAllBookings = async (filters: {
  page?: number;
  limit?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  venue_id?: string;
  user_id?: string;
}): Promise<BookingListResponse> => {
  const response = await apiClient.get('/admin/bookings', { params: filters });
  return response.data;
};

export const cancelBookingAdmin = async (
  bookingId: string,
  request: AdminBookingCancel
): Promise<{ message: string; booking_id: string }> => {
  const response = await apiClient.patch(`/admin/bookings/${bookingId}/cancel`, request);
  return response.data;
};

// Content Moderation
export const listPosts = async (filters: {
  page?: number;
  limit?: number;
  status?: string;
  sport_type?: string;
  reported?: boolean;
}): Promise<PostListResponse> => {
  const response = await apiClient.get('/admin/posts', { params: filters });
  return response.data;
};

export const deletePost = async (
  postId: string,
  request: ContentDelete
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/admin/posts/${postId}`, { data: request });
  return response.data;
};

export const deleteComment = async (
  commentId: string,
  request: ContentDelete
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/admin/comments/${commentId}`, { data: request });
  return response.data;
};

// Audit Log
export const getAuditLog = async (filters: {
  page?: number;
  limit?: number;
  action_type?: string;
  target_type?: string;
  admin_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<AuditLogResponse> => {
  const response = await apiClient.get('/admin/audit-log', { params: filters });
  return response.data;
};
```

### Step 2: Create Admin Type Definitions

**File:** `frontend/src/services/api/types/admin.ts`

```typescript
// Dashboard Metrics
export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    new_this_week: number;
    by_role: {
      USER: number;
      MERCHANT: number;
      ADMIN: number;
    };
  };
  venues: {
    total: number;
    verified: number;
    pending_verification: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    revenue: {
      vnd: number;
    };
  };
  content: {
    posts: number;
    comments: number;
    reported: number;
  };
}

// User Management Types
export interface UserListItem {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  role: 'USER' | 'MERCHANT' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  venue_count?: number; // For merchants
}

export interface UserListResponse {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserBanRequest {
  reason: string;
  duration_days?: number;
}

export interface UserRoleUpdate {
  role: 'USER' | 'MERCHANT' | 'ADMIN';
  reason: string;
}

// Merchant Management Types
export interface MerchantListItem extends UserListItem {
  venue_count: number;
  verified_venue_count: number;
  total_revenue: number;
}

export interface MerchantListResponse {
  items: MerchantListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface VenueVerificationRequest {
  verified: boolean;
  reason: string;
}

// Booking Management Types
export interface AdminBookingListItem {
  id: string;
  venue_id: string;
  venue_name: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  is_paid: boolean;
  created_at: string;
}

export interface BookingListResponse {
  items: AdminBookingListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminBookingCancel {
  reason: string;
}

// Content Moderation Types
export interface AdminPostListItem {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  post_type: 'RECRUITING' | 'LOOKING_FOR_TEAM' | 'SOCIAL';
  sport_type: string | null;
  title: string;
  content: string;
  district: string | null;
  status: 'ACTIVE' | 'CLOSED' | 'HIDDEN';
  created_at: string;
  report_count: number;
}

export interface PostListResponse {
  items: AdminPostListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ContentDelete {
  reason: string;
}

// Audit Log Types
export interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
```

### Step 3: Create Admin Navigator

**File:** `frontend/src/navigators/admin-navigator.tsx`

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminDashboardScreen from '@/screens/admin/admin-dashboard-screen';
import AdminUsersScreen from '@/screens/admin/admin-users-screen';
import AdminMerchantsScreen from '@/screens/admin/admin-merchants-screen';
import AdminBookingsScreen from '@/screens/admin/admin-bookings-screen';
import AdminContentScreen from '@/screens/admin/admin-content-screen';
import AdminAuditLogScreen from '@/screens/admin/admin-audit-log-screen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminMerchants: undefined;
  AdminBookings: undefined;
  AdminContent: undefined;
  AdminAuditLog: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: 'User Management' }}
      />
      <Stack.Screen
        name="AdminMerchants"
        component={AdminMerchantsScreen}
        options={{ title: 'Merchant Management' }}
      />
      <Stack.Screen
        name="AdminBookings"
        component={AdminBookingsScreen}
        options={{ title: 'Booking Management' }}
      />
      <Stack.Screen
        name="AdminContent"
        component={AdminContentScreen}
        options={{ title: 'Content Moderation' }}
      />
      <Stack.Screen
        name="AdminAuditLog"
        component={AdminAuditLogScreen}
        options={{ title: 'Audit Log' }}
      />
    </Stack.Navigator>
  );
};
```

### Step 4: Create Dashboard Screen

**File:** `frontend/src/screens/admin/admin-dashboard-screen.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { getDashboardMetrics } from '@/services/api/admin';
import type { DashboardMetrics } from '@/services/api/types/admin';
import AdminMetricCard from '@/components/admin/admin-metric-card';

const AdminDashboardScreen = ({ navigation }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionLabel}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminMerchants')}
          >
            <Text style={styles.actionIcon}>🏢</Text>
            <Text style={styles.actionLabel}>Merchants</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminBookings')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionLabel}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminContent')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>Content</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Metrics */}
      <View style={styles.section}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminUsers')}>
          <Text style={styles.sectionTitle}>Users</Text>
        </TouchableOpacity>
        <View style={styles.metricRow}>
          <AdminMetricCard
            title="Total Users"
            value={metrics?.users.total ?? 0}
            subtitle="+{metrics?.users.new_this_week ?? 0} this week"
            color="#4f46e5"
          />
          <AdminMetricCard
            title="Active Users"
            value={metrics?.users.active ?? 0}
            subtitle="Currently active"
            color="#10b981"
          />
        </View>
        <View style={styles.metricRow}>
          <AdminMetricCard
            title="Regular Users"
            value={metrics?.users.by_role.USER ?? 0}
            subtitle="Player accounts"
            color="#6366f1"
          />
          <AdminMetricCard
            title="Merchants"
            value={metrics?.users.by_role.MERCHANT ?? 0}
            subtitle="Venue owners"
            color="#f59e0b"
          />
        </View>
      </View>

      {/* Venue Metrics */}
      <View style={styles.section}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminMerchants')}>
          <Text style={styles.sectionTitle}>Venues</Text>
        </TouchableOpacity>
        <View style={styles.metricRow}>
          <AdminMetricCard
            title="Total Venues"
            value={metrics?.venues.total ?? 0}
            subtitle="Registered venues"
            color="#8b5cf6"
          />
          <AdminMetricCard
            title="Verified"
            value={metrics?.venues.verified ?? 0}
            subtitle={`${metrics?.venues.pending_verification ?? 0} pending`}
            color="#10b981"
          />
        </View>
      </View>

      {/* Booking Metrics */}
      <View style={styles.section}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminBookings')}>
          <Text style={styles.sectionTitle}>Bookings</Text>
        </TouchableOpacity>
        <View style={styles.metricRow}>
          <AdminMetricCard
            title="Total Bookings"
            value={metrics?.bookings.total ?? 0}
            subtitle="All time"
            color="#3b82f6"
          />
          <AdminMetricCard
            title="Pending"
            value={metrics?.bookings.pending ?? 0}
            subtitle="Need attention"
            color="#f59e0b"
          />
        </View>
        <View style={styles.metricRow}>
          <AdminMetricCard
            title="Confirmed"
            value={metrics?.bookings.confirmed ?? 0}
            subtitle="Approved bookings"
            color="#10b981"
          />
          <AdminMetricCard
            title="Revenue"
            value={metrics?.bookings.revenue.vnd ?? 0}
            subtitle="Total VND"
            format="currency"
            color="#059669"
          />
        </View>
      </View>

      {/* Content Metrics */}
      <View style={styles.section}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminContent')}>
          <Text style={styles.sectionTitle}>Content</Text>
        </TouchableOpacity>
        <View style={styles.metricRow}>
          <AdminMetricCard
            title="Posts"
            value={metrics?.content.posts ?? 0}
            subtitle="Community posts"
            color="#6366f1"
          />
          <AdminMetricCard
            title="Comments"
            value={metrics?.content.comments ?? 0}
            subtitle="All comments"
            color="#8b5cf6"
          />
        </View>
        {metrics?.content.reported ?? 0 > 0 && (
          <AdminMetricCard
            title="Reported Content"
            value={metrics?.content.reported ?? 0}
            subtitle="Needs review"
            color="#ef4444"
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
});

export default AdminDashboardScreen;
```

### Step 5: Create User Management Screen

**File:** `frontend/src/screens/admin/admin-users-screen.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

import { listUsers, banUser, unbanUser, updateUserRole } from '@/services/api/admin';
import type { UserListItem } from '@/services/api/types/admin';
import AdminUserItem from '@/components/admin/admin-user-item';
import AdminFilterBar from '@/components/admin/admin-filter-bar';

const AdminUsersScreen = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    role: null as string | null,
    is_active: null as boolean | null,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listUsers({
        page,
        limit: 20,
        ...filters,
      });
      setUsers(page === 1 ? response.items : [...users, ...response.items]);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBan = useCallback(async (userId: string, userName: string) => {
    Alert.prompt(
      `Ban ${userName}`,
      'Enter reason for banning this user:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await banUser(userId, { reason });
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to ban user');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [loadUsers]);

  const handleUnban = useCallback(async (userId: string) => {
    Alert.prompt(
      'Unban User',
      'Enter reason for unbanning:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await unbanUser(userId, reason);
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to unban user');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [loadUsers]);

  const handleRoleChange = useCallback(async (userId: string, currentRole: string) => {
    const roles = ['USER', 'MERCHANT', 'ADMIN'].filter(r => r !== currentRole);

    Alert.alert(
      'Change Role',
      'Select new role:',
      roles.map(role => ({
        text: role,
        onPress: async () => {
          Alert.prompt(
            `Change to ${role}`,
            'Enter reason for role change:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Change',
                onPress: async (reason) => {
                  if (!reason) return;
                  try {
                    await updateUserRole(userId, { role: role as any, reason });
                    loadUsers();
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update role');
                  }
                },
              },
            ],
            'plain-text'
          );
        },
      }))
    );
  }, [loadUsers]);

  const renderItem = ({ item }: { item: UserListItem }) => (
    <AdminUserItem
      user={item}
      onBan={() => handleBan(item.id, item.full_name)}
      onUnban={() => handleUnban(item.id)}
      onRoleChange={() => handleRoleChange(item.id, item.role)}
    />
  );

  return (
    <View style={styles.container}>
      <AdminFilterBar
        searchPlaceholder="Search by name, phone, email..."
        filters={filters}
        onFilterChange={setFilters}
        onSearch={() => setPage(1)}
      />

      {loading && users.length === 0 ? (
        <ActivityIndicator style={styles.center} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (users.length < total) {
              setPage(p => p + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
          contentContainerStyle={users.length === 0 ? styles.center : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
  },
});

export default AdminUsersScreen;
```

### Step 6: Create Other Admin Screens

**File:** `frontend/src/screens/admin/admin-merchants-screen.tsx`
**File:** `frontend/src/screens/admin/admin-bookings-screen.tsx`
**File:** `frontend/src/screens/admin/admin-content-screen.tsx`
**File:** `frontend/src/screens/admin/admin-audit-log-screen.tsx`

(Similar structure to user management screen, adapted for each domain)

---

## Success Criteria

- [ ] Admin API client created with all endpoints
- [ ] Type definitions for all admin data structures
- [ ] Admin navigator with all screens
- [ ] Dashboard screen displays metrics
- [ ] User management screen with list and actions
- [ ] Route protection for admin-only access
- [ ] Navigation between admin screens working

---

## Security Checklist

- [ ] Admin role verification before navigation
- [ ] API calls include authentication tokens
- [ ] Sensitive operations require confirmation
- [ ] Audit trail for all admin actions
- [ ] Proper error handling and user feedback

