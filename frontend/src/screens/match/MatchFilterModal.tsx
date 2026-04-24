import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import COLORS from '@theme/colors';

interface MatchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters: any;
}

export const MatchFilterModal: React.FC<MatchFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [skillLevel, setSkillLevel] = useState(initialFilters.skillLevel || 'ALL');
  const [members, setMembers] = useState(initialFilters.members || 'Any');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialFilters.date ? new Date(initialFilters.date) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(initialFilters.startTime || null);
  const [endTime, setEndTime] = useState(initialFilters.endTime || null);
  const [radiusKm, setRadiusKm] = useState<number | null>(initialFilters.radiusKm || null);
  
  // States for custom dropdowns
  const [selectingTime, setSelectingTime] = useState<'start' | 'end' | null>(null);

  const skillLevels = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Cơ bản', value: 'BEGINNER' },
    { label: 'Trung bình', value: 'INTERMEDIATE' },
    { label: 'Nâng cao', value: 'ADVANCED' },
  ];

  const memberOptions = ['Any', '1', '2', '3', '4+'];

  const timeOptions: string[] = [];
  for (let h = 5; h <= 23; h++) {
    timeOptions.push(`${h < 10 ? '0' + h : h}:00`);
  }

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleApply = () => {
    onApply({
      skillLevel,
      members: members === 'Any' ? null : members,
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
      startTime,
      endTime,
      radiusKm,
    });
    onClose();
  };

  const renderTimeDropdown = (type: 'start' | 'end') => {
    return (
      <View style={styles.dropdownContainer}>
        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
          {timeOptions.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.dropdownItem,
                (type === 'start' ? startTime : endTime) === time && styles.dropdownItemActive
              ]}
              onPress={() => {
                if (type === 'start') setStartTime(time);
                else setEndTime(time);
                setSelectingTime(null);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                (type === 'start' ? startTime : endTime) === time && styles.dropdownItemTextActive
              ]}>{time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Bộ lọc tìm kèo</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} nestedScrollEnabled>
            {/* DATE SELECTOR */}
            <Text style={styles.sectionTitle}>Ngày diễn ra</Text>
            <TouchableOpacity 
              style={styles.pickerField}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.pickerFieldText}>
                {selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Chọn ngày diễn ra'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.GRAY_MEDIUM} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.sectionTitle}>Trình độ yêu cầu</Text>
            <View style={styles.chipContainer}>
              {skillLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.chip,
                    skillLevel === level.value && styles.chipActive
                  ]}
                  onPress={() => setSkillLevel(level.value)}
                >
                  <Text style={[
                    styles.chipText,
                    skillLevel === level.value && styles.chipTextActive
                  ]}>{level.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* TIME RANGE SELECTORS */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Giờ bắt đầu</Text>
                <TouchableOpacity 
                  style={styles.pickerField}
                  onPress={() => setSelectingTime(selectingTime === 'start' ? null : 'start')}
                >
                  <Text style={styles.pickerFieldText}>{startTime || 'Bất kỳ'}</Text>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.GRAY_MEDIUM} />
                </TouchableOpacity>
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Giờ kết thúc</Text>
                <TouchableOpacity 
                  style={styles.pickerField}
                  onPress={() => setSelectingTime(selectingTime === 'end' ? null : 'end')}
                >
                  <Text style={styles.pickerFieldText}>{endTime || 'Bất kỳ'}</Text>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.GRAY_MEDIUM} />
                </TouchableOpacity>
              </View>
            </View>

            {/* In-place Dropdown for Time */}
            {selectingTime && renderTimeDropdown(selectingTime)}

            <Text style={styles.sectionTitle}>Số lượng người còn thiếu</Text>
            <View style={styles.chipContainer}>
              {memberOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chip,
                    members === opt && styles.chipActive
                  ]}
                  onPress={() => setMembers(opt)}
                >
                  <Text style={[
                    styles.chipText,
                    members === opt && styles.chipTextActive
                  ]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* RADIUS FILTER */}
            <Text style={styles.sectionTitle}>Khoảng cách tối đa</Text>
            <View style={styles.radiusRow}>
              <TouchableOpacity
                style={[styles.radiusBtn, !radiusKm && styles.radiusBtnDisabled]}
                onPress={() => setRadiusKm(prev => prev && prev > 1 ? prev - 1 : prev)}
                disabled={!radiusKm}
              >
                <MaterialCommunityIcons name="minus" size={22} color={radiusKm && radiusKm > 1 ? COLORS.TEXT_PRIMARY : COLORS.GRAY_MEDIUM} />
              </TouchableOpacity>

              <TextInput
                style={styles.radiusInput}
                keyboardType="numeric"
                value={radiusKm != null ? String(radiusKm) : ''}
                placeholder="Không giới hạn"
                placeholderTextColor={COLORS.GRAY_MEDIUM}
                onChangeText={(text) => {
                  const n = parseInt(text);
                  setRadiusKm(isNaN(n) || n <= 0 ? null : n);
                }}
              />

              <Text style={styles.radiusUnit}>km</Text>

              <TouchableOpacity
                style={styles.radiusBtn}
                onPress={() => setRadiusKm(prev => (prev || 0) + 1)}
              >
                <MaterialCommunityIcons name="plus" size={22} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>

              {radiusKm != null && (
                <TouchableOpacity
                  style={styles.radiusClear}
                  onPress={() => setRadiusKm(null)}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.GRAY_MEDIUM} />
                </TouchableOpacity>
              )}
            </View>
            {radiusKm != null && (
              <Text style={styles.radiusHint}>🔵 Hiển thị vòng tròn bán kính {radiusKm} km trên bản đồ</Text>
            )}

          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={() => {
                setSkillLevel('ALL');
                setMembers('Any');
                setSelectedDate(null);
                setStartTime(null);
                setEndTime(null);
                setRadiusKm(null);
              }}
            >
              <Text style={styles.resetBtnText}>Thiết lập lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
    marginTop: 15,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerFieldText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 10,
  },
  timeRow: {
    flexDirection: 'row',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  chipTextActive: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 5,
    maxHeight: 200,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownList: {
    padding: 5,
  },
  dropdownItem: {
    padding: 12,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  dropdownItemTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 15,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetBtnText: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: 'bold',
  },
  applyBtn: {
    flex: 2,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  applyBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
    gap: 4,
  },
  radiusBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  radiusBtnDisabled: {
    opacity: 0.4,
    elevation: 0,
    shadowOpacity: 0,
  },
  radiusInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: 6,
  },
  radiusUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginRight: 4,
  },
  radiusClear: {
    padding: 4,
  },
  radiusHint: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 6,
    marginLeft: 2,
  },
});
