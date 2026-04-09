/**
 * Admin Merchants Screen - Merchant and venue management.
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

interface AdminMerchantsScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminMerchantsScreen({
  navigation,
}: AdminMerchantsScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Merchant Management</Text>
        <Text style={styles.subtitle}>Verify venues and manage merchants</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Features coming in Phase 5:</Text>
        <Text style={styles.placeholderBullet}>• List all merchants</Text>
        <Text style={styles.placeholderBullet}>• View merchant venues</Text>
        <Text style={styles.placeholderBullet}>• Verify/unverify venues</Text>
        <Text style={styles.placeholderBullet}>• Review pending applications</Text>
        <Text style={styles.placeholderBullet}>• View merchant performance</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsTitle}>Quick Stats</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Total Merchants</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Pending Verifications</Text>
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
  stats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0066CC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
