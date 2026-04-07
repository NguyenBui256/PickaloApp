---
title: "Sprint 12: React Native - Merchant Features"
description: "Merchant dashboard screens for venue management, booking approval, and revenue tracking"
status: pending
priority: P1
effort: 12h
tags: [react-native, merchant-screens, dashboard]
created: 2026-04-06
---

# Sprint 12: React Native - Merchant Features

## Overview

Implement merchant-facing screens including dashboard with analytics, venue management, booking queue for approval, and revenue tracking.

**Priority:** P1 (High - essential for merchant operations)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.3: Merchant features)
- Sprint 3: `./sprint-03-venue-management.md` (Venue APIs)
- Sprint 8: `./sprint-08-merchant-dashboard.md` (Dashboard APIs)
- Sprint 10: `./sprint-10-rn-core.md` (Core setup)

## Key Insights

1. **Dashboard First**: Merchants need quick overview of today's business
2. **Booking Queue**: Quick approve/reject actions are critical
3. **Revenue Focus**: Clear revenue breakdown and trends
4. **Multi-Venue**: Merchants may have multiple venues

## Requirements

### Functional Requirements

1. **Dashboard**: Today's stats, revenue, pending actions
2. **Venue Management**: List, add, edit venues, maintenance mode
3. **Booking Queue**: Pending bookings requiring approval
4. **Booking Management**: View, approve, reject, cancel bookings
5. **Revenue Analytics**: Charts/trends, export CSV
6. **Service Management**: Add/remove venue services
7. **Profile**: Merchant profile and settings

### Non-Functional Requirements

1. **Performance**: Dashboard loads quickly
2. **Real-time**: Optional WebSocket for live booking updates
3. **Offline**: Cache data for offline viewing

## Architecture

### Screen Structure

```
Merchant Tab Navigator:
├── Dashboard Tab
│   ├── MerchantDashboardScreen
│   │   ├── Today's Stats (revenue, bookings)
│   │   ├── Pending Actions
│   │   └── Revenue Chart
│   │
├── Venues Tab
│   ├── MerchantVenuesScreen (list)
│   ├── VenueDetailScreen (management view)
│   │   ├── Venue Info
│   │   ├── Services List
│   │   ├── Pricing Tiers
│   │   └── Actions (Edit, Maintenance)
│   ├── AddVenueScreen
│   └── EditVenueScreen
│   │
├── Bookings Tab
│   ├── MerchantBookingsScreen (list with filters)
│   ├── BookingQueueScreen (pending only)
│   ├── BookingDetailScreen (merchant view)
│   │   ├── Booking Info
│   │   ├── Customer Info
│   │   └── Actions (Approve, Reject)
│   │
├── Revenue Tab
│   ├── RevenueOverviewScreen
│   │   ├── Revenue Charts
│   │   └── Breakdown by venue/service
│   ├── RevenueExportScreen
│   └── OccupancyReportScreen
│   │
└── Profile Tab
    ├── MerchantProfileScreen
    └── SettingsScreen
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `frontend/src/screens/merchant/merchant-dashboard-screen.tsx` | Dashboard overview |
| `frontend/src/screens/merchant/merchant-venues-screen.tsx` | Venue list |
| `frontend/src/screens/merchant/venue-management-screen.tsx` | Venue detail (edit) |
| `frontend/src/screens/merchant/add-venue-screen.tsx` | Add new venue |
| `frontend/src/screens/merchant/booking-queue-screen.tsx` | Pending bookings |
| `frontend/src/screens/merchant/merchant-bookings-screen.tsx` | All bookings |
| `frontend/src/screens/merchant/booking-action-screen.tsx` | Approve/reject |
| `frontend/src/screens/merchant/revenue-overview-screen.tsx` | Revenue analytics |
| `frontend/src/screens/merchant/revenue-export-screen.tsx` | Export CSV |
| `frontend/src/screens/merchant/merchant-profile-screen.tsx` | Merchant profile |
| `frontend/src/components/dashboard-stat-card/dashboard-stat-card.tsx` | Stat display |
| `frontend/src/components/booking-queue-item/booking-queue-item.tsx` | Queue item |
| `frontend/src/components/revenue-chart/revenue-chart.tsx` | Revenue visualization |
| `frontend/src/services/merchant-service.ts` | Merchant API calls |

### Files to Modify

| Path | Changes |
|------|---------|
| `frontend/src/navigation/merchant-tab-navigator.tsx` | Add all screens |

## Implementation Steps

### Step 1: Create Merchant Service (1h)

1. Create `frontend/src/services/merchant-service.ts`:

```typescript
import { apiClient } from './api-client';

export const merchantService = {
  // Dashboard
  getDashboard: () =>
    apiClient.get()('/merchant/dashboard'),

  getStats: (period: 'today' | 'week' | 'month') =>
    apiClient.get()('/merchant/dashboard/stats', { params: { period } }),

  getRevenue: (params: RevenueParams) =>
    apiClient.get()('/merchant/dashboard/revenue', { params }),

  // Venues
  getMyVenues: () =>
    apiClient.get()('/merchant/venues'),

  createVenue: (data: CreateVenueRequest) =>
    apiClient.post()('/merchant/venues', data),

  updateVenue: (id: string, data: UpdateVenueRequest) =>
    apiClient.put()(`/merchant/venues/${id}`, data),

  setMaintenance: (id: string, isMaintenance: boolean, reason?: string) =>
    apiClient.post()(`/merchant/venues/${id}/maintenance`, {
      is_maintenance: isMaintenance,
      reason,
    }),

  // Bookings
  getPendingBookings: () =>
    apiClient.get()('/merchant/bookings/pending'),

  getBookings: (params: BookingFilters) =>
    apiClient.get()('/merchant/bookings', { params }),

  approveBooking: (id: string) =>
    apiClient.post()(`/merchant/bookings/${id}/approve`),

  rejectBooking: (id: string, reason: string) =>
    apiClient.post()(`/merchant/bookings/${id}/reject`, { reason }),

  cancelBooking: (id: string, reason: string) =>
    apiClient.post()(`/merchant/bookings/${id}/cancel`, { reason }),

  // Revenue
  getRevenueAnalytics: (params: DateRangeParams) =>
    apiClient.get()('/merchant/revenue', { params }),

  exportRevenueCSV: (params: DateRangeParams) =>
    apiClient.get()('/merchant/revenue/export', {
      params,
      responseType: 'blob',
    }),
};
```

### Step 2: Create Dashboard Screen (2h)

1. Create `frontend/src/screens/merchant/merchant-dashboard-screen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text, DashboardStatCard, BookingQueueItem } from '@/components';
import { merchantService } from '@/services/merchant-service';

export function MerchantDashboardScreen({ navigation }: any) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await merchantService.getDashboard();
      setDashboard(data);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    await merchantService.approveBooking(bookingId);
    loadDashboard(); // Refresh
  };

  const handleRejectBooking = async (bookingId: string) => {
    await merchantService.rejectBooking(bookingId, 'Không còn trống');
    loadDashboard();
  };

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard />}
    >
      {/* Today's Stats */}
      <View style={styles.statsGrid}>
        <DashboardStatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(dashboard?.today.revenue)}
          trend={dashboard?.today.revenueGrowth}
        />
        <DashboardStatCard
          title="Đặt sân"
          value={dashboard?.today.bookings}
          subtitle={`${dashboard?.today.confirmed} đã xác nhận`}
        />
        <DashboardStatCard
          title="Chờ duyệt"
          value={dashboard?.today.pending}
          color="warning"
          onPress={() => navigation.navigate('BookingQueue')}
        />
        <DashboardStatCard
          title="Hoàn thành"
          value={dashboard?.today.completed}
          color="success"
        />
      </View>

      {/* Pending Bookings */}
      {dashboard?.pendingBookings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="h3">Chờ duyệt</Text>
            <Text variant="link" onPress={() => navigation.navigate('BookingQueue')}>
              Xem tất cả
            </Text>
          </View>
          {dashboard.pendingBookings.slice(0, 3).map(booking => (
            <BookingQueueItem
              key={booking.id}
              booking={booking}
              onApprove={() => handleApproveBooking(booking.id)}
              onReject={() => handleRejectBooking(booking.id)}
            />
          ))}
        </View>
      )}

      {/* Revenue Chart */}
      <View style={styles.section}>
        <Text variant="h3">Doanh thu tuần này</Text>
        <RevenueChart data={dashboard?.week.revenueByDay} />
      </View>
    </ScrollView>
  );
}
```

### Step 3: Create Venue Management Screens (2.5h)

1. **Merchant Venues Screen**: List of merchant's venues with quick stats

```typescript
export function MerchantVenuesScreen({ navigation }: any) {
  const [venues, setVenues] = useState<MerchantVenue[]>([]);

  return (
    <FlatList
      data={venues}
      renderItem={({ item }) => (
        <VenueCard
          venue={item}
          onPress={() => navigation.navigate('VenueManagement', { venueId: item.id })}
        />
      )}
      ListHeaderComponent={() => (
        <Button
          title="Thêm sân mới"
          icon="plus"
          onPress={() => navigation.navigate('AddVenue')}
        />
      )}
    />
  );
}
```

2. **Venue Management Screen**: Edit venue, manage services, pricing

```typescript
export function VenueManagementScreen({ route, navigation }: any) {
  const { venueId } = route.params;
  const [venue, setVenue] = useState<Venue | null>(null);

  const toggleMaintenance = async () => {
    await merchantService.setMaintenance(
      venueId,
      !venue.is_maintenance,
      venue.is_maintenance ? '' : 'Bảo trì'
    );
    loadVenue();
  };

  return (
    <ScrollView>
      <Text variant="h2">{venue?.name}</Text>

      <View style={styles.statusRow}>
        <Text>Trạng thái:</Text>
        {venue?.is_maintenance ? (
          <Button title="Đang bảo trì" variant="outline" color="warning" />
        ) : (
          <Button title="Hoạt động" variant="outline" color="success" />
        )}
        <Button
          title={venue?.is_maintenance ? 'Mở lại' : 'Bảo trì'}
          onPress={toggleMaintenance}
        />
      </View>

      <Text variant="h3">Dịch vụ</Text>
      {venue?.services.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={() => navigation.navigate('EditService', { serviceId: service.id })}
          onDelete={() => handleDeleteService(service.id)}
        />
      ))}
      <Button
        title="Thêm dịch vụ"
        variant="outline"
        onPress={() => navigation.navigate('AddService', { venueId })}
      />

      <Text variant="h3">Giá theo khung giờ</Text>
      {venue?.pricing_tiers.map(tier => (
        <PricingTierCard
          key={tier.id}
          tier={tier}
          onEdit={() => navigation.navigate('EditPricing', { tierId: tier.id })}
        />
      ))}
    </ScrollView>
  );
}
```

3. **Add Venue Screen**: Multi-step form for new venue

### Step 4: Create Booking Queue Screen (2h)

1. **Booking Queue Screen**: Pending bookings with quick actions

```typescript
export function BookingQueueScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const handleApprove = async (bookingId: string) => {
    await merchantService.approveBooking(bookingId);
    // Remove from list
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const handleReject = async (bookingId: string) => {
    Alert.prompt('Lý do từ chối', '', async (reason) => {
      if (reason) {
        await merchantService.rejectBooking(bookingId, reason);
        setBookings(prev => prev.filter(b => b.id !== bookingId));
      }
    });
  };

  return (
    <FlatList
      data={bookings}
      renderItem={({ item }) => (
        <BookingQueueItem
          booking={item}
          onApprove={() => handleApprove(item.id)}
          onReject={() => handleReject(item.id)}
          onPress={() => navigation.navigate('MerchantBookingDetail', { bookingId: item.id })}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text>Không có booking chờ duyệt</Text>
        </View>
      }
    />
  );
}
```

### Step 5: Create Revenue Screens (2h)

1. **Revenue Overview Screen**: Charts and breakdowns

```typescript
export function RevenueOverviewScreen({ navigation }: any) {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  return (
    <ScrollView>
      {/* Period Selector */}
      <SegmentedControl
        values={['Tuần', 'Tháng', 'Tùy chỉnh']}
        selectedIndex={periodIndex}
        onChange={handlePeriodChange}
      />

      {/* Revenue Chart */}
      <View style={styles.chartContainer}>
        <Text variant="h3">Doanh thu</Text>
        <RevenueChart data={revenue?.byDate} />
      </View>

      {/* Breakdown by Venue */}
      <View style={styles.section}>
        <Text variant="h3">Theo sân</Text>
        {revenue?.byVenue.map(item => (
          <RevenueBreakdownItem
            key={item.venue_id}
            label={item.venue_name}
            value={item.revenue}
            percent={item.percent}
          />
        ))}
      </View>

      {/* Breakdown by Service */}
      <View style={styles.section}>
        <Text variant="h3">Dịch vụ</Text>
        {revenue?.byService.map(item => (
          <RevenueBreakdownItem
            key={item.service_id}
            label={item.service_name}
            value={item.revenue}
          />
        ))}
      </View>

      <Button
        title="Xuất báo cáo"
        onPress={() => navigation.navigate('RevenueExport')}
      />
    </ScrollView>
  );
}
```

2. **Revenue Export Screen**: Date range picker and export

### Step 6: Create Merchant Profile (1h)

```typescript
export function MerchantProfileScreen({ navigation }: any) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  return (
    <ScrollView>
      <View style={styles.header}>
        <Avatar source={{ uri: merchant?.avatar_url }} size="large" />
        <Text variant="h2">{merchant?.full_name}</Text>
        <Text variant="body">{merchant?.email}</Text>
      </View>

      <MenuItem
        label="Chỉnh sửa hồ sơ"
        icon="edit"
        onPress={() => navigation.navigate('EditProfile')}
      />
      <MenuItem
        label="Cài đặt"
        icon="settings"
        onPress={() => navigation.navigate('Settings')}
      />
      <MenuItem
        label="Trung tâm trợ giúp"
        icon="help"
        onPress={() => navigation.navigate('Help')}
      />
      <MenuItem
        label="Đăng xuất"
        icon="logout"
        onPress={handleLogout}
        color="error"
      />
    </ScrollView>
  );
}
```

### Step 7: Create Components (2.5h)

1. **DashboardStatCard**: Display stats with trend
2. **BookingQueueItem**: Booking with approve/reject buttons
3. **RevenueChart**: Line or bar chart for revenue
4. **ServiceCard**: Service with edit/delete
5. **MenuItem**: Menu item for profile

## Todo List

- [ ] Create merchant service layer
- [ ] Create Dashboard screen with stats
- [ ] Create Merchant Venues list screen
- [ ] Create Venue Management screen
- [ ] Create Add Venue multi-step form
- [ ] Create Booking Queue screen
- [ ] Create Merchant Bookings list
- [ ] Create Revenue Overview with charts
- [ ] Create Revenue Export screen
- [ ] Create Merchant Profile screen
- [ ] Create DashboardStatCard component
- [ ] Create BookingQueueItem component
- [ ] Create RevenueChart component
- [ ] Create ServiceCard component
- [ ] Test all merchant flows

## Success Criteria

1. **Dashboard**: Loads with today's stats and pending bookings
2. **Booking Queue**: Can approve/reject bookings
3. **Venue Management**: Can edit venue, manage services
4. **Maintenance Mode**: Toggle works correctly
5. **Revenue**: Charts display, export works
6. **Profile**: Can view/edit merchant profile
7. **Navigation**: All screens navigate correctly

## Test Scenarios

### Dashboard
```typescript
// Test 1: Dashboard loads
// Expected: Shows today's revenue, bookings, pending

// Test 2: Approve booking from dashboard
// Expected: Booking approved, removed from pending

// Test 3: Tap on venue
// Expected: Opens venue management screen
```

### Venue Management
```typescript
// Test 4: List my venues
// Expected: Shows all merchant's venues

// Test 5: Edit venue
// Expected: Changes saved

// Test 6: Toggle maintenance
// Expected: Venue marked as maintenance

// Test 7: Add service
// Expected: Service added to venue

// Test 8: Edit pricing tier
// Expected: Pricing updated
```

### Booking Queue
```typescript
// Test 9: List pending bookings
// Expected: Shows bookings needing approval

// Test 10: Approve booking
// Expected: Booking confirmed

// Test 11: Reject booking with reason
// Expected: Booking rejected with reason
```

### Revenue
```typescript
// Test 12: View revenue by venue
// Expected: Shows breakdown

// Test 13: Export CSV
// Expected: File downloads
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slow dashboard queries | Medium | Optimize API queries |
| Chart library size | Low | Use lightweight chart lib |
| Large venue lists | Medium | Pagination |

## Security Considerations

1. **Ownership**: Verify merchant owns venue before actions
2. **Rate Limiting**: Prevent rapid booking approvals
3. **Data Validation**: Validate all venue updates

## Next Steps

1. Sprint 13: Admin features
2. Sprint 14: Integration testing

## Dependencies

- Requires: Sprint 3 (Venue APIs)
- Requires: Sprint 8 (Merchant Dashboard APIs)
- Requires: Sprint 10 (RN Core)
- Blocks: Sprint 14 (Integration Testing)
