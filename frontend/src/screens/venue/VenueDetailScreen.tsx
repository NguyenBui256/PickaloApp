import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchVenueById } from '../../services/venue-service';
import { BookingModal } from '../../components/BookingModal';

type RootStackParamList = {
  VenueDetails: { venueId: string };
  BookingDetails: { venueId: string };
};

type VenueDetailsRouteProp = RouteProp<RootStackParamList, 'VenueDetails'>;

const TABS = ['Thông tin', 'Dịch vụ', 'Hình ảnh', 'Điều khoản & quy định', 'Đánh giá'];

export const VenueDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<VenueDetailsRouteProp>();
  const { venueId } = route.params;

  const [venue, setVenue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Thông tin');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);

  useEffect(() => {
    fetchVenueById(venueId).then(res => {
      if (res) {
        setVenue(res);
        // @ts-ignore - isFavorite là field mở rộng của FE mock
        setIsFavorite((res as any).isFavorite || false);
      }
    });
  }, [venueId]);

  const handleBookPress = () => {
    setBookingModalVisible(true);
  };

  const handleSelectBookingOption = (type: 'normal' | 'event') => {
    setBookingModalVisible(false);
    navigation.navigate('BookingDetails', { venueId: venue?.id, type });
  };

  if (!venue) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy thông tin sân!</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Khám phá sân ${venue.name} trên ứng dụng ALOBO!`,
        url: venue.bookingLink,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = () => {
    // Simulation of clipboard copy
    Alert.alert('Đã sao chép link', venue.bookingLink);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Thông tin':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Link đặt sân online</Text>
            <View style={styles.linkRow}>
              <Text style={styles.linkText} numberOfLines={1}>
                {venue.bookingLink}
              </Text>
              <TouchableOpacity onPress={handleCopyLink} style={styles.copyBtn}>
                <MaterialCommunityIcons name="content-copy" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyText}>Đang cập nhật nội dung cho tab {activeTab}...</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[]}>
        {/* Cover Image & Overlays */}
        <View style={styles.imageSection}>
          <Image source={{ uri: venue.images?.[0] || venue.image }} style={styles.coverImage} />

          <SafeAreaView style={styles.overlayArea}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.circularBtn}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.BLACK} />
              </TouchableOpacity>

              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleShare} style={styles.circularBtn}>
                  <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.BLACK} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsFavorite(!isFavorite)}
                  style={styles.circularBtn}
                >
                  <MaterialCommunityIcons                     name={isFavorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isFavorite ? COLORS.ERROR : COLORS.BLACK}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={handleBookPress}
                >
                  <Text style={styles.bookNowText}>Đặt lịch</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Rating Badge Overlay */}
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons name="star" size={16} color={COLORS.WHITE} />
            <Text style={styles.ratingText}>{venue.rating || 'Chưa có đánh giá'}</Text>
          </View>
        </View>

        {/* Info Card Section */}
        <View style={styles.infoCard}>
          <View style={styles.venueInfoHeader}>
            <Image source={{ uri: venue.logo }} style={styles.venueLogo} />
            <View style={styles.venueTitle}>
              <Text style={styles.name}>{venue.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{venue.venue_type || venue.category}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.detailText}>{venue.fullAddress || (venue.district ? `${venue.address}, ${venue.district}` : venue.address)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.detailText}>{venue.operating_hours ? `${venue.operating_hours.open} - ${venue.operating_hours.close}` : venue.hours}</Text>
            </View>
            <TouchableOpacity style={styles.detailRow} activeOpacity={0.7}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.GRAY_MEDIUM} />
              <Text style={[styles.detailText, styles.contactText]}>Liên hệ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Inline Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabItem,
                    activeTab === tab && styles.activeTabItem,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab && styles.activeTabLabel,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {renderTabContent()}
          </View>
        </View>
      </ScrollView>

      <BookingModal
        isVisible={isBookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        onSelectOption={handleSelectBookingOption}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    width: '100%',
    height: 300,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  overlayArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circularBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bookNowBtn: {
    backgroundColor: '#E3B129',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bookNowText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
    fontSize: 14,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  ratingText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingTop: 30,
    paddingHorizontal: 20,
    minHeight: 500,
  },
  venueInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  venueLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  venueTitle: {
    marginLeft: 15,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#3498DB',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    color: '#3498DB',
    fontWeight: '600',
  },
  detailsList: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    lineHeight: 20,
  },
  contactText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 10,
  },
  tabsContainer: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabLabel: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: COLORS.PRIMARY,
  },
  tabContentContainer: {
    paddingVertical: 20,
  },
  tabContent: {
    minHeight: 150,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    marginRight: 10,
  },
  copyBtn: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
    textAlign: 'center',
    marginTop: 20,
  },
});
