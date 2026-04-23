/**
 * Admin Audit Log Screen - View admin action history.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 5.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { AdminNavigationProp } from '@navigation/admin-navigator';

interface AdminAuditLogScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminAuditLogScreen({ navigation }: AdminAuditLogScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.subtitle}>Complete history of admin actions</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Features coming in Phase 5:</Text>
        <Text style={styles.placeholderBullet}>• View all admin actions</Text>
        <Text style={styles.placeholderBullet}>• Filter by action type</Text>
        <Text style={styles.placeholderBullet}>• Filter by admin</Text>
        <Text style={styles.placeholderBullet}>• Filter by date range</Text>
        <Text style={styles.placeholderBullet}>• View action details</Text>
        <Text style={styles.placeholderBullet}>• Export audit log</Text>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterTitle}>Action Types</Text>
        <View style={styles.filterTags}>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>All Actions</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Bans</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Verifications</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Deletions</Text>
          </View>
        </View>
      </View>

      <View style={styles.sampleEntry}>
        <Text style={styles.entryDate}>2026-04-09 15:30</Text>
        <Text style={styles.entryAction}>Admin: banned user +84998877665</Text>
        <Text style={styles.entryReason}>Reason: Violation of community guidelines</Text>
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
    marginBottom: 16,
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
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterTagText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  sampleEntry: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  entryDate: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  entryAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  entryReason: {
    fontSize: 12,
    color: '#666666',
  },
});
