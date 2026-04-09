import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { BOOKING_COURTS, TIME_SLOTS, MOCK_AVAILABILITY } from '../../constants/mock-data';
import { BookingCell } from '../../components/BookingCell';
import { BookingSummaryBar } from '../../components/BookingSummaryBar';

const { width } = Dimensions.get('window');
const COURT_COLUMN_WIDTH = 100;
const TIME_CELL_WIDTH = 60;
const CELL_HEIGHT = 40;
const PRICE_PER_SLOT = 95000;

export const BookingDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { venueId } = route.params || {};

  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Format price helper
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Calculations
  const bookingSummary = useMemo(() => {
    const totalSlots = selectedSlots.length;
    const totalMinutes = totalSlots * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h${minutes > 0 ? minutes : '00'}` : `${minutes}ph`;
    
    return {
      timeStr,
      totalPrice: formatCurrency(totalSlots * PRICE_PER_SLOT),
    };
  }, [selectedSlots]);

  const toggleSlot = useCallback((court: string, slot: string) => {
    const slotId = `${court}-${slot}`;
    setSelectedSlots(prev => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={30} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chọn thời gian</Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.dateSelector}>
            <Icon name="calendar-month" size={24} color={COLORS.WHITE} />
            <Text style={styles.dateText}>Thứ 4, 08/04/2026</Text>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.WHITE, borderWidth: 0.5, borderColor: COLORS.BORDER }]} />
              <Text style={styles.legendLabel}>Trống</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#ff5252' }]} />
              <Text style={styles.legendLabel}>Đã đặt</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#9e9e9e' }]} />
              <Text style={styles.legendLabel}>Khóa</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#e040fb' }]} />
              <Text style={styles.legendLabel}>Sự kiện</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* 2D Matrix Grid */}
      <View style={styles.gridContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Sticky Time Header (Scrolls Horizontally) */}
            <View style={styles.timeHeaderRow}>
              <View style={styles.courtHeaderCell}>
                <Text style={styles.courtHeaderText}>Sân / Giờ</Text>
              </View>
              {TIME_SLOTS.map((slot) => (
                <View key={slot} style={styles.timeLabelCell}>
                  <Text style={styles.timeLabelText}>{slot}</Text>
                </View>
              ))}
            </View>

            {/* Matrix Content */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {BOOKING_COURTS.map((court) => (
                <View key={court} style={styles.courtRow}>
                  {/* Sticky Court Column (Scrolls Vertically) */}
                  <View style={styles.courtNameCell}>
                    <Text style={styles.courtNameText}>{court}</Text>
                  </View>
                  
                  {/* Row Cells */}
                  {TIME_SLOTS.map((slot) => {
                    const slotId = `${court}-${slot}`;
                    return (
                      <BookingCell
                        key={slotId}
                        status={MOCK_AVAILABILITY[slotId]}
                        isSelected={selectedSlots.includes(slotId)}
                        onPress={() => toggleSlot(court, slot)}
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

      {/* Summary Bar */}
      <BookingSummaryBar
        isVisible={selectedSlots.length > 0}
        totalHours={bookingSummary.timeStr}
        totalPrice={bookingSummary.totalPrice}
        onNext={() => navigation.navigate('Payment', { venueId, selectedSlots })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  backBtn: {
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 18,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: COLORS.WHITE,
  },
  gridContainer: {
    flex: 1,
    marginTop: 10,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  courtHeaderCell: {
    width: COURT_COLUMN_WIDTH,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER,
    backgroundColor: '#EEEEEE',
  },
  courtHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.GRAY_MEDIUM,
  },
  timeLabelCell: {
    width: TIME_CELL_WIDTH,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#E0E0E0',
  },
  timeLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  courtRow: {
    flexDirection: 'row',
  },
  courtNameCell: {
    width: COURT_COLUMN_WIDTH,
    height: CELL_HEIGHT,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  courtNameText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
});
