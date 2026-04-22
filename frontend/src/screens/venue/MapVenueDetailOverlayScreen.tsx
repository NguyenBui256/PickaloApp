import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { VENUES } from '../../constants/mock-data';
import { BookingModal } from '../../components/BookingModal';
import COLORS from '@theme/colors';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = 180;

type RootStackParamList = {
  MapVenueDetailOverlay: { venueId: string };
  BookingDetails: { venueId: string };
};

type RouteProps = RouteProp<RootStackParamList, 'MapVenueDetailOverlay'>;

const TABS = ['Thông tin', 'Dịch vụ', 'Hình ảnh', 'Điều khoản & quy định', 'Đánh giá'];

export const MapVenueDetailOverlayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const { venueId } = route.params;

  const venue = VENUES.find((v) => v.id === venueId);
  const [activeTab, setActiveTab] = useState('Thông tin');
  const [isFavorite, setIsFavorite] = useState(venue?.isFavorite || false);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);

  const handleBookPress = () => {
    setBookingModalVisible(true);
  };

  const handleSelectBookingOption = (type: 'normal' | 'event') => {
    setBookingModalVisible(false);
    navigation.navigate('BookingDetails', { venueId: venue?.id, type });
  };

  if (!venue) return null;

  const handleShare = () => {
    Share.share({
      message: `Khám phá sân ${venue.name} trên ứng dụng ALOBO!`,
      url: venue.bookingLink,
    });
  };

  const handleCopyLink = () => {
    Alert.alert('Đã sao chép link', venue.bookingLink);
  };

  const renderTabContent = () => {
    if (activeTab === 'Thông tin') {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Link đặt sân online</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1}>{venue.bookingLink}</Text>
            <TouchableOpacity onPress={handleCopyLink}>
              <MaterialCommunityIcons name="content-copy" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>Đang cập nhật nội dung cho tab {activeTab}...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Map Background Header */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: venue.lat,
            longitude: venue.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{ latitude: venue.lat, longitude: venue.lng }}
            pinColor={COLORS.PRIMARY}
          />
        </MapView>
      </View>

      {/* 2. Floating Navbar above Map */}
      <SafeAreaView style={styles.navbarOverlay}>
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{venue.name}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Category Chips below Navbar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {['Pickleball', 'Cầu lông', 'Bóng đá'].map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.chip, venue.category === name && styles.activeChip]}
            >
              <Text style={[styles.chipText, venue.category === name && styles.activeChipText]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* 3. Main Detail Overlay Panel */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.contentScrollView}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.paddingForMap} />

        <View style={styles.overlayPanel}>
          {/* Venue Cover Image */}
          <View style={styles.coverSection}>
            <Image source={{ uri: venue.image }} style={styles.coverImage} />

            <View style={styles.coverActions}>
              <TouchableOpacity onPress={handleShare} style={styles.circularBtn}>
                <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.BLACK} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.circularBtn}>
                <MaterialCommunityIcons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? COLORS.ERROR : COLORS.BLACK} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={handleBookPress}
              >
                <Text style={styles.bookNowText}>Đặt lịch</Text>
              </TouchableOpacity>
            </View>

            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={16} color={COLORS.WHITE} />
              <Text style={styles.ratingText}>{venue.rating}</Text>
            </View>
          </View>

          {/* Venue Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Image source={{ uri: venue.logo }} style={styles.logo} />
              <View style={styles.titleArea}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <View style={[styles.catBadge, { borderColor: venue.category === 'Pickleball' ? '#3498DB' : COLORS.PRIMARY }]}>
                  <Text style={[styles.catText, { color: venue.category === 'Pickleball' ? '#3498DB' : COLORS.PRIMARY }]}>
                    {venue.category}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.GRAY_MEDIUM} />
                <Text style={styles.detailText}>{venue.fullAddress}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.GRAY_MEDIUM} />
                <Text style={styles.detailText}>{venue.hours}</Text>
              </View>
              <TouchableOpacity style={styles.detailRow}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.GRAY_MEDIUM} />
                <Text style={[styles.detailText, styles.phoneText]}>Liên hệ</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Internal Tabs */}
            <View style={styles.tabsArea}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                  >
                    <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContentContainer}>
              {renderTabContent()}
            </View>
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
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    height: MAP_HEIGHT + 100, // Show map behind navbar
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  navbarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navBtn: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: 10,
  },
  chipsScroll: {
    marginTop: 12,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  activeChip: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.WHITE,
  },
  contentScrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  paddingForMap: {
    height: MAP_HEIGHT,
  },
  overlayPanel: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: height - MAP_HEIGHT,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  coverSection: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circularBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  bookNowBtn: {
    backgroundColor: '#E3B129',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  bookNowText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
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
    elevation: 5,
  },
  ratingText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoCard: {
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  titleArea: {
    marginLeft: 15,
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  catBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catText: {
    fontSize: 11,
    fontWeight: 'bold',
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
  phoneText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 10,
  },
  tabsArea: {
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
    fontSize: 13,
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
    minHeight: 120,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
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
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    marginRight: 10,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
    textAlign: 'center',
    marginTop: 10,
  },
});
