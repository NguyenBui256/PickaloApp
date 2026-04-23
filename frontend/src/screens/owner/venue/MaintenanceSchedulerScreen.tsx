import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { BookingCell } from '../../../components/BookingCell';
import { fetchVenueAvailability } from '../../../services/venue-service';
import type { AvailabilityResponse } from '../../../types/api-types';

export const MaintenanceSchedulerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { venueId } = route.params || {};

  const [availabilityData, setAvailabilityData] = useState<AvailabilityResponse | null>(null);
  // Track local overrides for maintenance toggling
  const [overrides, setOverrides] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchVenueAvailability(venueId, today).then(setAvailabilityData).catch(console.error);
  }, [venueId]);

  const getSlotStatus = useCallback(
    (courtId: string, slotStart: string, available: boolean) => {
      const key = `${courtId}-${slotStart}`;
      if (overrides[key]) return overrides[key];
      return available ? 'available' : 'booked';
    },
    [overrides]
  );

  const toggleMaintenance = useCallback(
    (courtId: string, slotStart: string, available: boolean) => {
      const key = `${courtId}-${slotStart}`;
      const current = overrides[key] || (available ? 'available' : 'booked');
      // Only toggle available or locked slots. Ignore booked/event slots.
      if (current === 'available') {
        setOverrides((prev) => ({ ...prev, [key]: 'locked' }));
      } else if (current === 'locked') {
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [overrides]
  );

  const handleSave = () => {
    Alert.alert('Thành công', 'Đã lưu lịch bảo trì thành công.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={30} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thiết lập bảo trì</Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.dateSelector}>
            <MaterialCommunityIcons name="calendar-month" size={24} color={COLORS.WHITE} />
            <Text style={styles.dateText}>Thứ 4, 08/04/2026</Text>
          </View>

          <Text style={styles.instructionText}>
            Chạm vào các ô trống để hẹn giờ bảo trì (Chuyển sang màu Xám).
          </Text>
        </SafeAreaView>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.timeHeaderRow}>
              <View style={styles.courtHeaderCell}>
                <Text style={styles.courtHeaderText}>Sân / Giờ</Text>
              </View>
              {availabilityData?.courts[0]?.slots.map((slot) => (
                <View key={slot.start_time} style={styles.timeLabelCell}>
                  <Text style={styles.timeLabelText}>{slot.start_time}</Text>
                </View>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {availabilityData?.courts.map((court) => (
                <View key={court.court_id} style={styles.courtRow}>
                  <View style={styles.courtNameCell}>
                    <Text style={styles.courtNameText}>{court.court_name}</Text>
                  </View>
                  {court.slots.map((slot) => {
                    const status = getSlotStatus(court.court_id, slot.start_time, slot.available);
                    return (
                      <BookingCell
                        key={`${court.court_id}-${slot.start_time}`}
                        status={status}
                        isSelected={false}
                        onPress={() =>
                          toggleMaintenance(court.court_id, slot.start_time, slot.available)
                        }
                        isMaintenanceMode={true}
                      />
                    );
                  })}
                </View>
              ))}
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Save Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <MaterialCommunityIcons name="content-save" size={24} color={COLORS.WHITE} />
          <Text style={styles.saveBtnText}>Lưu lịch bảo trì</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  header: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginBottom: 20,
  },
  backBtn: {
    padding: 5,
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  dateText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionText: {
    color: COLORS.WHITE,
    opacity: 0.9,
    fontSize: 14,
    marginTop: 5,
  },
  gridContainer: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: COLORS.WHITE,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courtHeaderCell: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  courtHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  timeLabelCell: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeLabelText: {
    fontSize: 12,
    color: '#666',
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courtNameCell: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  courtNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    padding: 20,
    paddingBottom: 30, // SafeArea
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  saveBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  saveBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
