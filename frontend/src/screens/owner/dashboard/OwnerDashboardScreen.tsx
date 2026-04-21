import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { OWNER_VENUES } from '../../../constants/mock-data';

export const OwnerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const ownerVenue = OWNER_VENUES[0];

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2C3E50', '#000000']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Chào buổi tối,</Text>
              <Text style={styles.ownerName}>Chủ sân ALOBO</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <MaterialCommunityIcons name="bell-outline" size={26} color={COLORS.WHITE} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Doanh thu tháng này</Text>
              <Text style={styles.statValue}>{formatCurrency(ownerVenue.revenue_mtd)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tổng lượt đặt</Text>
              <Text style={styles.statValue}>{ownerVenue.total_bookings}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.chartContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('OwnerRevenueReport')}
        >
          <Text style={styles.chartTitle}>Biểu đồ doanh thu 7 ngày qua</Text>
          <LineChart
            data={{
              labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
              datasets: [
                {
                  data: [
                    Math.random() * 1000000,
                    Math.random() * 1000000,
                    Math.random() * 1000000,
                    Math.random() * 1000000,
                    Math.random() * 1000000,
                    Math.random() * 1000000,
                    ownerVenue.revenue_mtd * 0.1
                  ]
                }
              ]
            }}
            width={Dimensions.get("window").width - 40}
            height={220}
            yAxisSuffix="đ"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: "#1976D2",
              backgroundGradientFrom: "#1976D2",
              backgroundGradientTo: "#2C3E50",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Schedules')}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="calendar-check" size={28} color="#1976D2" />
            </View>
            <Text style={styles.actionLabel}>Duyệt lịch</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyVenues')}>
            <View style={[styles.iconContainer, { backgroundColor: '#F1F8E9' }]}>
              <MaterialCommunityIcons name="plus-box" size={28} color="#388E3C" />
            </View>
            <Text style={styles.actionLabel}>Thêm sân</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Services')}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="room-service" size={28} color="#F57C00" />
            </View>
            <Text style={styles.actionLabel}>Dịch vụ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => alert('Tính năng đang phát triển')}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
              <MaterialCommunityIcons name="chart-bar" size={28} color="#7B1FA2" />
            </View>
            <Text style={styles.actionLabel}>Báo cáo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.venueInfoCard}>
          <Text style={styles.cardTitle}>Sân đang quản lý</Text>
          <TouchableOpacity style={styles.venueItem} onPress={() => navigation.navigate('MyVenues')}>
            <View style={styles.venueDetails}>
              <Text style={styles.venueName}>{ownerVenue.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.ratingText}>{ownerVenue.rating}</Text>
                <Text style={styles.statusBadge}>{ownerVenue.status}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.GRAY_MEDIUM} />
          </TouchableOpacity>
        </View>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  ownerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    borderWidth: 2,
    borderColor: '#2C3E50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 15,
    borderRadius: 16,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  venueInfoCard: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueDetails: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    marginRight: 10,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#388E3C',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chartContainer: {
    marginBottom: 25,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
});
