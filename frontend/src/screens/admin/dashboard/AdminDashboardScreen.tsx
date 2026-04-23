import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { getAdminStats } from '../../../services/admin-service';
import type { AdminStatsResponse } from '../../../types/api-types';

const { width } = Dimensions.get('window');

export const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }: { title: string, value: string | number, icon: string, color: string, onPress?: () => void }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hệ thống Quản trị</Text>
        <Text style={styles.headerSubtitle}>Tổng quan thống kê hệ thống</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Tổng người dùng" 
            value={stats?.total_users || 0} 
            icon="account-group" 
            color="#2196F3" 
            onPress={() => navigation.navigate('Users')}
          />
          <StatCard 
            title="Chủ sân (Merchants)" 
            value={stats?.total_merchants || 0} 
            icon="storefront" 
            color="#FF9800" 
            onPress={() => navigation.navigate('Users')}
          />
          <StatCard 
            title="Số lượng sân" 
            value={stats?.total_venues || 0} 
            icon="stadium-variant" 
            color="#4CAF50" 
            onPress={() => navigation.navigate('Venues')}
          />
          <StatCard 
            title="Tổng đơn đặt" 
            value={stats?.total_bookings || 0} 
            icon="calendar-check" 
            color="#9C27B0" 
          />
        </View>

        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <MaterialCommunityIcons name="finance" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.revenueLabel}>Tổng doanh thu hệ thống</Text>
          </View>
          <Text style={styles.revenueValue}>
            {stats?.revenue_total.toLocaleString('vi-VN')} <Text style={styles.currency}>VND</Text>
          </Text>
          <View style={styles.revenueTrend}>
            <MaterialCommunityIcons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.trendText}>+12.5% so với tháng trước</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hành động nhanh</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Venues')}>
              <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.actionText}>Duyệt sân mới</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Posts')}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
              <Text style={styles.actionText}>Báo cáo bài đăng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Users')}>
              <MaterialCommunityIcons name="account-search" size={24} color="#607D8B" />
              <Text style={styles.actionText}>Tìm người dùng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  statTitle: {
    fontSize: 11,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 2,
  },
  revenueCard: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    marginLeft: 8,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  currency: {
    fontSize: 18,
    fontWeight: 'normal',
  },
  revenueTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: COLORS.WHITE,
    width: (width - 48) / 3,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 11,
    color: COLORS.BLACK,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
