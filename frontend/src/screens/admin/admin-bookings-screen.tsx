/**
 * Admin Bookings Screen - Booking oversight and management.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 5.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { AdminNavigationProp } from '@navigation/admin-navigator';

interface AdminBookingsScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminBookingsScreen({ navigation }: AdminBookingsScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Oversight</Text>
        <Text style={styles.subtitle}>View and manage all platform bookings</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Features coming in Phase 5:</Text>
        <Text style={styles.placeholderBullet}>• List all bookings platform-wide</Text>
        <Text style={styles.placeholderBullet}>• Filter by status, date, venue</Text>
        <Text style={styles.placeholderBullet}>• Admin cancel bookings</Text>
        <Text style={styles.placeholderBullet}>• View booking details</Text>
        <Text style={styles.placeholderBullet}>• Resolve disputes</Text>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterTitle}>Status Filters</Text>
        <View style={styles.filterTags}>
          <View style={[styles.filterTag, styles.filterTagActive]}>
            <Text style={[styles.filterTagText, styles.filterTagTextActive]}>All</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Confirmed</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Cancelled</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Completed</Text>
          </View>
        </View>
      </View>
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
  filters: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTagActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  filterTagText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  filterTagTextActive: {
    color: '#FFFFFF',
  },
});
