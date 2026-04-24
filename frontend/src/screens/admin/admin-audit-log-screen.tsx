import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuditLog } from '../../services/admin-service';
import type { AuditLogItem } from '../../types/api-types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { format } from 'date-fns';

export function AdminAuditLogScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionTypeFilter, setActionTypeFilter] = useState<string | undefined>(undefined);

  const fetchLogs = async () => {
    try {
      const data = await getAuditLog({ action_type: actionTypeFilter });
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionTypeFilter]);

  const getActionInfo = (type: string) => {
    if (type.includes('BAN')) return { icon: 'lock-outline', color: '#F44336', label: 'Khóa/Mở khóa' };
    if (type.includes('VERIFY')) return { icon: 'shield-check-outline', color: '#4CAF50', label: 'Duyệt sân' };
    if (type.includes('STATUS')) return { icon: 'list-status', color: '#FF9800', label: 'Trạng thái' };
    if (type.includes('CREATE')) return { icon: 'account-plus-outline', color: '#2196F3', label: 'Tạo mới' };
    if (type.includes('ROLE')) return { icon: 'account-cog-outline', color: '#9C27B0', label: 'Vai trò' };
    return { icon: 'information-outline', color: COLORS.PRIMARY, label: 'Hệ thống' };
  };

  const renderLogItem = ({ item }: { item: AuditLogItem }) => {
    const info = getActionInfo(item.action_type);
    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={[styles.actionIcon, { backgroundColor: info.color + '15' }]}>
            <MaterialCommunityIcons name={info.icon as any} size={20} color={info.color} />
          </View>
          <View style={styles.logMeta}>
            <Text style={styles.adminName}>{item.admin_name}</Text>
            <Text style={styles.logDate}>{format(new Date(item.created_at), 'HH:mm - dd/MM/yyyy')}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: info.color + '10' }]}>
            <Text style={[styles.typeBadgeText, { color: info.color }]}>{info.label}</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.actionText}>
            <Text style={styles.boldText}>{item.action_type}</Text>
            {item.target_type && (
              <Text style={styles.targetText}> • {item.target_type}</Text>
            )}
          </Text>

          {item.reason && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <FilterChip label="Tất cả" active={actionTypeFilter === undefined} onPress={() => setActionTypeFilter(undefined)} />
          <FilterChip label="Người dùng" active={actionTypeFilter === 'BAN_USER'} onPress={() => setActionTypeFilter('BAN_USER')} />
          <FilterChip label="Duyệt sân" active={actionTypeFilter === 'VERIFY_VENUE'} onPress={() => setActionTypeFilter('VERIFY_VENUE')} />
          <FilterChip label="Trạng thái" active={actionTypeFilter === 'UPDATE_VENUE_STATUS'} onPress={() => setActionTypeFilter('UPDATE_VENUE_STATUS')} />
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải nhật ký...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchLogs();
              }}
              colors={[COLORS.PRIMARY]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={80} color={COLORS.GRAY_LIGHT} />
              <Text style={styles.emptyTitle}>Chưa có hoạt động nào</Text>
              <Text style={styles.emptySubtitle}>Mọi thao tác của quản trị viên sẽ được lưu lại tại đây.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const FilterChip = ({ label, active, onPress }: any) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.GRAY_MEDIUM,
    fontSize: 14,
  },
  filterArea: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4E9',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E0E4E9',
  },
  filterChipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.WHITE,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logMeta: {
    flex: 1,
  },
  adminName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  logDate: {
    fontSize: 11,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  contentSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingTop: 12,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  targetText: {
    color: COLORS.GRAY_MEDIUM,
    fontSize: 13,
  },
  reasonBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#DEE2E6',
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
