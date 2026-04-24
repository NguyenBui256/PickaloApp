/**
 * Admin Users Screen - User management interface.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 5.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import type { AdminNavigationProp } from '@navigation/AdminNavigator';
import { getAdminUsers, banUser, unbanUser } from '@services/admin-service';
import type { AdminUserListItem, UserRole } from '@types/api-types';
import { Ionicons } from '@expo/vector-icons';

interface AdminUsersScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminUsersScreen({ navigation }: AdminUsersScreenProps): React.JSX.Element {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers(roleFilter);
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleBan = (user: AdminUserListItem) => {
    const action = user.is_active ? 'ban' : 'unban';
    const actionText = user.is_active ? 'Khóa' : 'Mở khóa';

    Alert.alert(
      `${actionText} người dùng`,
      `Bạn có chắc chắn muốn ${actionText.toLowerCase()} người dùng ${user.full_name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: actionText,
          style: user.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (user.is_active) {
                await banUser(user.id, 'Vi phạm quy định hệ thống');
              } else {
                await unbanUser(user.id, 'Đã khắc phục vi phạm');
              }
              fetchUsers();
            } catch (error) {
              Alert.alert('Lỗi', `Không thể ${actionText.toLowerCase()} người dùng`);
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: AdminUserListItem }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userPhone}>{item.phone}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.actionButton, item.is_active ? styles.banButton : styles.unbanButton]}
        onPress={() => handleToggleBan(item)}
      >
        <Ionicons 
          name={item.is_active ? "lock-closed" : "lock-open"} 
          size={18} 
          color="#FFF" 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>View, ban, and manage user accounts</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <FilterChip 
            label="All" 
            active={roleFilter === undefined} 
            onPress={() => setRoleFilter(undefined)} 
          />
          <FilterChip 
            label="Users" 
            active={roleFilter === 'USER'} 
            onPress={() => setRoleFilter('USER')} 
          />
          <FilterChip 
            label="Merchants" 
            active={roleFilter === 'MERCHANT'} 
            onPress={() => setRoleFilter('MERCHANT')} 
          />
          <FilterChip 
            label="Admins" 
            active={roleFilter === 'ADMIN'} 
            onPress={() => setRoleFilter('ADMIN')} 
          />
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066CC" />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchUsers();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const FilterChip = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.filterChip, active && styles.filterChipActive]} 
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

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
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  userPhone: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#495057',
    textTransform: 'uppercase',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  banButton: {
    backgroundColor: '#DC3545',
  },
  unbanButton: {
    backgroundColor: '#28A745',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#6C757D',
    fontSize: 16,
  },
});
