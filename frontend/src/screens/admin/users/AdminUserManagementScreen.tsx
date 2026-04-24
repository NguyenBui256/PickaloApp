import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Image, Alert, TextInput, Modal, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { getAdminUsers, toggleUserStatus, getAdminVenues, createUser } from '../../../services/admin-service';
import type { AdminUserListItem, UserRole, AdminVenueListItem } from '../../../types/api-types';

export const AdminUserManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<UserRole>('USER');
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<AdminUserListItem | null>(null);
  const [merchantVenues, setMerchantVenues] = useState<AdminVenueListItem[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  
  // Add User State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    role: 'USER' as UserRole
  });

  const handleAddUser = async () => {
    if (!newUserForm.full_name || !newUserForm.phone || !newUserForm.password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên, SĐT, Mật khẩu)');
      return;
    }

    // Chuẩn hóa số điện thoại
    let normalizedPhone = newUserForm.phone.trim();
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+84' + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith('84')) {
      normalizedPhone = '+84' + normalizedPhone.slice(2);
    } else if (normalizedPhone.length > 0 && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+84' + normalizedPhone;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        ...newUserForm,
        phone: normalizedPhone
      });
      Alert.alert('Thành công', 'Đã thêm người dùng mới');
      setIsAddModalVisible(false);
      setNewUserForm({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        role: 'USER'
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      let errorMsg = 'Không thể thêm người dùng mới';
      
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // Xử lý lỗi validation từ FastAPI (422)
          errorMsg = error.detail.map((err: any) => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join('\n');
        } else {
          errorMsg = error.detail;
        }
      }
      
      Alert.alert('Lỗi', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(activeTab);
      console.log(`[DEBUG] Loaded users for role ${activeTab}:`, data?.length);
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    );
  }, [users, searchQuery]);

  const loadMerchantVenues = async (merchant: AdminUserListItem) => {
    setSelectedMerchant(merchant);
    setLoadingVenues(true);
    try {
      // In a real app, you would fetch venues for THIS specific merchant.
      // For mock, we just fetch all active venues.
      const data = await getAdminVenues(true);
      setMerchantVenues(data);
    } catch (error) {
      console.error('Error loading merchant venues:', error);
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleToggleStatus = (user: AdminUserListItem) => {
    const action = user.is_active ? 'khóa' : 'mở khóa';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn muốn ${action} người dùng ${user.full_name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          onPress: async () => {
            try {
              await toggleUserStatus(user.id, !user.is_active);
              loadUsers();
            } catch (error: any) {
              console.error('[DEBUG] Toggle User Status Error:', error);
              const errorMsg = error.detail || error.message || 'Thao tác thất bại';
              Alert.alert('Lỗi', errorMsg);
            }
          } 
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: AdminUserListItem }) => (
    <View style={styles.userCard}>
      <TouchableOpacity 
        style={styles.userMainInfo} 
        onPress={() => item.role === 'MERCHANT' && loadMerchantVenues(item)}
      >
        <Image 
          source={{ uri: `https://i.pravatar.cc/150?u=${item.id}` }} 
          style={styles.avatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={styles.userPhone}>{item.phone}</Text>
          {item.role === 'MERCHANT' && (
            <Text style={styles.viewVenuesText}>Nhấn để xem danh sách sân</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.statusButton, { backgroundColor: item.is_active ? '#F4433615' : '#4CAF5015' }]}
        onPress={() => handleToggleStatus(item)}
      >
        <MaterialCommunityIcons 
          name={item.is_active ? 'lock' : 'lock-open'} 
          size={20} 
          color={item.is_active ? '#F44336' : '#4CAF50'} 
        />
        <Text style={[styles.statusBtnText, { color: item.is_active ? '#F44336' : '#4CAF50' }]}>
          {item.is_active ? 'Khóa' : 'Mở'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý người dùng</Text>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.GRAY_MEDIUM} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc SĐT..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'USER' && styles.activeTab]}
          onPress={() => setActiveTab('USER')}
        >
          <Text style={[styles.tabText, activeTab === 'USER' && styles.activeTabText]}>Người chơi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'MERCHANT' && styles.activeTab]}
          onPress={() => setActiveTab('MERCHANT')}
        >
          <Text style={[styles.tabText, activeTab === 'MERCHANT' && styles.activeTabText]}>Chủ sân</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadUsers}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy người dùng phù hợp</Text>
          </View>
        }
      />

      {/* Modal: Merchant Venues */}
      <Modal
        visible={!!selectedMerchant}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedMerchant(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Sân của chủ sở hữu</Text>
                <Text style={styles.modalSubtitle}>{selectedMerchant?.full_name}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMerchant(null)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={merchantVenues}
              keyExtractor={item => item.id}
              refreshing={loadingVenues}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.venueItem}
                  onPress={() => {
                    try {
                      setSelectedMerchant(null);
                      // Switch to Venues tab then show details
                      navigation.navigate('Venues');
                      navigation.navigate('VenueDetails', { venueId: item.id });
                    } catch (error: any) {
                      console.error('[DEBUG] Verify Venue Error:', error);
                      const errorMsg = error.detail || error.message || 'Không thể duyệt sân';
                      Alert.alert('Lỗi', errorMsg);
                    }
                  }}
                >
                  <View style={styles.venueIcon}>
                    <MaterialCommunityIcons name="stadium" size={24} color={COLORS.PRIMARY} />
                  </View>
                  <View style={styles.venueDetails}>
                    <Text style={styles.venueName}>{item.name}</Text>
                    <Text style={styles.venueAddress} numberOfLines={1}>{item.address}</Text>
                  </View>
                  <View style={[styles.statusPoint, { backgroundColor: item.is_active ? '#4CAF50' : '#FF9800' }]} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Chủ sân này chưa đăng ký sân nào</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      {/* Modal: Add New User */}
      <Modal
        visible={isAddModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '80%', paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm người dùng mới</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.BLACK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Họ và tên *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nhập họ và tên"
                    value={newUserForm.full_name}
                    onChangeText={text => setNewUserForm(prev => ({ ...prev, full_name: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số điện thoại *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    value={newUserForm.phone}
                    onChangeText={text => setNewUserForm(prev => ({ ...prev, phone: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email (Không bắt buộc)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nhập địa chỉ email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newUserForm.email}
                    onChangeText={text => setNewUserForm(prev => ({ ...prev, email: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mật khẩu *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nhập mật khẩu"
                    secureTextEntry
                    value={newUserForm.password}
                    onChangeText={text => setNewUserForm(prev => ({ ...prev, password: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vai trò</Text>
                  <View style={styles.roleContainer}>
                    <TouchableOpacity 
                      style={[styles.roleOption, newUserForm.role === 'USER' && styles.activeRole]}
                      onPress={() => setNewUserForm(prev => ({ ...prev, role: 'USER' }))}
                    >
                      <Text style={[styles.roleText, newUserForm.role === 'USER' && styles.activeRoleText]}>Người chơi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.roleOption, newUserForm.role === 'MERCHANT' && styles.activeRole]}
                      onPress={() => setNewUserForm(prev => ({ ...prev, role: 'MERCHANT' }))}
                    >
                      <Text style={[styles.roleText, newUserForm.role === 'MERCHANT' && styles.activeRoleText]}>Chủ sân</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleAddUser}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Đang xử lý...' : 'Tạo người dùng'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={30} color={COLORS.WHITE} />
      </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.WHITE,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEE',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 2,
  },
  viewVenuesText: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    marginTop: 4,
    fontWeight: '500',
  },
  statusButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.GRAY_MEDIUM,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginTop: 2,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  venueIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venueDetails: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  venueAddress: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 2,
  },
  statusPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  form: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.BLACK,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  activeRole: {
    backgroundColor: COLORS.PRIMARY + '15',
    borderColor: COLORS.PRIMARY,
  },
  roleText: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    fontWeight: '500',
  },
  activeRoleText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
