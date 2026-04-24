import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import { differenceInDays, format, addDays } from 'date-fns';
import COLORS from '@theme/colors';
import { fetchMyVenues, fetchRevenueTrend } from '../../services/merchant-service';
import { vi } from 'date-fns/locale';
import { formatCurrency } from '../../utils/format';

export const OwnerRevenueReportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'CUSTOM'>('WEEK');

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [ownerVenue, setOwnerVenue] = useState<any>({
    revenue_mtd: 0, total_bookings: 0, name: 'Đang tải...', rating: 0, status: 'ACTIVE',
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    fetchMyVenues().then(res => {
      if (res?.length > 0) setOwnerVenue(res[0]);
    });
  }, []);

  useEffect(() => {
    const days = timeRange === 'WEEK' ? 7 : timeRange === 'MONTH' ? 30 : differenceInDays(endDate, startDate) + 1;
    if (days > 0 && days <= 31) {
      fetchRevenueTrend(days).then(res => {
        if (res?.items) {
          setRevenueData(res.items);
        }
      });
    }
  }, [timeRange, startDate, endDate]);


  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      const diff = differenceInDays(endDate, selectedDate);
      if (diff > 6) {
        Alert.alert('Giới hạn', 'Chỉ hỗ trợ xem không quá 7 ngày.');
      } else if (diff < 0) {
        Alert.alert('Lỗi', 'Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      const diff = differenceInDays(selectedDate, startDate);
      if (diff > 6) {
        Alert.alert('Giới hạn', 'Chỉ hỗ trợ xem không quá 7 ngày.');
      } else if (diff < 0) {
        Alert.alert('Lỗi', 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      }
    }
  };

  // Mock data fitting
  const weekLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const weekData = [2000000, 1500000, 1800000, 3000000, 4000000, 6000000, ownerVenue.revenue_mtd * 0.1];

  const monthLabels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
  const monthData = [40000000, 50000000, 35000000, ownerVenue.revenue_mtd];

  let labels: string[] = [];
  let data: number[] = [];
  let isDataValid = true;

  if (isDataValid && revenueData.length > 0) {
    labels = revenueData.map(item => {
      const d = new Date(item.date);
      return timeRange === 'WEEK' ? format(d, 'eee', { locale: vi }) : format(d, 'dd/MM');
    });
    data = revenueData.map(item => Number(item.revenue));
  }

  const currentTotal = isDataValid && data.length > 0 ? data.reduce((a, b) => a + b, 0) : 0;
  const hasData = currentTotal > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={32} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Báo cáo doanh thu</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Time Filters */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.filterChip, timeRange === 'WEEK' && styles.activeChip]}
              onPress={() => setTimeRange('WEEK')}
            >
              <Text style={[styles.filterText, timeRange === 'WEEK' && styles.activeFilterText]}>7 ngày qua</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, timeRange === 'MONTH' && styles.activeChip]}
              onPress={() => setTimeRange('MONTH')}
            >
              <Text style={[styles.filterText, timeRange === 'MONTH' && styles.activeFilterText]}>Tháng này ({Math.round(ownerVenue.revenue_mtd / 1000000)}M)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, timeRange === 'CUSTOM' && styles.activeChip]}
              onPress={() => setTimeRange('CUSTOM')}
            >
              <Text style={[styles.filterText, timeRange === 'CUSTOM' && styles.activeFilterText]}>Tùy chọn</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {timeRange === 'CUSTOM' && (
          <View style={styles.customDateContainer}>
            <View style={styles.dateSelectorRow}>
              <View style={styles.dateGroup}>
                <Text style={styles.dateLabel}>Từ ngày</Text>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#1976D2" />
                  <Text style={styles.dateValue}>{format(startDate, 'dd/MM/yyyy')}</Text>
                </TouchableOpacity>
              </View>

              <MaterialCommunityIcons name="arrow-right" size={20} color="#999" style={{marginTop: 20}} />

              <View style={styles.dateGroup}>
                <Text style={styles.dateLabel}>Đến ngày</Text>
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#1976D2" />
                  <Text style={styles.dateValue}>{format(endDate, 'dd/MM/yyyy')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
              />
            )}
          </View>
        )}

        {/* Total Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
          <Text style={styles.summaryValue}>{formatCurrency(currentTotal)}</Text>
          {hasData && (
            <View style={styles.trendRow}>
              <MaterialCommunityIcons name="trending-up" size={16} color="#4CAF50" />
              <Text style={styles.trendText}>Tăng 12% so với kỳ trước</Text>
            </View>
          )}
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Biểu đồ tăng trưởng</Text>
          
          {!isDataValid ? (
            <View style={styles.noDataBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#FF9800" />
              <Text style={styles.noDataText}>Khoảng thời gian không hợp lệ. Vui lòng chọn khoảng tĩnh không quá 7 ngày.</Text>
            </View>
          ) : !hasData ? (
            <View style={styles.noDataBox}>
              <MaterialCommunityIcons name="chart-bubble" size={40} color="#CCC" />
              <Text style={styles.noDataText}>Không có dữ liệu hiển thị cho khoảng thời gian này.</Text>
            </View>
          ) : (
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: data }]
              }}
              width={Dimensions.get("window").width - 32}
              height={260}
              yAxisSuffix=" đ"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: COLORS.WHITE,
                backgroundGradientFrom: COLORS.WHITE,
                backgroundGradientTo: COLORS.WHITE,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#1976D2"
                },
                propsForBackgroundLines: {
                  strokeDasharray: "4",
                  stroke: "rgba(0,0,0,0.05)"
                }
              }}
              bezier
              style={styles.chartStyle}
            />
          )}
        </View>

        {/* Breakdown List */}
        {hasData && (
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Cơ cấu nguồn thu</Text>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownItem}>
                <View style={styles.breakLeft}>
                  <View style={[styles.dot, { backgroundColor: '#1976D2' }]} />
                  <Text style={styles.breakLabel}>Lịch đặt sân</Text>
                </View>
                <Text style={styles.breakValue}>{formatCurrency(currentTotal * 0.8)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownItem}>
                <View style={styles.breakLeft}>
                  <View style={[styles.dot, { backgroundColor: '#FF9800' }]} />
                  <Text style={styles.breakLabel}>Dịch vụ (Nước uống, Thuê vợt)</Text>
                </View>
                <Text style={styles.breakValue}>{formatCurrency(currentTotal * 0.2)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 50,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  filterRow: {
    marginBottom: 20,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  activeChip: {
    backgroundColor: '#1976D2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterText: {
    color: COLORS.WHITE,
  },
  customDateContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroup: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 10,
    borderRadius: 8,
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  chartStyle: {
    borderRadius: 16,
    marginLeft: -20,
  },
  noDataBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  breakdownSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  breakValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
});
