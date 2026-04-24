/**
 * Admin Audit Log Screen - View admin action history.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 5.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import type { AdminNavigationProp } from '@navigation/AdminNavigator';
import { getAuditLog } from '@services/admin-service';
import type { AuditLogItem } from '@types/api-types';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { format } from 'date-fns';

interface AdminAuditLogScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminAuditLogScreen({ navigation }: AdminAuditLogScreenProps): React.JSX.Element {
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

  const renderLogItem = ({ item }: { item: AuditLogItem }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.actionIcon, { backgroundColor: getActionColor(item.action_type) + '20' }]}>
          <Ionicons name={getActionIcon(item.action_type) as any} size={18} color={getActionColor(item.action_type)} />
        </View>
        <View style={styles.logMeta}>
          <Text style={styles.adminName}>{item.admin_name}</Text>
          <Text style={styles.logDate}>{format(new Date(item.created_at), 'HH:mm - dd/MM/yyyy')}</Text>
        </View>
      </View>
      
      <Text style={styles.actionText}>
        <Text style={styles.bold}>{item.action_type}</Text> 
        {item.target_type ? ` trên ${item.target_type}` : ''}
      </Text>
      
      {item.reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonText}>Lý do: {item.reason}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.subtitle}>Complete history of admin actions</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <FilterChip label="Tất cả" active={actionTypeFilter === undefined} onPress={() => setActionTypeFilter(undefined)} />
          <FilterChip label="Khóa người dùng" active={actionTypeFilter === 'BAN_USER'} onPress={() => setActionTypeFilter('BAN_USER')} />
          <FilterChip label="Duyệt sân" active={actionTypeFilter === 'VERIFY_VENUE'} onPress={() => setActionTypeFilter('VERIFY_VENUE')} />
          <FilterChip label="Trạng thái sân" active={actionTypeFilter === 'UPDATE_VENUE_STATUS'} onPress={() => setActionTypeFilter('UPDATE_VENUE_STATUS')} />
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066CC" />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchLogs();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color="#DEE2E6" />
              <Text style={styles.emptyText}>Chưa có dữ liệu nhật ký</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const FilterChip = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
  <TouchableOpacity style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const getActionIcon = (type: string) => {
  if (type.includes('BAN')) return 'lock-closed';
  if (type.includes('VERIFY')) return 'checkmark-circle';
  if (type.includes('STATUS')) return 'sync';
  return 'information-circle';
};

const getActionColor = (type: string) => {
  if (type.includes('BAN')) return '#DC3545';
  if (type.includes('VERIFY')) return '#28A745';
  if (type.includes('STATUS')) return '#FD7E14';
  return '#0066CC';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0066CC',
  },
  filterChipText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  logCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logMeta: {
    flex: 1,
  },
  adminName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
  },
  logDate: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#212529',
  },
  reasonContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#DEE2E6',
  },
  reasonText: {
    fontSize: 13,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#ADB5BD',
    fontSize: 16,
    marginTop: 12,
  },
});
