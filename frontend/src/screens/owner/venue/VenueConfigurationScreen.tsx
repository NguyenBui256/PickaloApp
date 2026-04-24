import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  fetchVenueById,
  fetchVenueCourts,
  createCourt,
  deleteCourt,
  fetchPricingSlots,
  deletePricingSlot,
  updateCourt,
  bulkCreateCourts,
  bulkCreatePricingSlots,
  fetchPricingProfiles,
  applyPricingProfile,
  updatePricingProfile,
} from '../../../services/venue-service';
import type {
  CourtResponse,
  PricingSlotResponse,
  DayType,
  PricingProfileResponse
} from '../../../types/api-types';

type VenueConfigurationRouteProp = RouteProp<
  { VenueConfiguration: { venueId: string } },
  'VenueConfiguration'
>;

interface CourtFormData {
  name: string;
  count: string;
}

interface PricingFormData {
  title: string;
  day_type: DayType;
  days_of_week: number[];
  slots: {
    start_time: string;
    end_time: string;
    price: string;
    is_default: boolean;
  }[];
}

export const VenueConfigurationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VenueConfigurationRouteProp>();
  const { venueId } = route.params;

  const [venue, setVenue] = useState<any>(null);
  const [courts, setCourts] = useState<CourtResponse[]>([]);
  const [pricingSlots, setPricingSlots] = useState<PricingSlotResponse[]>([]);
  const [pricingProfiles, setPricingProfiles] = useState<PricingProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courts' | 'pricing'>('courts');

  // Modal states
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [courtFormData, setCourtFormData] = useState<CourtFormData>({ name: 'Sân', count: '1' });
  const [pricingFormData, setPricingFormData] = useState<PricingFormData>({
    title: '',
    day_type: 'WEEKDAY',
    days_of_week: [0, 1, 2, 3, 4],
    slots: [
      { start_time: '00:00', end_time: '23:59', price: '', is_default: true },
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<{ slotIndex: number; field: 'start_time' | 'end_time' } | null>(null);
  const [editingGroupSlotIds, setEditingGroupSlotIds] = useState<string[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState<string>('');
  // Generate time options: 00:00, 00:30, 01:00 ... 24:00
  const TIME_OPTIONS: string[] = [];
  for (let h = 0; h <= 23; h++) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
  }
  TIME_OPTIONS.push('24:00');

  useEffect(() => {
    loadData();
  }, [venueId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [venueData, courtsData, pricingData, profilesData] = await Promise.all([
        fetchVenueById(venueId),
        fetchVenueCourts(venueId),
        fetchPricingSlots(venueId),
        fetchPricingProfiles(),
      ]);
      setVenue(venueData);
      setCourts(courtsData);
      setPricingSlots(pricingData);
      setPricingProfiles(profilesData);
    } catch (error) {
      console.error('Error loading venue configuration:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin cấu hình.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourt = async () => {
    const namePrefix = courtFormData.name.trim();
    if (!namePrefix) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên/tiền tố sân.');
      return;
    }

    const count = parseInt(courtFormData.count);
    if (isNaN(count) || count < 1 || count > 20) {
      Alert.alert('Lỗi', 'Số lượng sân không hợp lệ (1-20).');
      return;
    }

    try {
      setIsSubmitting(true);
      if (count === 1) {
        await createCourt(venueId, { name: namePrefix });
      } else {
        const names = Array.from({ length: count }, (_, i) => `${namePrefix} ${i + 1}`);
        await bulkCreateCourts(venueId, { names });
      }

      Alert.alert('Thành công', `Đã thêm ${count} sân mới.`);
      setShowCourtModal(false);
      setCourtFormData({ name: 'Sân', count: '1' });
      await loadData();
    } catch (error: any) {
      console.error('Error adding court:', error);
      Alert.alert('Lỗi', error?.response?.data?.detail || 'Không thể thêm sân.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProfileInUse = (profile: PricingProfileResponse) => {
    if (pricingSlots.length !== profile.slots.length) return false;
    // Check if every slot in profile matches a slot in the venue
    return profile.slots.every(pSlot =>
      pricingSlots.some(vSlot =>
        vSlot.day_type === pSlot.day_type &&
        (vSlot.days_of_week || []).sort().join(',') === (pSlot.days_of_week || []).sort().join(',') &&
        vSlot.start_time === pSlot.start_time &&
        vSlot.end_time === pSlot.end_time &&
        vSlot.price === pSlot.price &&
        vSlot.is_default === pSlot.is_default
      )
    );
  };

  const handleSaveProfileName = async (profileId: string) => {
    if (!editingProfileName.trim()) {
      setEditingProfileId(null);
      return;
    }
    try {
      setIsSubmitting(true);
      await updatePricingProfile(profileId, { name: editingProfileName.trim() });
      setEditingProfileId(null);
      await loadData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật tên profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyProfile = async (profileId: string) => {
    try {
      setIsSubmitting(true);
      await applyPricingProfile(venueId, profileId);
      Alert.alert('Thành công', 'Đã áp dụng cấu hình giá từ profile.');
      setShowProfileModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error applying profile:', error);
      Alert.alert('Lỗi', error?.response?.data?.detail || 'Không thể áp dụng profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCourtStatus = async (courtId: string, currentStatus: boolean) => {
    try {
      await updateCourt(courtId, { is_active: !currentStatus });
      await loadData();
    } catch (error: any) {
      console.error('Error toggling court status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái sân.');
    }
  };

  const handleDeleteCourt = async (courtId: string, courtName: string) => {
    Alert.alert(
      'Xóa sân',
      `Bạn có chắc muốn xóa sân "${courtName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourt(courtId);
              Alert.alert('Thành công', 'Đã xóa sân.');
              await loadData();
            } catch (error: any) {
              console.error('Error deleting court:', error);
              Alert.alert('Lỗi', 'Không thể xóa sân.');
            }
          },
        },
      ]
    );
  };

  const validateTimeOverlaps = () => {
    const slots = pricingFormData.slots.filter(s => !s.is_default);
    if (slots.length <= 1) return true;

    // Convert time HH:MM to minutes for easy comparison
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    for (let i = 0; i < slots.length; i++) {
      const s1 = slots[i];
      const start1 = toMinutes(s1.start_time);
      const end1 = s1.end_time === '24:00' ? 1440 : toMinutes(s1.end_time);

      if (start1 >= end1) {
        Alert.alert('Lỗi', `Khung giờ #${i + 2} có thời gian bắt đầu lớn hơn hoặc bằng thời gian kết thúc.`);
        return false;
      }

      for (let j = i + 1; j < slots.length; j++) {
        const s2 = slots[j];
        const start2 = toMinutes(s2.start_time);
        const end2 = s2.end_time === '24:00' ? 1440 : toMinutes(s2.end_time);

        // Check if overlap
        if (start1 < end2 && start2 < end1) {
          Alert.alert('Lỗi', `Khung giờ #${i + 2} và #${j + 2} đang bị chồng lấn thời gian.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleAddPricingSlot = async () => {
    if (!venueId) return;

    // Validate slots
    if (pricingFormData.days_of_week.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }

    const hasInvalidSlot = pricingFormData.slots.some(s =>
      !s.price || (!s.is_default && (!s.start_time || !s.end_time))
    );

    if (hasInvalidSlot) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin cho tất cả các khung giờ');
      return;
    }

    if (!validateTimeOverlaps()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // If we are editing an existing group, delete the old slots first
      if (editingGroupSlotIds.length > 0) {
        await Promise.all(
          editingGroupSlotIds.map(id => deletePricingSlot(venueId, id).catch(e => console.log('Delete slot error:', e)))
        );
      }

      await bulkCreatePricingSlots(venueId, {
        title: pricingFormData.title || null,
        days_of_week: pricingFormData.days_of_week,
        day_type: pricingFormData.day_type,
        slots: pricingFormData.slots.map(s => ({
          start_time: s.is_default ? '00:00' : s.start_time,
          end_time: s.is_default ? '23:59' : s.end_time,
          price: parseFloat(s.price),
          is_default: s.is_default,
          day_type: pricingFormData.day_type
        })),
      });

      Alert.alert('Thành công', editingGroupSlotIds.length > 0 ? 'Đã cập nhật nhóm giá' : 'Đã thêm nhóm giá mới');
      setShowPricingModal(false);
      resetPricingForm();
      await loadData();
    } catch (error: any) {
      console.error('Error adding pricing slots:', error);
      Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể thêm nhóm giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPricingSlotRow = () => {
    setPricingFormData({
      ...pricingFormData,
      slots: [
        ...pricingFormData.slots,
        { start_time: '05:00', end_time: '10:00', price: '', is_default: false }
      ]
    });
  };

  const removePricingSlotRow = (index: number) => {
    const newSlots = [...pricingFormData.slots];
    newSlots.splice(index, 1);
    setPricingFormData({ ...pricingFormData, slots: newSlots });
  };

  const updatePricingSlotRow = (index: number, field: string, value: any) => {
    const newSlots = [...pricingFormData.slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setPricingFormData({ ...pricingFormData, slots: newSlots });
  };
  const handleDeletePricingSlot = async (slotId: string) => {
    Alert.alert(
      'Xóa khoảng giá',
      'Bạn có chắc muốn xóa khoảng giá này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePricingSlot(venueId, slotId);
              Alert.alert('Thành công', 'Đã xóa khoảng giá.');
              await loadData();
            } catch (error: any) {
              console.error('Error deleting pricing slot:', error);
              Alert.alert('Lỗi', 'Không thể xóa khoảng giá.');
            }
          },
        },
      ]
    );
  };


  const handleAddPricingGroup = () => {
    resetPricingForm();
    setShowPricingModal(true);
  };

  const handleEditPricingGroup = (slots: PricingSlotResponse[]) => {
    setEditingGroupSlotIds(slots.map(s => s.id));
    const sortedSlots = [...slots].sort((a, b) => (a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1));
    setPricingFormData({
      title: sortedSlots[0].title || '',
      day_type: sortedSlots[0].day_type,
      days_of_week: sortedSlots[0].days_of_week || [],
      slots: sortedSlots.map(s => ({
        start_time: s.is_default ? '00:00' : s.start_time,
        end_time: s.is_default ? '23:59' : s.end_time,
        price: s.price.toString(),
        is_default: s.is_default
      }))
    });
    setShowPricingModal(true);
  };

  const resetPricingForm = () => {
    setEditingGroupSlotIds([]);
    setPricingFormData({
      title: '',
      day_type: 'WEEKDAY',
      days_of_week: [0, 1, 2, 3, 4],
      slots: [
        { start_time: '00:00', end_time: '23:59', price: '', is_default: true },
      ],
    });
  };

  const getDayTypeLabel = (dayType: DayType): string => {
    switch (dayType) {
      case 'WEEKDAY': return 'Ngày thường';
      case 'WEEKEND': return 'Cuối tuần';
      case 'HOLIDAY': return 'Ngày lễ';
      default: return dayType;
    }
  };

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString('vi-VN')} đ/giờ`;
  };

  const formatDaysOfWeek = (days: number[] | null | undefined): string => {
    if (!days || days.length === 0) return '';
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    if (days.length === 7) return 'Tất cả các ngày';
    if (days.length === 5 && days.every(d => d < 5)) return 'Thứ 2 - Thứ 6';
    if (days.length === 2 && days.includes(5) && days.includes(6)) return 'Cuối tuần';
    return days.sort().map(d => dayNames[d]).join(', ');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cấu hình sân</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Venue Info */}
      {venue && (
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venuePrice}>
            Cấu hình giá và sân cho cơ sở này
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courts' && styles.activeTab]}
          onPress={() => setActiveTab('courts')}
        >
          <MaterialCommunityIcons
            name="tennis-ball"
            size={20}
            color={activeTab === 'courts' ? COLORS.PRIMARY : COLORS.GRAY_MEDIUM}
          />
          <Text style={[styles.tabText, activeTab === 'courts' && styles.activeTabText]}>
            Sân con ({courts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pricing' && styles.activeTab]}
          onPress={() => setActiveTab('pricing')}
        >
          <MaterialCommunityIcons
            name="tag-multiple"
            size={20}
            color={activeTab === 'pricing' ? COLORS.PRIMARY : COLORS.GRAY_MEDIUM}
          />
          <Text style={[styles.tabText, activeTab === 'pricing' && styles.activeTabText]}>
            Khoảng giá ({pricingSlots.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'courts' ? (
          <CourtsTab
            courts={courts}
            onAddCourt={() => setShowCourtModal(true)}
            onDeleteCourt={handleDeleteCourt}
            onToggleStatus={handleToggleCourtStatus}
          />
        ) : (
          <PricingTab
            pricingSlots={pricingSlots}
            onAddPricing={handleAddPricingGroup}
            onDeletePricing={handleDeletePricingSlot}
            onEditPricingGroup={handleEditPricingGroup}
            getDayTypeLabel={getDayTypeLabel}
            formatPrice={formatPrice}
            formatDaysOfWeek={formatDaysOfWeek}
          />
        )}
      </ScrollView>

      {/* Add Court Modal */}
      <Modal
        visible={showCourtModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCourtModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm sân con</Text>
              <TouchableOpacity onPress={() => setShowCourtModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Tên/Tiền tố sân *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Sân, Court, Sân con"
                value={courtFormData.name}
                onChangeText={(text) => setCourtFormData({ ...courtFormData, name: text })}
              />

              <Text style={styles.inputLabel}>Số lượng sân cần tạo *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={courtFormData.count}
                onChangeText={(text) => setCourtFormData({ ...courtFormData, count: text })}
                keyboardType="number-pad"
                returnKeyType="done"
              />
              <Text style={styles.helperText}>
                Hệ thống sẽ tự động tạo sân với tên: {courtFormData.name} 1, {courtFormData.name} 2...
              </Text>

              <PrimaryButton
                text={isSubmitting ? 'Đang thêm...' : 'Thêm sân'}
                onPress={handleAddCourt}
                disabled={isSubmitting}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Pricing Modal */}
      <Modal
        visible={showPricingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPricingModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thêm nhóm giá</Text>
                <TouchableOpacity onPress={() => setShowPricingModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Tên nhóm giá (Tuỳ chọn)</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 16 }]}
                  placeholder="VD: Giờ vàng, Sinh viên..."
                  value={pricingFormData.title}
                  onChangeText={(text) => setPricingFormData({ ...pricingFormData, title: text })}
                />

                <Text style={styles.inputLabel}>Chọn ngày trong tuần *</Text>
                <View style={styles.daysContainer}>
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        pricingFormData.days_of_week.includes(index) && styles.dayButtonActive,
                      ]}
                      onPress={() => {
                        const newDays = pricingFormData.days_of_week.includes(index)
                          ? pricingFormData.days_of_week.filter(d => d !== index)
                          : [...pricingFormData.days_of_week, index];
                        setPricingFormData({ ...pricingFormData, days_of_week: newDays });
                      }}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        pricingFormData.days_of_week.includes(index) && styles.dayButtonTextActive,
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.slotsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.inputLabel}>Khung giờ & giá *</Text>
                    <TouchableOpacity onPress={addPricingSlotRow} style={styles.addSlotRowBtn}>
                      <MaterialCommunityIcons name="plus-circle" size={20} color={COLORS.PRIMARY} />
                      <Text style={styles.addSlotRowText}>Thêm khung</Text>
                    </TouchableOpacity>
                  </View>

                  {pricingFormData.slots.map((slot, index) => (
                    <View key={index} style={[styles.slotRowCard, index === 0 && !slot.price ? { borderColor: COLORS.ERROR, borderWidth: 1 } : {}]}>
                      <View style={styles.slotRowHeader}>
                        <Text style={styles.slotRowIndex}>
                          {index === 0 ? 'Giá mặc định (Cho các giờ còn lại)' : `Khung #${index + 1}`}
                        </Text>
                        {index > 0 && (
                          <TouchableOpacity onPress={() => removePricingSlotRow(index)}>
                            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.ERROR} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {index === 0 && !slot.price && (
                        <Text style={{ color: COLORS.ERROR, fontSize: 12, marginBottom: 8 }}>
                          * Vui lòng điền giá mặc định.
                        </Text>
                      )}

                      {index > 0 && (
                        <View style={styles.row}>
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={styles.miniLabel}>Từ giờ</Text>
                            <TouchableOpacity
                              style={styles.timePickerBtn}
                              onPress={() => setTimePickerTarget({ slotIndex: index, field: 'start_time' })}
                            >
                              <Text style={slot.start_time ? styles.timePickerBtnText : styles.timePickerBtnPlaceholder}>
                                {slot.start_time || 'Chọn giờ'}
                              </Text>
                              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.PRIMARY} />
                            </TouchableOpacity>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.miniLabel}>Đến giờ</Text>
                            <TouchableOpacity
                              style={styles.timePickerBtn}
                              onPress={() => setTimePickerTarget({ slotIndex: index, field: 'end_time' })}
                            >
                              <Text style={slot.end_time ? styles.timePickerBtnText : styles.timePickerBtnPlaceholder}>
                                {slot.end_time || 'Chọn giờ'}
                              </Text>
                              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.PRIMARY} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.miniLabel}>Giá (VND/giờ) *</Text>
                        <View style={styles.priceInputWrapper}>
                          <TextInput
                            style={styles.priceInput}
                            placeholder="Ví dụ: 150000"
                            placeholderTextColor="#aaa"
                            value={slot.price}
                            onChangeText={(text) => {
                              const numeric = text.replace(/[^0-9]/g, '');
                              updatePricingSlotRow(index, 'price', numeric);
                            }}
                            keyboardType="number-pad"
                            returnKeyType="done"
                          />
                          <Text style={styles.priceUnit}>đ</Text>
                        </View>
                        {slot.price ? (
                          <Text style={styles.pricePreview}>
                            = {parseInt(slot.price || '0').toLocaleString('vi-VN')} đồng/giờ
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>

                <PrimaryButton
                  text={isSubmitting ? 'Đang lưu...' : 'Lưu nhóm giá'}
                  onPress={handleAddPricingSlot}
                  disabled={isSubmitting}
                  style={styles.modalButton}
                />
                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Time Picker Overlay (Inside Pricing Modal to avoid overlapping bugs) */}
        {timePickerTarget !== null && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            <TouchableOpacity
              style={styles.timePickerOverlay}
              activeOpacity={1}
              onPress={() => setTimePickerTarget(null)}
            >
              <View style={styles.timePickerSheet}>
                <View style={styles.timePickerHeader}>
                  <Text style={styles.timePickerTitle}>
                    {timePickerTarget.field === 'start_time' ? 'Chọn giờ bắt đầu' : 'Chọn giờ kết thúc'}
                  </Text>
                  <TouchableOpacity onPress={() => setTimePickerTarget(null)}>
                    <MaterialCommunityIcons name="close" size={22} color="#333" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={TIME_OPTIONS}
                  keyExtractor={(item) => item}
                  style={{ maxHeight: 320 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const currentVal = pricingFormData.slots[timePickerTarget.slotIndex]?.[timePickerTarget.field] || '';
                    const isSelected = item === currentVal;
                    return (
                      <TouchableOpacity
                        style={[styles.timeOption, isSelected && styles.timeOptionActive]}
                        onPress={() => {
                          updatePricingSlotRow(timePickerTarget.slotIndex, timePickerTarget.field, item);
                          setTimePickerTarget(null);
                        }}
                      >
                        <Text style={[styles.timeOptionText, isSelected && styles.timeOptionTextActive]}>
                          {item}
                        </Text>
                        {isSelected && <MaterialCommunityIcons name="check" size={18} color={COLORS.PRIMARY} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* Profile Selection Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Profile cấu hình giá</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.helperText}>
                Chọn một profile giá đã lưu để áp dụng nhanh cho toàn bộ sân của venue này.
              </Text>

              {pricingProfiles.length === 0 ? (
                <View style={styles.emptyStateMini}>
                  <Text style={styles.emptyTextMini}>Chưa có profile nào được tạo.</Text>
                </View>
              ) : (
                pricingProfiles.map((profile) => {
                  const inUse = isProfileInUse(profile);
                  const isEditing = editingProfileId === profile.id;

                  return (
                    <View key={profile.id} style={styles.profileItem}>
                      <View style={[styles.profileInfo, { paddingRight: 8 }]}>
                        {isEditing ? (
                          <TextInput
                            style={[styles.input, { marginBottom: 8, padding: 8, fontSize: 16 }]}
                            value={editingProfileName}
                            onChangeText={setEditingProfileName}
                            placeholder="Nhập tên profile..."
                            autoFocus
                          />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={styles.profileName}>{profile.name}</Text>
                            <TouchableOpacity onPress={() => {
                              setEditingProfileId(profile.id);
                              setEditingProfileName(profile.name);
                            }} style={{ marginLeft: 8 }}>
                              <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.PRIMARY} />
                            </TouchableOpacity>
                          </View>
                        )}
                        <Text style={styles.profileDesc}>{profile.description || 'Không có mô tả'}</Text>
                        <Text style={styles.profileSlotsCount}>
                          {profile.slots.length} khung giờ
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        {isEditing ? (
                          <TouchableOpacity
                            style={[styles.outlineButton, { borderColor: COLORS.SUCCESS }]}
                            onPress={() => handleSaveProfileName(profile.id)}
                          >
                            <Text style={[styles.outlineButtonText, { color: COLORS.SUCCESS }]}>Lưu</Text>
                          </TouchableOpacity>
                        ) : inUse ? (
                          <View style={[styles.defaultBadge, { backgroundColor: '#e8f5e9', paddingVertical: 6, paddingHorizontal: 10 }]}>
                            <Text style={[styles.defaultBadgeText, { color: COLORS.SUCCESS }]}>Đang sử dụng</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.outlineButton}
                            onPress={() => handleApplyProfile(profile.id)}
                          >
                            <Text style={styles.outlineButtonText}>Dùng profile</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Courts Tab Component
const CourtsTab: React.FC<{
  courts: CourtResponse[];
  onAddCourt: () => void;
  onDeleteCourt: (courtId: string, courtName: string) => void;
  onToggleStatus: (courtId: string, currentStatus: boolean) => void;
}> = ({ courts, onAddCourt, onDeleteCourt, onToggleStatus }) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh sách sân con</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddCourt}>
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.WHITE} />
          <Text style={styles.addButtonText}>Thêm sân</Text>
        </TouchableOpacity>
      </View>

      {courts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="tennis-ball" size={60} color="#DDD" />
          <Text style={styles.emptyText}>Chưa có sân con nào.</Text>
          <Text style={styles.emptySubtext}>Nhấn "Thêm sân" để bắt đầu.</Text>
        </View>
      ) : (
        courts.map((court) => (
          <View key={court.id} style={styles.courtItem}>
            <View style={styles.courtInfo}>
              <MaterialCommunityIcons
                name="tennis-ball"
                size={24}
                color={court.is_active ? COLORS.PRIMARY : COLORS.GRAY_MEDIUM}
              />
              <View>
                <Text style={[styles.courtName, !court.is_active && { color: COLORS.GRAY_MEDIUM }]}>
                  {court.name}
                </Text>
                <Text style={{ fontSize: 12, color: court.is_active ? COLORS.SUCCESS : COLORS.ERROR }}>
                  {court.is_active ? 'Đang hoạt động' : 'Đang bảo trì/Đóng'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={{ padding: 8, marginRight: 8 }}
                onPress={() => onToggleStatus(court.id, court.is_active)}
              >
                <MaterialCommunityIcons
                  name={court.is_active ? "toggle-switch" : "toggle-switch-off"}
                  size={32}
                  color={court.is_active ? COLORS.PRIMARY : COLORS.GRAY_MEDIUM}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeleteCourt(court.id, court.name)}
              >
                <MaterialCommunityIcons name="delete-outline" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

// Pricing Tab Component
const PricingTab: React.FC<{
  pricingSlots: PricingSlotResponse[];
  onAddPricing: () => void;
  onDeletePricing: (slotId: string) => void;
  onEditPricingGroup: (slots: PricingSlotResponse[]) => void;
  getDayTypeLabel: (dayType: DayType) => string;
  formatPrice: (price: number) => string;
  formatDaysOfWeek: (days: number[] | null | undefined) => string;
}> = ({ pricingSlots, onAddPricing, onDeletePricing, onEditPricingGroup, getDayTypeLabel, formatPrice, formatDaysOfWeek }) => {

  // Group slots by days_of_week
  const groupedSlots = pricingSlots.reduce((groups, slot) => {
    const daysKey = slot.days_of_week ? [...slot.days_of_week].sort().join(',') : slot.day_type;
    const key = slot.title ? `${slot.title}_${daysKey}` : daysKey;
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
    return groups;
  }, {} as Record<string, PricingSlotResponse[]>);

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bảng giá chi tiết</Text>
        <View style={[styles.row, { justifyContent: 'flex-end' }]}>
          <TouchableOpacity style={styles.addButton} onPress={onAddPricing}>
            <MaterialCommunityIcons name="plus" size={18} color={COLORS.WHITE} />
            <Text style={styles.addButtonText}>Thêm nhóm giá</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pricingSlots.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="tag-multiple" size={60} color="#DDD" />
          <Text style={styles.emptyText}>Chưa có cấu hình giá nào.</Text>
          <Text style={styles.emptySubtext}>
            Nhấn "Thêm nhóm giá" để bắt đầu thiết lập.
          </Text>
        </View>
      ) : (
        Object.entries(groupedSlots).map(([key, slots]) => (
          <View key={key} style={styles.pricingGroupCard}>
            <View style={styles.pricingGroupHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.pricingGroupName}>
                  {slots[0].title ? slots[0].title : (slots[0].days_of_week && slots[0].days_of_week.length > 0
                    ? formatDaysOfWeek(slots[0].days_of_week)
                    : getDayTypeLabel(slots[0].day_type))}
                </Text>
              </View>
              <TouchableOpacity onPress={() => onEditPricingGroup(slots)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.pricingSlotsList}>
              {slots.sort((a, b) => {
                if (a.is_default) return 1;
                if (b.is_default) return -1;
                return a.start_time.localeCompare(b.start_time);
              }).map((slot) => (
                <View key={slot.id} style={styles.pricingSlotRow}>
                  <View style={styles.slotTimeInfo}>
                    <Text style={styles.slotTimeText}>
                      {slot.is_default ? 'Mặc định (các giờ khác)' : `${slot.start_time} - ${slot.end_time}`}
                    </Text>
                  </View>
                  <View style={styles.slotPriceInfo}>
                    <Text style={styles.slotPriceText}>{formatPrice(slot.price)}</Text>
                    <TouchableOpacity
                      onPress={() => onDeletePricing(slot.id)}
                      style={styles.slotDeleteBtn}
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={18} color={COLORS.ERROR} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY_MEDIUM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  venueInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  venuePrice: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  courtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  courtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pricingItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingDayType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  pricingTime: {
    fontSize: 14,
    color: '#666',
  },
  pricingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  pricingFactor: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  dayTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dayTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  dayTypeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  dayTypeText: {
    fontSize: 12,
    color: '#666',
  },
  dayTypeTextActive: {
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  modalButton: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    gap: 4,
  },
  outlineButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  defaultBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  profileSlotsCount: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  emptyStateMini: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTextMini: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dayButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.PRIMARY, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  timePickerBtnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  timePickerBtnPlaceholder: { fontSize: 14, color: '#aaa' },
  timePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  timePickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  timePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  timePickerTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  timeOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  timeOptionActive: { backgroundColor: '#f0f9f4' },
  timeOptionText: { fontSize: 16, color: '#333' },
  timeOptionTextActive: { color: COLORS.PRIMARY, fontWeight: '700' },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 12 },
  priceInput: { flex: 1, fontSize: 17, fontWeight: '600', color: '#333', paddingVertical: 10 },
  priceUnit: { fontSize: 16, color: COLORS.PRIMARY, fontWeight: '700', marginLeft: 6 },
  pricePreview: { fontSize: 12, color: COLORS.PRIMARY, marginTop: 4, fontStyle: 'italic' },
  pricingGroupCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  pricingGroupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8 },
  pricingGroupName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  pricingSlotsList: { marginTop: 4 },
  pricingSlotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  slotTimeInfo: { flex: 1 },
  slotTimeText: { fontSize: 14, color: '#666' },
  slotPriceInfo: { flexDirection: 'row', alignItems: 'center' },
  slotPriceText: { fontSize: 15, fontWeight: '600', color: COLORS.PRIMARY, marginRight: 8 },
  slotDeleteBtn: { padding: 4 },
  slotsSection: { marginTop: 8, marginBottom: 16 },
  addSlotRowBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addSlotRowText: { fontSize: 14, color: COLORS.PRIMARY, fontWeight: '600', marginLeft: 4 },
  slotRowCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  slotRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  slotRowIndex: { fontSize: 13, fontWeight: 'bold', color: '#495057' },
  checkboxContainerSmall: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkboxLabelSmall: { fontSize: 13, color: '#495057', marginLeft: 8 },
  miniLabel: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: '600' },
  inputSmall: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#495057' },
});