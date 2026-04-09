import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { MOCK_BOOKINGS, Booking } from '../../constants/mock-data';

const Ribbon = ({ text }: { text: string }) => (
  <View style={styles.ribbonContainer}>
    <View style={styles.ribbonMain}>
      <Text style={styles.ribbonText}>{text}</Text>
    </View>
    <View style={styles.ribbonTail}>
        <View style={styles.tailTriangle} />
    </View>
  </View>
);

const BookingCard = ({ item }: { item: Booking }) => {
  const isCanceled = item.status === 'canceled';
  const isSuccess = item.status === 'success';

  const getStatusConfig = () => {
    if (isCanceled) return { label: 'Đã hủy', color: '#EA580C', icon: 'close-circle' };
    if (isSuccess) return { label: 'Thành công', color: '#16A34A', icon: 'check-circle' };
    return { label: 'Chờ thanh toán', color: '#CA8A04', icon: 'clock' };
  };

  const status = getStatusConfig();

  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('BookingHistoryDetail', { booking: item })}
    >
      <Ribbon text={item.type} />
      
      <View style={styles.cardHeader}>
        <Text style={styles.clubName} numberOfLines={2}>{item.clubName}</Text>
        <View style={styles.statusRow}>
           <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
           <Icon name={status.icon} size={18} color={status.color} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Chi tiết:</Text>
          <Text style={styles.infoValue}>{item.time} | {item.date}</Text>
        </View>
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Địa chỉ:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>{item.address}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <Text style={styles.priceText}>{item.price} đ</Text>
         <TouchableOpacity 
            style={styles.detailBtn}
            onPress={() => navigation.navigate('BookingHistoryDetail', { booking: item })}
         >
            <Text style={styles.detailBtnText}>Xem chi tiết</Text>
         </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const BookingListScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={30} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Danh sách đặt lịch</Text>
            <View style={{ width: 30 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterSection}>
        <TouchableOpacity style={styles.filterBar}>
          <Text style={styles.filterText}>Xem tất cả</Text>
          <Icon name="calendar-month-outline" size={20} color={COLORS.GRAY_MEDIUM} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={MOCK_BOOKINGS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Light Mint Green
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  backBtn: {
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  filterSection: {
    padding: 16,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    paddingTop: 24, // Space for ribbon
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  ribbonContainer: {
    position: 'absolute',
    top: 0,
    left: 10,
    flexDirection: 'row',
  },
  ribbonMain: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  ribbonText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  ribbonTail: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tailTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.WHITE,
    transform: [{ rotate: '180deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  clubName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C2410C', // Orange-700
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 6,
    marginBottom: 15,
  },
  infoLine: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    width: 60,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  detailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  detailBtnText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});
