/**
 * Admin Content Screen - Content moderation (posts & comments).
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

interface AdminContentScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminContentScreen({
  navigation,
}: AdminContentScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Content Moderation</Text>
        <Text style={styles.subtitle}>Review and moderate user-generated content</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Features coming in Phase 5:</Text>
        <Text style={styles.placeholderBullet}>• List all posts and comments</Text>
        <Text style={styles.placeholderBullet}>• Search content by keywords</Text>
        <Text style={styles.placeholderBullet}>• Delete inappropriate posts</Text>
        <Text style={styles.placeholderBullet}>• Delete inappropriate comments</Text>
        <Text style={styles.placeholderBullet}>• View flagged content</Text>
        <Text style={styles.placeholderBullet}>• Audit trail for moderation</Text>
      </View>

      <View style={styles.tabs}>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Posts</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Comments</Text>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
