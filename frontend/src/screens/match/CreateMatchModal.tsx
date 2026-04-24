import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { matchService } from '../../services/match-service';
import type { BookingListItem, MatchSkillLevel } from '../../types/api-types';

interface CreateMatchModalProps {
  visible: boolean;
  booking: BookingListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  visible,
  booking,
  onClose,
  onSuccess,
}) => {
  const [slotsNeeded, setSlotsNeeded] = useState('1');
  const [pricePerSlot, setPricePerSlot] = useState('');
  const [skillLevel, setSkillLevel] = useState<MatchSkillLevel>('ALL');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const handleSubmit = async () => {
    if (!slotsNeeded || isNaN(Number(slotsNeeded)) || Number(slotsNeeded) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng người cần tìm hợp lệ.');
      return;
    }
    if (!pricePerSlot || isNaN(Number(pricePerSlot)) || Number(pricePerSlot) < 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá chia mỗi người hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      await matchService.createMatch({
        booking_id: booking.id,
        slots_needed: Number(slotsNeeded),
        price_per_slot: Number(pricePerSlot),
        skill_level: skillLevel,
        note: note.trim() || null,
      });
      Alert.alert('Thành công', 'Đã mở ghép kèo thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Không thể tạo kèo lúc này.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const SkillBadge = ({ level, label }: { level: MatchSkillLevel; label: string }) => {
    const isActive = skillLevel === level;
    return (
      <TouchableOpacity
        style={[styles.skillBadge, isActive && styles.skillBadgeActive]}
        onPress={() => setSkillLevel(level)}
      >
        <Text style={[styles.skillText, isActive && styles.skillTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Mở Ghép Kèo</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.GRAY_MEDIUM} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.subtitle}>
                  {`Sân: ${booking.venue_name || 'N/A'} (${booking.start_time || ''}-${booking.end_time || ''})`}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Số người cần tìm thêm *</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={slotsNeeded}
                    onChangeText={setSlotsNeeded}
                    placeholder="Ví dụ: 2"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit={true}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Giá chia mỗi người (VNĐ) *</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={pricePerSlot}
                    onChangeText={setPricePerSlot}
                    placeholder="Ví dụ: 50000"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit={true}
                  />
                  <Text style={styles.hint}>
                    {`Căn cứ theo giá gốc: ${Number(booking.total_price || 0).toLocaleString('vi-VN')} đ`}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Yêu cầu trình độ</Text>
                  <View style={styles.skillRow}>
                    <SkillBadge level="ALL" label="Tất cả" />
                    <SkillBadge level="BEGINNER" label="Gà/Mới chơi" />
                    <SkillBadge level="INTERMEDIATE" label="Trung bình" />
                    <SkillBadge level="ADVANCED" label="Khá/Giỏi" />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ghi chú (Không bắt buộc)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={3}
                    value={note}
                    onChangeText={setNote}
                    placeholder="VD: Mang theo áo trắng, đá cánh trái..."
                    blurOnSubmit={true}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.WHITE} />
                  ) : (
                    <Text style={styles.submitBtnText}>Đăng Kèo Lên Bản Đồ</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 4,
    fontStyle: 'italic',
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  skillBadgeActive: {
    backgroundColor: '#FFF7ED', // Orange-50
    borderColor: '#F97316', // Orange-500
  },
  skillText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  skillTextActive: {
    color: '#F97316',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#F97316', // Orange-500 for matching
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
