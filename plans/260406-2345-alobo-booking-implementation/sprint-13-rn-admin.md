---
title: "Sprint 13: React Native - Admin Features"
description: "Admin dashboard screens for platform management, user moderation, and content control"
status: pending
priority: P2
effort: 8h
tags: [react-native, admin-screens, moderation]
created: 2026-04-06
---

# Sprint 13: React Native - Admin Features

## Overview

Implement admin-facing screens for platform management including user moderation, venue verification, content control, and system analytics.

**Priority:** P2 (Medium - essential for platform governance)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.5: Admin features)
- Sprint 9: `./sprint-09-admin-dashboard.md` (Admin APIs)
- Sprint 10: `./sprint-10-rn-core.md` (Core setup)

## Key Insights

1. **Platform Overview**: Admin needs system-wide visibility
2. **Moderation Focus**: Quick actions for banning, hiding, verifying
3. **Audit Trail**: View admin action log
4. **Simplified UI**: Admin features can be functional over pretty

## Requirements

### Functional Requirements

1. **Admin Dashboard**: Platform stats, recent activity
2. **User Management**: List, view, ban/unban users
3. **Venue Verification**: Approve/reject pending venues
4. **Content Moderation**: Hide/delete reported posts
5. **Admin Log**: View audit trail of admin actions
6. **Reports**: View and resolve user reports

### Non-Functional Requirements

1. **Performance**: Large lists need pagination
2. **Access Control**: Strict admin-only access
3. **Data Safety**: Confirmation for destructive actions

## Architecture

### Screen Structure

```
Admin Stack Navigator:
├── AdminDashboardScreen
│   ├── Platform Stats
│   ├── Recent Activity
│   └── Quick Actions
│
├── UserManagementScreen (list with search)
├── UserDetailScreen
│   ├── User Info
│   ├── Activity Summary
│   └── Actions (Ban/Unban)
│
├── VenueVerificationScreen (pending list)
├── VenueDetailForApprovalScreen
│   ├── Venue Info
│   ├── Merchant Info
│   └── Actions (Verify/Reject)
│
├── PostModerationScreen (reported posts)
├── PostDetailForModerationScreen
│   ├── Post Content
│   ├── Reports
│   └── Actions (Hide/Delete)
│
├── AdminActionLogScreen
├── ReportsScreen
└── AdminProfileScreen
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `frontend/src/screens/admin/admin-dashboard-screen.tsx` | Admin dashboard |
| `frontend/src/screens/admin/user-management-screen.tsx` | User list |
| `frontend/src/screens/admin/user-detail-screen.tsx` | User details |
| `frontend/src/screens/admin/venue-verification-screen.tsx` | Pending venues |
| `frontend/src/screens/admin/venue-approval-screen.tsx` | Venue approve/reject |
| `frontend/src/screens/admin/post-moderation-screen.tsx` | Reported posts |
| `frontend/src/screens/admin/post-moderation-detail-screen.tsx` | Post actions |
| `frontend/src/screens/admin/admin-action-log-screen.tsx` | Audit trail |
| `frontend/src/screens/admin/reports-screen.tsx` | All reports |
| `frontend/src/components/admin-stat-card/admin-stat-card.tsx` | Platform stats |
| `frontend/src/components/user-item/user-item.tsx` | User list item |
| `frontend/src/components/venue-approval-card/venue-approval-card.tsx` | Venue approval |
| `frontend/src/services/admin-service.ts` | Admin API calls |

### Files to Modify

| Path | Changes |
|------|---------|
| `frontend/src/navigation/admin-navigator.tsx` | Add all screens |

## Implementation Steps

### Step 1: Create Admin Service (1h)

1. Create `frontend/src/services/admin-service.ts`:

```typescript
import { apiClient } from './api-client';

export const adminService = {
  // Dashboard
  getDashboard: () =>
    apiClient.get()('/admin/dashboard'),

  getStats: (period: 'today' | 'week' | 'month') =>
    apiClient.get()('/admin/stats', { params: { period } }),

  // Users
  getUsers: (params: UserFilters) =>
    apiClient.get()('/admin/users', { params }),

  getUserDetails: (id: string) =>
    apiClient.get()(`/admin/users/${id}`),

  banUser: (id: string, reason: string, durationDays?: number) =>
    apiClient.post()(`/admin/users/${id}/ban`, { reason, duration_days: durationDays }),

  unbanUser: (id: string) =>
    apiClient.post()(`/admin/users/${id}/unban`),

  // Venues
  getPendingVenues: () =>
    apiClient.get()('/admin/venues/pending'),

  verifyVenue: (id: string) =>
    apiClient.post()(`/admin/venues/${id}/verify`),

  rejectVenue: (id: string, reason: string) =>
    apiClient.post()(`/admin/venues/${id}/reject`, { reason }),

  deleteVenue: (id: string, reason: string) =>
    apiClient.delete()(`/admin/venues/${id}`, { data: { reason } }),

  // Posts
  getReportedPosts: () =>
    apiClient.get()('/admin/posts/reported'),

  hidePost: (id: string, reason: string) =>
    apiClient.post()(`/admin/posts/${id}/hide`, { reason }),

  deletePost: (id: string, reason: string) =>
    apiClient.delete()(`/admin/posts/${id}`, { data: { reason } }),

  // Actions
  getActionLog: (params: ActionLogFilters) =>
    apiClient.get()('/admin/actions/log', { params }),

  // Reports
  getReports: (params: ReportFilters) =>
    apiClient.get()('/admin/reports', { params }),

  resolveReport: (id: string, action: string) =>
    apiClient.post()(`/admin/reports/${id}/resolve`, { action_taken: action }),
};
```

### Step 2: Create Admin Dashboard (1.5h)

1. Create `frontend/src/screens/admin/admin-dashboard-screen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, AdminStatCard } from '@/components';
import { adminService } from '@/services/admin-service';

export function AdminDashboardScreen({ navigation }: any) {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const data = await adminService.getDashboard();
    setDashboard(data);
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="h1">Admin Dashboard</Text>

      {/* Platform Stats */}
      <View style={styles.statsGrid}>
        <AdminStatCard
          title="Tổng người dùng"
          value={dashboard?.platform.total_users}
          trend={dashboard?.growth.users_growth}
          onPress={() => navigation.navigate('UserManagement')}
        />
        <AdminStatCard
          title="Chủ sân"
          value={dashboard?.platform.total_merchants}
        />
        <AdminStatCard
          title="Sân bóng"
          value={dashboard?.platform.total_venues}
          onPress={() => navigation.navigate('VenueVerification')}
        />
        <AdminStatCard
          title="Đặt sân"
          value={dashboard?.platform.total_bookings}
        />
        <AdminStatCard
          title="Doanh thu"
          value={formatCurrency(dashboard?.platform.total_revenue)}
          trend={dashboard?.growth.revenue_growth}
        />
        <AdminStatCard
          title="Bài báo cáo"
          value={dashboard?.recent.reported_posts}
          color="warning"
          onPress={() => navigation.navigate('PostModeration')}
        />
      </View>

      {/* Pending Actions */}
      {dashboard?.recent.new_venues_pending > 0 && (
        <View style={styles.alertCard}>
          <Text variant="h3">{dashboard.recent.new_venues_pending} sân chờ duyệt</Text>
          <Button
            title="Xem ngay"
            onPress={() => navigation.navigate('VenueVerification')}
          />
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text variant="h3">Hoạt động gần đây</Text>
        {dashboard?.recent.activity.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </View>
    </ScrollView>
  );
}
```

### Step 3: Create User Management (1.5h)

1. **User Management Screen**: List with search and filters

```typescript
export function UserManagementScreen({ navigation }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<UserFilters>({ role: null, status: null });

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} />

      <View style={styles.filters}>
        <Chip
          label="Tất cả"
          selected={!filters.role}
          onPress={() => setFilters({ ...filters, role: null })}
        />
        <Chip
          label="Người chơi"
          selected={filters.role === 'USER'}
          onPress={() => setFilters({ ...filters, role: 'USER' })}
        />
        <Chip
          label="Chủ sân"
          selected={filters.role === 'MERCHANT'}
          onPress={() => setFilters({ ...filters, role: 'MERCHANT' })}
        />
      </View>

      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            onPress={() => navigation.navigate('UserDetail', { userId: item.id })}
          />
        )}
        onEndReached={loadMore}
      />
    </View>
  );
}
```

2. **User Detail Screen**: User info with ban/unban action

```typescript
export function UserDetailScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);

  const handleBan = async () => {
    Alert.prompt('Lý do cấm', '', async (reason) => {
      if (reason) {
        await adminService.banUser(userId, reason);
        loadUser();
      }
    });
  };

  const handleUnban = async () => {
    await adminService.unbanUser(userId);
    loadUser();
  };

  return (
    <ScrollView>
      <View style={styles.header}>
        <Avatar source={{ uri: user?.avatar_url }} size="xlarge" />
        <Text variant="h2">{user?.full_name}</Text>
        <Text variant="body">{user?.phone}</Text>
        <StatusBadge status={user?.is_active ? 'active' : 'banned'} />
      </View>

      <View style={styles.section}>
        <Text variant="h3">Thông tin</Text>
        <InfoRow label="Vai trò" value={user?.role} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Ngày tham gia" value={formatDate(user?.created_at)} />
        {user?.banned_at && (
          <InfoRow label="Ngày bị cấm" value={formatDate(user.banned_at)} />
        )}
        {user?.ban_reason && (
          <InfoRow label="Lý do" value={user.ban_reason} />
        )}
      </View>

      <View style={styles.section}>
        <Text variant="h3">Thống kê</Text>
        <InfoRow label="Số lần đặt sân" value={user?.stats?.booking_count} />
        <InfoRow label="Số bài đăng" value={user?.stats?.post_count} />
      </View>

      <View style={styles.actions}>
        {user?.is_active ? (
          <Button
            title="Cấm người dùng"
            color="error"
            onPress={handleBan}
          />
        ) : (
          <Button
            title="Bỏ cấm"
            color="success"
            onPress={handleUnban}
          />
        )}
      </View>
    </ScrollView>
  );
}
```

### Step 4: Create Venue Verification (1.5h)

1. **Venue Verification Screen**: List of pending venues

```typescript
export function VenueVerificationScreen({ navigation }: any) {
  const [venues, setVenues] = useState<PendingVenue[]>([]);

  return (
    <FlatList
      data={venues}
      renderItem={({ item }) => (
        <VenueApprovalCard
          venue={item}
          onPress={() => navigation.navigate('VenueApproval', { venueId: item.id })}
          onQuickApprove={handleQuickApprove}
          onQuickReject={handleQuickReject}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text>Không có sân chờ duyệt</Text>
        </View>
      }
    />
  );
}
```

2. **Venue Approval Screen**: Detailed view with verify/reject

```typescript
export function VenueApprovalScreen({ route, navigation }: any) {
  const { venueId } = route.params;
  const [venue, setVenue] = useState<Venue | null>(null);

  const handleVerify = async () => {
    await adminService.verifyVenue(venueId);
    navigation.goBack();
  };

  const handleReject = async () => {
    Alert.prompt('Lý do từ chối', '', async (reason) => {
      if (reason) {
        await adminService.rejectVenue(venueId, reason);
        navigation.goBack();
      }
    });
  };

  return (
    <ScrollView>
      {/* Venue Info */}
      <Text variant="h2">{venue?.name}</Text>
      <Text>{venue?.address}</Text>
      <Text>{venue?.district}</Text>

      {/* Images */}
      <ScrollView horizontal>
        {venue?.images.map(img => (
          <Image key={img} source={{ uri: img }} style={styles.image} />
        ))}
      </ScrollView>

      {/* Merchant Info */}
      <View style={styles.section}>
        <Text variant="h3">Chủ sân</Text>
        <Text>{venue?.merchant.full_name}</Text>
        <Text>{venue?.merchant.phone}</Text>
        <Text>{venue?.merchant.email}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Từ chối"
          variant="outline"
          color="error"
          onPress={handleReject}
        />
        <Button
          title="Xác nhận"
          color="success"
          onPress={handleVerify}
        />
      </View>
    </ScrollView>
  );
}
```

### Step 5: Create Post Moderation (1h)

1. **Post Moderation Screen**: Reported posts

```typescript
export function PostModerationScreen({ navigation }: any) {
  const [posts, setPosts] = useState<ReportedPost[]>([]);

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          reportCount={item.report_count}
          onPress={() => navigation.navigate('PostModerationDetail', { postId: item.id })}
        />
      )}
    />
  );
}
```

2. **Post Moderation Detail**: Post with hide/delete actions

```typescript
export function PostModerationDetailScreen({ route, navigation }: any) {
  const { postId } = route.params;
  const [post, setPost] = useState<Post | null>(null);

  const handleHide = async () => {
    Alert.prompt('Lý do ẩn bài', '', async (reason) => {
      if (reason) {
        await adminService.hidePost(postId, reason);
        navigation.goBack();
      }
    });
  };

  const handleDelete = async () => {
    Alert.alert('Xác nhận', 'Xóa bài này?', [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await adminService.deletePost(postId, 'Vi phạm tiêu chuẩn cộng đồng');
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView>
      <PostDetailContent post={post} />

      <View style={styles.section}>
        <Text variant="h3">Báo cáo ({post?.reports.length})</Text>
        {post?.reports.map(report => (
          <ReportItem key={report.id} report={report} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="Ẩn bài viết"
          variant="outline"
          onPress={handleHide}
        />
        <Button
          title="Xóa bài viết"
          color="error"
          onPress={handleDelete}
        />
      </View>
    </ScrollView>
  );
}
```

### Step 6: Create Admin Action Log (30m)

```typescript
export function AdminActionLogScreen({ navigation }: any) {
  const [actions, setActions] = useState<AdminAction[]>([]);

  return (
    <FlatList
      data={actions}
      renderItem={({ item }) => (
        <ActionLogItem
          admin={item.admin_name}
          action={item.action_type}
          target={item.target_type}
          reason={item.reason}
          timestamp={item.created_at}
        />
      )}
    />
  );
}
```

### Step 7: Create Components (1h)

1. **AdminStatCard**: Platform stat with trend
2. **UserItem**: User list item with status
3. **VenueApprovalCard**: Pending venue with quick actions
4. **ActionLogItem**: Audit log entry

## Todo List

- [ ] Create admin service layer
- [ ] Create Admin Dashboard screen
- [ ] Create User Management list screen
- [ ] Create User Detail screen with ban/unban
- [ ] Create Venue Verification list
- [ ] Create Venue Approval detail screen
- [ ] Create Post Moderation list
- [ ] Create Post Moderation detail screen
- [ ] Create Admin Action Log screen
- [ ] Create Reports screen
- [ ] Create AdminStatCard component
- [ ] Create UserItem component
- [ ] Create VenueApprovalCard component
- [ ] Test all admin flows

## Success Criteria

1. **Dashboard**: Platform stats load correctly
2. **User Management**: Can list, view, ban/unban users
3. **Venue Verification**: Can approve/reject venues
4. **Post Moderation**: Can hide/delete posts
5. **Action Log**: Shows admin actions
6. **Access Control**: Only admin can access screens
7. **Navigation**: All screens navigate correctly

## Test Scenarios

### Dashboard
```typescript
// Test 1: Admin dashboard loads
// Expected: Shows platform stats

// Test 2: Tap on user count
// Expected: Opens User Management
```

### User Management
```typescript
// Test 3: List users
// Expected: Shows user list

// Test 4: Filter by role
// Expected: Shows filtered list

// Test 5: View user details
// Expected: Shows full user info

// Test 6: Ban user
// Expected: User banned, status updated

// Test 7: Unban user
// Expected: User active again
```

### Venue Verification
```typescript
// Test 8: List pending venues
// Expected: Shows unverified venues

// Test 9: Approve venue
// Expected: Venue verified

// Test 10: Reject venue
// Expected: Venue rejected with reason
```

### Post Moderation
```typescript
// Test 11: List reported posts
// Expected: Shows reported posts with count

// Test 12: Hide post
// Expected: Post hidden

// Test 13: Delete post
// Expected: Post deleted
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental bans | High | Confirmation dialogs |
| Slow admin queries | Medium | Pagination, caching |
| Missing audit logs | High | Mandatory logging |

## Security Considerations

1. **Admin Role Check**: Verify admin role on every screen
2. **Action Confirmation**: Require confirmation for destructive actions
3. **Audit Logging**: Log all admin actions
4. **Session Timeout**: Shorter timeout for admin

## Next Steps

1. Sprint 14: Integration testing

## Dependencies

- Requires: Sprint 9 (Admin Dashboard APIs)
- Requires: Sprint 10 (RN Core)
- Blocks: Sprint 14 (Integration Testing)
