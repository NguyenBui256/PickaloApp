# Phase 4: React Native - Dashboard UI Components

**Status:** Pending
**Priority:** P1
**Estimated Effort:** 5 hours

## Overview

Create reusable UI components for the admin dashboard. These components will be used across multiple admin screens and provide a consistent visual design for displaying metrics, charts, tables, and filters.

## Related Files

### Files to Create
- `frontend/src/components/admin/admin-metric-card.tsx` - Metric display card
- `frontend/src/components/admin/admin-chart.tsx` - Chart visualization
- `frontend/src/components/admin/admin-table.tsx` - Data table with pagination
- `frontend/src/components/admin/admin-filter-bar.tsx` - Filter and search controls
- `frontend/src/components/admin/admin-user-item.tsx` - User list item
- `frontend/src/components/admin/admin-booking-item.tsx` - Booking list item
- `frontend/src/components/admin/admin-venue-item.tsx` - Venue list item
- `frontend/src/components/admin/admin-post-item.tsx` - Post list item

---

## Implementation Steps

### Step 1: Admin Metric Card Component

**File:** `frontend/src/components/admin/admin-metric-card.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AdminMetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color?: string;
  format?: 'number' | 'currency' | 'percent';
}

const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  title,
  value,
  subtitle,
  color = '#4f46e5',
  format = 'number',
}) => {
  const formatValue = (val: number): string => {
    if (format === 'currency') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(val);
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{formatValue(value)}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    minHeight: 80,
  },
  title: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
});

export default AdminMetricCard;
```

### Step 2: Admin Chart Component

**File:** `frontend/src/components/admin/admin-chart.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';

interface AdminChartProps {
  type: 'line' | 'bar';
  data: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  height?: number;
  color?: string;
}

const AdminChart: React.FC<AdminChartProps> = ({
  type,
  data,
  height = 200,
  color = '#4f46e5',
}) => {
  const chartConfig = {
    backgroundColor: '#1e1e2e',
    backgroundGradientFrom: '#1e1e2e',
    backgroundGradientTo: '#1e1e2e',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
  };

  const commonProps = {
    data,
    width: 350,
    height,
    chartConfig,
    style: styles.chart,
    withVerticalLabels: true,
    withHorizontalLabels: true,
  };

  if (type === 'line') {
    return (
      <View style={styles.container}>
        <LineChart
          {...commonProps}
          bezier
          withDots
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarChart
        {...commonProps}
        showValuesOnTopOfBars
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
});

export default AdminChart;
```

### Step 3: Admin Filter Bar Component

**File:** `frontend/src/components/admin/admin-filter-bar.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface FilterOption {
  label: string;
  value: string | boolean | null;
}

interface AdminFilterBarProps {
  searchPlaceholder?: string;
  filters: {
    search?: string;
    role?: string | null;
    status?: string | null;
    is_active?: boolean | null;
    [key: string]: any;
  };
  onFilterChange: (filters: any) => void;
  onSearch: () => void;
  filterOptions?: {
    role?: FilterOption[];
    status?: FilterOption[];
  };
}

const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  searchPlaceholder = 'Search...',
  filters,
  onFilterChange,
  onSearch,
  filterOptions,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const handleSearch = () => {
    onFilterChange({ ...filters, search: localSearch });
    onSearch();
  };

  const setFilter = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor="#6b7280"
          value={localSearch}
          onChangeText={setLocalSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      {filterOptions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.role && (
            <View style={styles.filterGroup}>
              {filterOptions.role.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.filterPill,
                    filters.role === option.value && styles.activeFilterPill,
                  ]}
                  onPress={() =>
                    setFilter(
                      'role',
                      filters.role === option.value ? null : option.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      filters.role === option.value && styles.activeFilterPillText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {filterOptions.status && (
            <View style={styles.filterGroup}>
              {filterOptions.status.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.filterPill,
                    filters.status === option.value && styles.activeFilterPill,
                  ]}
                  onPress={() =>
                    setFilter(
                      'status',
                      filters.status === option.value ? null : option.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      filters.status === option.value && styles.activeFilterPillText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Active Status Toggle */}
          {filters.is_active !== undefined && (
            <View style={styles.filterGroup}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filters.is_active === true && styles.activeFilterPill,
                ]}
                onPress={() => setFilter('is_active', filters.is_active === true ? null : true)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filters.is_active === true && styles.activeFilterPillText,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filters.is_active === false && styles.activeFilterPill,
                ]}
                onPress={() => setFilter('is_active', filters.is_active === false ? null : false)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filters.is_active === false && styles.activeFilterPillText,
                  ]}
                >
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Clear Filters */}
      {(filters.search || filters.role || filters.status) && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onFilterChange({})}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d3d',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2d2d3d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 16,
  },
  filterScroll: {
    marginHorizontal: -4,
  },
  filterContent: {
    paddingHorizontal: 4,
  },
  filterGroup: {
    flexDirection: 'row',
    marginRight: 8,
  },
  filterPill: {
    backgroundColor: '#2d2d3d',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  activeFilterPill: {
    backgroundColor: '#4f46e5',
  },
  filterPillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterPillText: {
    color: '#fff',
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 12,
  },
});

export default AdminFilterBar;
```

### Step 4: Admin User Item Component

**File:** `frontend/src/components/admin/admin-user-item.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import type { UserListItem } from '@/services/api/types/admin';

interface AdminUserItemProps {
  user: UserListItem;
  onBan?: () => void;
  onUnban?: () => void;
  onRoleChange?: () => void;
  onPress?: () => void;
}

const AdminUserItem: React.FC<AdminUserItemProps> = ({
  user,
  onBan,
  onUnban,
  onRoleChange,
  onPress,
}) => {
  const roleColors: Record<string, string> = {
    USER: '#6366f1',
    MERCHANT: '#f59e0b',
    ADMIN: '#ef4444',
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <TouchableOpacity
      style={[styles.container, !user.is_active && styles.inactiveContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.full_name}</Text>
          <Text style={styles.phone}>{user.phone}</Text>
        </View>
        <View style={styles.badges}>
          <View
            style={[styles.roleBadge, { backgroundColor: roleColors[user.role] }]}
          >
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
          {!user.is_active && (
            <View style={styles.bannedBadge}>
              <Text style={styles.bannedText}>BANNED</Text>
            </View>
          )}
          {!user.is_verified && (
            <View style={styles.unverifiedBadge}>
              <Text style={styles.unverifiedText}>UNVERIFIED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.details}>
        {user.email && <Text style={styles.detail}>📧 {user.email}</Text>}
        <Text style={styles.detail}>📅 Joined {formatDate(user.created_at)}</Text>
        {user.venue_count !== undefined && (
          <Text style={styles.detail}>🏢 {user.venue_count} venues</Text>
        )}
      </View>

      <View style={styles.actions}>
        {user.is_active ? (
          onBan && (
            <TouchableOpacity style={styles.banButton} onPress={onBan}>
              <Text style={styles.banButtonText}>Ban User</Text>
            </TouchableOpacity>
          )
        ) : (
          onUnban && (
            <TouchableOpacity style={styles.unbanButton} onPress={onUnban}>
              <Text style={styles.unbanButtonText}>Unban</Text>
            </TouchableOpacity>
          )
        )}
        {onRoleChange && (
          <TouchableOpacity style={styles.roleButton} onPress={onRoleChange}>
            <Text style={styles.roleButtonText}>Change Role</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#2d2d3d',
  },
  inactiveContainer: {
    opacity: 0.6,
    borderColor: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    color: '#9ca3af',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  bannedBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  unverifiedBadge: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unverifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  details: {
    marginBottom: 10,
  },
  detail: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  banButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  banButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  unbanButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  unbanButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdminUserItem;
```

### Step 5: Admin Booking Item Component

**File:** `frontend/src/components/admin/admin-booking-item.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import type { AdminBookingListItem } from '@/services/api/types/admin';

interface AdminBookingItemProps {
  booking: AdminBookingListItem;
  onCancel?: () => void;
  onPress?: () => void;
}

const AdminBookingItem: React.FC<AdminBookingItemProps> = ({
  booking,
  onCancel,
  onPress,
}) => {
  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#10b981',
    CANCELLED: '#ef4444',
    COMPLETED: '#6366f1',
    EXPIRED: '#6b7280',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    EXPIRED: 'Expired',
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: statusColors[booking.status] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.bookingInfo}>
          <Text style={styles.venueName}>{booking.venue_name}</Text>
          <Text style={styles.date}>
            📅 {formatDate(booking.booking_date)} • {booking.start_time} - {booking.end_time}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColors[booking.status] }]}
        >
          <Text style={styles.statusText}>{statusLabels[booking.status]}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detail}>
          👤 {booking.user_name} • {booking.user_phone}
        </Text>
        <Text style={styles.detail}>
          💰 {formatCurrency(booking.total_price)}
          {booking.is_paid && ' ✅ Paid'}
        </Text>
        <Text style={styles.detail}>
          🆔 {booking.id.slice(0, 8)}...
        </Text>
      </View>

      {booking.is_cancelable && onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  details: {
    marginBottom: 8,
  },
  detail: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdminBookingItem;
```

### Step 6: Additional List Item Components

**File:** `frontend/src/components/admin/admin-venue-item.tsx`
**File:** `frontend/src/components/admin/admin-post-item.tsx`

(Similar structure to booking item, adapted for venues and posts)

---

## Component Dependencies

Install required packages:
```bash
npm install react-native-chart-kit
npm install react-native-svg
```

---

## Success Criteria

- [ ] AdminMetricCard displays numbers, currency, percentages
- [ ] AdminChart renders line and bar charts
- [ ] AdminFilterBar with search and filter pills
- [ ] AdminUserItem shows user info and actions
- [ ] AdminBookingItem shows booking details and status
- [ ] All components follow design system
- [ ] Components are reusable and configurable

---

## Design System Reference

**Colors:**
- Background: `#0f0f1a` (primary), `#1e1e2e` (card)
- Primary: `#4f46e5` (indigo)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Error: `#ef4444` (red)
- Text: `#fff` (primary), `#9ca3af` (secondary)

**Typography:**
- Headers: 18-24px, fontWeight: 600-700
- Body: 14px, fontWeight: 400
- Small: 11-12px, fontWeight: 500

**Spacing:**
- Cards: 12-16px padding
- Gaps: 8-12px between elements
- Margins: 16px horizontal

**Border Radius:**
- Cards: 12px
- Buttons: 6-8px
- Pills: 16px

