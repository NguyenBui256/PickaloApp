import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { OWNER_SERVICES } from '../../../constants/mock-data';
// @ts-ignore — TODO: gọi service khi chuyển sang API thật
import { fetchVenueServices, createVenueService, deleteVenueService } from '../../../services/venue-service';
import { PrimaryButton } from '../../../components/PrimaryButton';

export const ServiceManagementScreen: React.FC = () => {
  const [services, setServices] = useState(OWNER_SERVICES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa dịch vụ này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => setServices(prev => prev.filter(s => s.id !== id)) }
    ]);
  };

  const renderItem = ({ item }: { item: typeof OWNER_SERVICES[0] }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.servicePrice}>
          {item.price.toLocaleString('vi-VN')} đ / {item.unit}
        </Text>
      </View>
      <View style={styles.serviceActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingService(item); setModalVisible(true); }}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#1976D2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dịch vụ & Tiện ích</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingService(null); setModalVisible(true); }}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="room-service-outline" size={60} color="#DDD" />
            <Text style={styles.emptyText}>Chưa có dịch vụ nào được thêm</Text>
          </View>
        }
      />

      {/* Simplified Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex1}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={Keyboard.dismiss}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</Text>
              
              <TextInput 
                style={styles.input} 
                placeholder="Tên dịch vụ (ví dụ: Nước suối)" 
                defaultValue={editingService?.name}
              />
              <TextInput 
                style={styles.input} 
                placeholder="Giá tiền" 
                keyboardType="numeric"
                defaultValue={editingService?.price?.toString()}
              />
              <TextInput 
                style={styles.input} 
                placeholder="Đơn vị (ví dụ: Chai, Lượt)" 
                defaultValue={editingService?.unit}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={() => setModalVisible(false)}>
                  <Text style={styles.submitText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {

    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  servicePrice: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionBtn: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8F9FA',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  modalCancel: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  modalSubmit: {
    flex: 1,
    height: 50,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  cancelText: {
    fontWeight: '600',
    color: '#666',
  },
  submitText: {
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});
