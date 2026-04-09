/**
 * Admin Dashboard Screen - Platform metrics and overview.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 4 & 5.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import type { AdminNavigationProp } from '@navigation/admin-navigator';

interface AdminDashboardScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminDashboardScreen({
  navigation,
}: AdminDashboardScreenProps): React.JSX.Element {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch dashboard metrics from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Platform overview and metrics</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Dashboard metrics will be displayed here:
        </Text>
        <Text style={styles.placeholderBullet}>• Total users</Text>
        <Text style={styles.placeholderBullet}>• Total merchants</Text>
        <Text style={styles.placeholderBullet}>• Total venues</Text>
        <Text style={styles.placeholderBullet}>• Total bookings</Text>
        <Text style={styles.placeholderBullet}>• Revenue trends</Text>
        <Text style={styles.placeholderBullet}>• Growth charts</Text>
      </View>

      <Text style={styles.note}>
        Full implementation coming in Phase 4 & 5
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  placeholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  placeholderBullet: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    marginBottom: 4,
  },
  note: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
