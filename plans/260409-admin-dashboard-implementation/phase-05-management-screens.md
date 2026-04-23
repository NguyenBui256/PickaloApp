# Phase 5: React Native - Management Screens

**Status:** Pending
**Priority:** P1
**Estimated Effort:** 5 hours

## Overview

Implement the remaining admin management screens that provide full CRUD capabilities and workflows for user management, merchant verification, booking oversight, and content moderation.

## Related Files

### Files to Create
- `frontend/src/screens/admin/admin-merchants-screen.tsx` - Merchant management
- `frontend/src/screens/admin/admin-bookings-screen.tsx` - Booking oversight
- `frontend/src/screens/admin/admin-content-screen.tsx` - Content moderation
- `frontend/src/screens/admin/admin-audit-log-screen.tsx` - Audit history

### Components to Create
- `frontend/src/components/admin/admin-venue-item.tsx` - Venue list item
- `frontend/src/components/admin/admin-post-item.tsx` - Post list item
- `frontend/src/components/admin/admin-audit-item.tsx` - Audit log item
- `frontend/src/components/modals/admin-user-detail-modal.tsx` - User detail modal
- `frontend/src/components/modals/admin-venue-verify-modal.tsx` - Venue verification modal

---

## Implementation Steps

### Step 1: Merchant Management Screen

**File:** `frontend/src/screens/admin/admin-merchants-screen.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

import { listMerchants, verifyVenue } from '@/services/api/admin';
import type { MerchantListItem } from '@/services/api/types/admin';
import AdminVenueItem from '@/components/admin/admin-venue-item';
import AdminFilterBar from '@/components/admin/admin-filter-bar';

const AdminMerchantsScreen = ({ navigation }) => {
  const [merchants, setMerchants] = useState<MerchantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    is_active: null as boolean | null,
  });

  const loadMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listMerchants({
        page,
        limit: 20,
        ...filters,
      });
      setMerchants(page === 1 ? response.items : [...merchants, ...response.items]);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load merchants:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  React.useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  const handleVerifyVenue = useCallback(async (venueId: string, venueName: string) => {
    Alert.alert(
      `Verify ${venueName}?`,
      'This venue will be marked as verified and visible to all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              await verifyVenue(venueId, {
                verified: true,
                reason: 'Venue verified by admin',
              });
              loadMerchants();
            } catch (error) {
              Alert.alert('Error', 'Failed to verify venue');
            }
          },
        },
      ]
    );
  }, [loadMerchants]);

  const handleUnverifyVenue = useCallback(async (venueId: string, venueName: string) => {
    Alert.prompt(
      `Unverify ${venueName}`,
      'Enter reason for unverifying this venue:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unverify',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await verifyVenue(venueId, {
                verified: false,
                reason,
              });
              loadMerchants();
            } catch (error) {
              Alert.alert('Error', 'Failed to unverify venue');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [loadMerchants]);

  const renderItem = ({ item }: { item: MerchantListItem }) => (
    <AdminVenueItem
      merchant={item}
      onVerify={(venueId, venueName) => handleVerifyVenue(venueId, venueName)}
      onUnverify={(venueId, venueName) => handleUnverifyVenue(venueId, venueName)}
      onPress={() => navigation.navigate('AdminVenues', { userId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <AdminFilterBar
        searchPlaceholder="Search merchants by name, phone..."
        filters={filters}
        onFilterChange={setFilters}
        onSearch={() => setPage(1)}
      />

      {loading && merchants.length === 0 ? (
        <ActivityIndicator style={styles.center} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          data={merchants}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (merchants.length < total) {
              setPage(p => p + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
          contentContainerStyle={merchants.length === 0 ? styles.center : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No merchants found</Text>
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

export default AdminMerchantsScreen;
```

### Step 2: Booking Management Screen

**File:** `frontend/src/screens/admin/admin-bookings-screen.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  listAllBookings,
  cancelBookingAdmin,
} from '@/services/api/admin';
import type { AdminBookingListItem } from '@/services/api/types/admin';
import AdminBookingItem from '@/components/admin/admin-booking-item';
import AdminFilterBar from '@/components/admin/admin-filter-bar';

const AdminBookingsScreen = () => {
  const [bookings, setBookings] = useState<AdminBookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: null as string | null,
    date_from: null as string | null,
    date_to: null as string | null,
    search: '',
  });

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listAllBookings({
        page,
        limit: 20,
        ...filters,
      });
      setBookings(page === 1 ? response.items : [...bookings, ...response.items]);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  React.useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancelBooking = useCallback(async (bookingId: string, venueName: string) => {
    Alert.prompt(
      `Cancel booking at ${venueName}?`,
      'This action cannot be undone. Enter reason for cancellation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await cancelBookingAdmin(bookingId, { reason });
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [loadBookings]);

  const statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const renderItem = ({ item }: { item: AdminBookingListItem }) => (
    <AdminBookingItem
      booking={item}
      onCancel={
        item.is_cancelable
          ? () => handleCancelBooking(item.id, item.venue_name)
          : undefined
      }
      onPress={() => {
        /* Navigate to booking detail */
      }}
    />
  );

  return (
    <View style={styles.container}>
      <AdminFilterBar
        searchPlaceholder="Search by venue, user..."
        filters={filters}
        onFilterChange={setFilters}
        onSearch={() => setPage(1)}
        filterOptions={{
          status: statusOptions,
        }}
      />

      {loading && bookings.length === 0 ? (
        <ActivityIndicator style={styles.center} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (bookings.length < total) {
              setPage(p => p + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
          contentContainerStyle={bookings.length === 0 ? styles.center : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No bookings found</Text>
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

export default AdminBookingsScreen;
```

### Step 3: Content Moderation Screen

**File:** `frontend/src/screens/admin/admin-content-screen.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  SegmentedControlIOS,
} from 'react-native';

import {
  listPosts,
  deletePost,
  deleteComment,
} from '@/services/api/admin';
import type { AdminPostListItem } from '@/services/api/types/admin';
import AdminPostItem from '@/components/admin/admin-post-item';
import AdminFilterBar from '@/components/admin/admin-filter-bar';

type ContentType = 'posts' | 'comments';

const AdminContentScreen = () => {
  const [contentType, setContentType] = useState<ContentType>('posts');
  const [items, setItems] = useState<AdminPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: null as string | null,
    reported: false,
  });

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listPosts({
        page,
        limit: 20,
        ...filters,
      });
      setItems(page === 1 ? response.items : [...items, ...response.items]);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters, contentType]);

  React.useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleDeletePost = useCallback(async (postId: string, title: string) => {
    Alert.prompt(
      `Delete post "${title}"?`,
      'Enter reason for deletion:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await deletePost(postId, { reason });
              loadContent();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [loadContent]);

  const handleHidePost = useCallback(async (postId: string, title: string) => {
    Alert.prompt(
      `Hide post "${title}"?`,
      'Enter reason for hiding:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          onPress: async (reason) => {
            if (!reason) return;
            try {
              await deletePost(postId, { reason });
              loadContent();
            } catch (error) {
              Alert.alert('Error', 'Failed to hide post');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [loadContent]);

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Hidden', value: 'HIDDEN' },
  ];

  const renderItem = ({ item }: { item: AdminPostListItem }) => (
    <AdminPostItem
      post={item}
      onDelete={() => handleDeletePost(item.id, item.title)}
      onHide={() => handleHidePost(item.id, item.title)}
      onPress={() => {
        /* Navigate to post detail */
      }}
    />
  );

  return (
    <View style={styles.container}>
      {/* Content Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, contentType === 'posts' && styles.activeTypeButton]}
          onPress={() => {
            setContentType('posts');
            setPage(1);
            setItems([]);
          }}
        >
          <Text
            style={[
              styles.typeButtonText,
              contentType === 'posts' && styles.activeTypeButtonText,
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, contentType === 'comments' && styles.activeTypeButton]}
          onPress={() => {
            setContentType('comments');
            setPage(1);
            setItems([]);
          }}
        >
          <Text
            style={[
              styles.typeButtonText,
              contentType === 'comments' && styles.activeTypeButtonText,
            ]}
          >
            Comments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reported Toggle */}
      <TouchableOpacity
        style={[
          styles.reportedToggle,
          filters.reported && styles.reportedToggleActive,
        ]}
        onPress={() => setFilters({ ...filters, reported: !filters.reported })}
      >
        <Text
          style={[
            styles.reportedToggleText,
            filters.reported && styles.reportedToggleTextActive,
          ]}
        >
          {filters.reported ? '🚩 Showing Reported Only' : '🚩 Show Reported Content'}
        </Text>
      </TouchableOpacity>

      <AdminFilterBar
        searchPlaceholder="Search content..."
        filters={filters}
        onFilterChange={setFilters}
        onSearch={() => setPage(1)}
        filterOptions={{ status: statusOptions }}
      />

      {loading && items.length === 0 ? (
        <ActivityIndicator style={styles.center} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (items.length < total) {
              setPage(p => p + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
          contentContainerStyle={items.length === 0 ? styles.center : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No content found</Text>
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
  typeSelector: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTypeButton: {
    backgroundColor: '#4f46e5',
  },
  typeButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  reportedToggle: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d2d3d',
  },
  reportedToggleActive: {
    backgroundColor: '#7c2d12',
    borderColor: '#f59e0b',
  },
  reportedToggleText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 13,
  },
  reportedToggleTextActive: {
    color: '#f59e0b',
    fontWeight: '600',
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

export default AdminContentScreen;
```

### Step 4: Audit Log Screen

**File:** `frontend/src/screens/admin/admin-audit-log-screen.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { getAuditLog } from '@/services/api/admin';
import type { AuditLogItem } from '@/services/api/types/admin';
import AdminAuditItem from '@/components/admin/admin-audit-item';
import AdminFilterBar from '@/components/admin/admin-filter-bar';

const AdminAuditLogScreen = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action_type: null as string | null,
    target_type: null as string | null,
    search: '',
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAuditLog({
        page,
        limit: 20,
        ...filters,
      });
      setLogs(page === 1 ? response.items : [...logs, ...response.items]);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actionTypeOptions = [
    { label: 'Ban User', value: 'BAN_USER' },
    { label: 'Unban User', value: 'UNBAN_USER' },
    { label: 'Delete Post', value: 'DELETE_POST' },
    { label: 'Verify Venue', value: 'VERIFY_VENUE' },
    { label: 'Cancel Booking', value: 'CANCEL_BOOKING' },
    { label: 'Role Change', value: 'UPDATE_USER_ROLE' },
  ];

  const targetTypeOptions = [
    { label: 'User', value: 'USER' },
    { label: 'Post', value: 'POST' },
    { label: 'Venue', value: 'VENUE' },
    { label: 'Booking', value: 'BOOKING' },
    { label: 'Comment', value: 'COMMENT' },
  ];

  const renderItem = ({ item }: { item: AuditLogItem }) => (
    <AdminAuditItem log={item} />
  );

  return (
    <View style={styles.container}>
      <AdminFilterBar
        searchPlaceholder="Search by admin name..."
        filters={filters}
        onFilterChange={setFilters}
        onSearch={() => setPage(1)}
        filterOptions={{
          action_type: actionTypeOptions,
          target_type: targetTypeOptions,
        }}
      />

      {loading && logs.length === 0 ? (
        <ActivityIndicator style={styles.center} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (logs.length < total) {
              setPage(p => p + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
          contentContainerStyle={logs.length === 0 ? styles.center : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No audit logs found</Text>
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

export default AdminAuditLogScreen;
```

### Step 5: Admin List Item Components

**File:** `frontend/src/components/admin/admin-venue-item.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import type { MerchantListItem } from '@/services/api/types/admin';

interface AdminVenueItemProps {
  merchant: MerchantListItem;
  onVerify?: (venueId: string, venueName: string) => void;
  onUnverify?: (venueId: string, venueName: string) => void;
  onPress?: () => void;
}

const AdminVenueItem: React.FC<AdminVenueItemProps> = ({
  merchant,
  onVerify,
  onUnverify,
  onPress,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.merchantInfo}>
          <Text style={styles.name}>{merchant.full_name}</Text>
          <Text style={styles.phone}>{merchant.phone}</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.statBadge}>
            <Text style={styles.statText}>
              🏢 {merchant.venue_count} venues
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statText}>
              ✅ {merchant.verified_venue_count} verified
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.revenue}>
        <Text style={styles.revenueLabel}>Total Revenue:</Text>
        <Text style={styles.revenueValue}>{formatCurrency(merchant.total_revenue)}</Text>
      </View>

      {merchant.venue_count > merchant.verified_venue_count && (
        <View style={styles.pendingNotice}>
          <Text style={styles.pendingText}>
            ⚠️ {merchant.venue_count - merchant.verified_venue_count} venue(s) pending verification
          </Text>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  merchantInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    color: '#9ca3af',
  },
  stats: {
    flexDirection: 'row',
    gap: 6,
  },
  statBadge: {
    backgroundColor: '#2d2d3d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  revenue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2d2d3d',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  pendingNotice: {
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 6,
    padding: 8,
  },
  pendingText: {
    fontSize: 12,
    color: '#f59e0b',
  },
});

export default AdminVenueItem;
```

**File:** `frontend/src/components/admin/admin-post-item.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import type { AdminPostListItem } from '@/services/api/types/admin';

interface AdminPostItemProps {
  post: AdminPostListItem;
  onDelete?: () => void;
  onHide?: () => void;
  onPress?: () => void;
}

const AdminPostItem: React.FC<AdminPostItemProps> = ({
  post,
  onDelete,
  onHide,
  onPress,
}) => {
  const statusColors: Record<string, string> = {
    ACTIVE: '#10b981',
    CLOSED: '#6b7280',
    HIDDEN: '#ef4444',
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: statusColors[post.status] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.postInfo}>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.author}>
            👤 {post.user_name} • {post.user_phone}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[post.status] },
          ]}
        >
          <Text style={styles.statusText}>{post.status}</Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={2}>
        {post.content}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          🏆 {post.sport_type || 'Any Sport'}
        </Text>
        {post.district && (
          <Text style={styles.metaText}>📍 {post.district}</Text>
        )}
        <Text style={styles.metaText}>📅 {formatDate(post.created_at)}</Text>
      </View>

      {post.report_count > 0 && (
        <View style={styles.reportedBadge}>
          <Text style={styles.reportedText}>🚩 {post.report_count} reports</Text>
        </View>
      )}

      <View style={styles.actions}>
        {post.status === 'ACTIVE' && (
          <>
            {onHide && (
              <TouchableOpacity style={styles.hideButton} onPress={onHide}>
                <Text style={styles.hideButtonText}>Hide</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </>
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
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postInfo: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  author: {
    fontSize: 11,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 8,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#6b7280',
  },
  reportedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
  },
  reportedText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  hideButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hideButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdminPostItem;
```

**File:** `frontend/src/components/admin/admin-audit-item.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import type { AuditLogItem } from '@/services/api/types/admin';

interface AdminAuditItemProps {
  log: AuditLogItem;
}

const AdminAuditItem: React.FC<AdminAuditItemProps> = ({ log }) => {
  const actionLabels: Record<string, string> = {
    BAN_USER: 'Banned User',
    UNBAN_USER: 'Unbanned User',
    DELETE_POST: 'Deleted Post',
    HIDE_POST: 'Hidden Post',
    VERIFY_VENUE: 'Verified Venue',
    UNVERIFY_VENUE: 'Unverified Venue',
    CANCEL_BOOKING: 'Cancelled Booking',
    REFUND_PAYMENT: 'Refunded Payment',
    UPDATE_USER_ROLE: 'Changed User Role',
  };

  const actionColors: Record<string, string> = {
    BAN_USER: '#ef4444',
    UNBAN_USER: '#10b981',
    DELETE_POST: '#ef4444',
    HIDE_POST: '#f59e0b',
    VERIFY_VENUE: '#10b981',
    UNVERIFY_VENUE: '#f59e0b',
    CANCEL_BOOKING: '#ef4444',
    REFUND_PAYMENT: '#f59e0b',
    UPDATE_USER_ROLE: '#6366f1',
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <View style={[styles.container, { borderLeftColor: actionColors[log.action_type] }]}>
      <View style={styles.header}>
        <Text style={styles.action}>
          {actionLabels[log.action_type] || log.action_type}
        </Text>
        <Text style={styles.timestamp}>{formatDate(log.created_at)}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.admin}>
          👤 {log.admin_name}
        </Text>
        {log.target_type && (
          <Text style={styles.target}>
            🎯 {log.target_type}: {log.target_id?.slice(0, 8)}...
          </Text>
        )}
        {log.reason && (
          <Text style={styles.reason}>
            💬 "{log.reason}"
          </Text>
        )}
      </View>
    </View>
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
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: '#6b7280',
  },
  details: {
    gap: 4,
  },
  admin: {
    fontSize: 12,
    color: '#9ca3af',
  },
  target: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reason: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

export default AdminAuditItem;
```

---

## Success Criteria

- [ ] Merchant management screen with venue verification
- [ ] Booking oversight screen with admin cancel
- [ ] Content moderation screen with post/comment management
- [ ] Audit log screen with filterable history
- [ ] All list item components implemented
- [ ] Pagination working for all screens
- [ ] Confirmation dialogs for destructive actions
- [ ] Proper error handling and user feedback

---

## Testing Checklist

- [ ] Navigate to each admin screen
- [ ] Load and display data correctly
- [ ] Apply filters and search
- [ ] Scroll and load more pages
- [ ] Execute admin actions (ban, verify, cancel, delete)
- [ ] Confirm dialogs appear before destructive actions
- [ ] Audit log updates after actions
- [ ] Handle errors gracefully

