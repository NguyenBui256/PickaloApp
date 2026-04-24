/**
 * Admin Dashboard Screen - Platform metrics and overview.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 4 & 5.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import type { AdminNavigationProp } from '@navigation/AdminNavigator';
import { getAdminStats } from '@services/admin-service';
import type { AdminStatsResponse } from '@types/api-types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import type { AdminNavigationProp } from '@navigation/AdminNavigator';

interface AdminDashboardScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);

  const fetchStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Platform overview and metrics</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Users" 
          value={stats?.total_users || 0} 
          icon="people" 
          color="#0066CC" 
        />
        <StatCard 
          title="Merchants" 
          value={stats?.total_merchants || 0} 
          icon="business" 
          color="#28A745" 
        />
        <StatCard 
          title="Active Venues" 
          value={stats?.verified_venues || 0} 
          icon="location" 
          color="#FD7E14" 
        />
        <StatCard 
          title="Total Bookings" 
          value={stats?.total_bookings || 0} 
          icon="calendar" 
          color="#6F42C1" 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Queue</Text>
        <View style={styles.alertCard}>
          <Ionicons name="time" size={20} color="#0066CC" />
          <Text style={styles.alertText}>
            You have <Text style={styles.bold}>{stats?.pending_verifications || 0}</Text> venues pending verification.
          </Text>
        </View>
      </View>

      <Text style={styles.note}>Charts and detailed reports coming in Phase 5</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  statTitle: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#E7F1FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B6D4FE',
  },
  alertText: {
    fontSize: 14,
    color: '#084298',
    marginLeft: 12,
  },
  bold: {
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});
