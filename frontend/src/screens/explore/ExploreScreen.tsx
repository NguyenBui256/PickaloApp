import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { MEMBERSHIPS, EXPLORE_FILTERS } from '../../constants/mock-data';

const { width } = Dimensions.get('window');

export const ExploreScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Filter Pills */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {EXPLORE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterPill,
                  activeFilter === filter && styles.activePill,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.activeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Location Info Header */}
          <View style={styles.locationHeader}>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationName}>Master Bros Nguyễn Xiển</Text>
              <Text style={styles.dateText}>30/03/2026</Text>
            </View>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.addressText} numberOfLines={1}>
                B1 - Tòa nhà Ecogreen, 286 Nguyễn Xiển...
              </Text>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>2.3km</Text>
              </View>
            </View>
          </View>

          {/* Membership List */}
          <View style={styles.membershipList}>
            {MEMBERSHIPS.map((item) => (
              <View key={item.id} style={styles.membershipCard}>
                {/* Numeric Badge */}
                <View style={styles.numericBadge}>
                  <Text style={styles.badgeText}>{item.badgeNumber}</Text>
                </View>

                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.packageName}>{item.packageName}</Text>

                  {/* Icon details row */}
                  <View style={styles.detailIconsRow}>
                    <View style={styles.detailIconItem}>
                      <MaterialCommunityIcons name="calendar-clock" size={18} color={COLORS.GRAY_MEDIUM} />
                      <Text style={styles.detailIconText}>Thời hạn: {item.duration}</Text>
                    </View>
                    <View style={styles.detailIconItem}>
                      <MaterialCommunityIcons name="ticket-percent-outline" size={18} color={COLORS.GRAY_MEDIUM} />
                      <Text style={styles.detailIconText}>Miễn phí: {item.freeTickets}</Text>
                    </View>
                    <View style={styles.detailIconItem}>
                      <MaterialCommunityIcons name="tennis-ball" size={18} color={COLORS.GRAY_MEDIUM} />
                      <Text style={styles.detailIconText}>Loại sân: {item.courtType}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.priceText}>{item.price}</Text>
                    <TouchableOpacity style={styles.registerBtn}>
                      <Text style={styles.registerBtnText}>Đăng ký</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Promotional Banner Footer */}
          <View style={styles.footerBannerContainer}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerBanner}
            >
              <View style={styles.bannerTextContent}>
                <Text style={styles.bannerHeading}>PICKLEBALL</Text>
                <Text style={styles.bannerSub}>Khám phá ngay các ưu đãi mới nhất!</Text>
              </View>
              <MaterialCommunityIcons name="rocket-launch" size={50} color="rgba(255,255,255,0.3)" style={styles.bannerGraphic} />
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  safeArea: {
    flex: 1,
  },
  filterSection: {
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  activePill: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  activeFilterText: {
    color: COLORS.WHITE,
  },
  scrollContent: {
    paddingBottom: 100, // Space for custom tab bar
  },
  locationHeader: {
    padding: 16,
    backgroundColor: COLORS.WHITE,
    marginBottom: 12,
  },
  locationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: 'rgba(15, 107, 58, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  membershipList: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 20,
  },
  membershipCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  numericBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  packageName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  detailIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailIconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailIconText: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  registerBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registerBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerBannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  footerBanner: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bannerTextContent: {
    flex: 1,
  },
  bannerHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.WHITE,
    letterSpacing: 1,
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  bannerGraphic: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
});
