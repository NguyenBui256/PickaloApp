/**
 * Admin Users Screen - User management interface.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 5.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { AdminNavigationProp } from '@navigation/admin-navigator';

interface AdminUsersScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminUsersScreen({
  navigation,
}: AdminUsersScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>View, ban, and manage user accounts</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Features coming in Phase 5:</Text>
        <Text style={styles.placeholderBullet}>• List all users with pagination</Text>
        <Text style={styles.placeholderBullet}>• Search and filter users</Text>
        <Text style={styles.placeholderBullet}>• View user details</Text>
        <Text style={styles.placeholderBullet}>• Ban/unban users</Text>
        <Text style={styles.placeholderBullet}>• Change user roles</Text>
        <Text style={styles.placeholderBullet}>• View user activity</Text>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterText}>Filters will appear here:</Text>
        <View style={styles.filterTags}>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>All Users</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Active</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Banned</Text>
          </View>
          <View style={styles.filterTag}>
            <Text style={styles.filterTagText}>Merchants</Text>
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
  filterText: {
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
});
