import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS,
  withTiming 
} from 'react-native-reanimated';
import { fetchVenueById } from '../../services/venue-service';
import { fetchVenueReviews } from '../../services/review-service';
import { BookingModal } from '../../components/BookingModal';
import { getImageUrl } from '../../utils/image-upload-helper';
import type { ReviewResponse } from '../../types/api-types';
import COLORS from '@theme/colors';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = 180;

type RootStackParamList = {
  MapVenueDetailOverlay: { venueId: string; hideMap?: boolean };
  BookingDetails: { venueId: string };
};

type RouteProps = RouteProp<RootStackParamList, 'MapVenueDetailOverlay'>;

const TABS = ['Thông tin', 'Dịch vụ', 'Hình ảnh', 'Điều khoản & quy định', 'Đánh giá'];

export const MapVenueDetailOverlayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const { venueId, hideMap } = route.params;

  const [venue, setVenue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Thông tin');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<'normal' | 'event' | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    fetchVenueById(venueId).then(res => {
      if (res) {
        setVenue(res);
        // @ts-ignore - isFavorite là field mở rộng của FE mock
        setIsFavorite((res as any).isFavorite || false);
      }
    });
  }, [venueId]);

  useEffect(() => {
    if (activeTab === 'Đánh giá' && reviews.length === 0) {
      setIsLoadingReviews(true);
      fetchVenueReviews(venueId).then(res => {
        setReviews(res.items);
        setIsLoadingReviews(false);
      });
    }
  }, [activeTab, venueId]);

  // Gesture handling
  const translateY = useSharedValue(0);
  const contextY = useSharedValue(0);

  const closeScreen = () => {
    navigation.goBack();
  };
  
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = contextY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Dismiss screen
        translateY.value = withTiming(height, { duration: 300 }, (isFinished) => {
          if (isFinished) {
            runOnJS(closeScreen)();
          }
        });
      } else {
        // Snap back
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const openMap = () => {
    const query = encodeURIComponent(`${venue?.name}, ${venue?.address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(err => console.error("Error opening maps", err));
  };

  const handleBookPress = () => {
    setBookingModalVisible(true);
  };

  const handleSelectBookingOption = (type: 'normal' | 'event') => {
    setBookingModalVisible(false);
    // Replace the transparent modal overlay with the booking details screen
    // This prevents React Navigation issues where pushing on top of a transparent modal fails
    navigation.replace('BookingDetails', { venueId: venue?.id, type });
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
    if (activeTab === 'Hình ảnh') {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Thư viện hình ảnh</Text>
            <View style={styles.imagesGrid}>
              {venue.images && Array.isArray(venue.images) && venue.images.length > 0 ? (
                venue.images.map((img: string, index: number) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image 
                      source={{ uri: getImageUrl(img) }} 
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="image-off-outline" size={48} color={COLORS.GRAY_LIGHT} />
                  <Text style={styles.emptyText}>Sân này chưa cập nhật hình ảnh.</Text>
                </View>
              )}
            </View>
        </View>
      );
    }
    if (activeTab === 'Đánh giá') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
            <View style={styles.ratingSummary}>
              <MaterialCommunityIcons name="star" size={18} color={COLORS.YELLOW} />
              <Text style={styles.summaryScore}>{venue.rating || '0.0'}</Text>
              <Text style={styles.summaryCount}>({reviews.length})</Text>
            </View>
          </View>

          {isLoadingReviews ? (
            <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
          ) : reviews.length > 0 ? (
            reviews.map((item) => (
              <View key={item.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.userAvatarPlaceholder}>
                    <Text style={styles.avatarText}>{(item.user?.full_name || 'U').charAt(0)}</Text>
                  </View>
                  <View style={styles.reviewUserInfo}>
                    <Text style={styles.reviewUserName}>{item.user?.full_name || 'Người dùng'}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialCommunityIcons
                          key={s}
                          name={s <= item.rating ? 'star' : 'star-outline'}
                          size={12}
                          color={COLORS.YELLOW}
                        />
                      ))}
                      <Text style={styles.reviewDate}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{item.comment}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyReviews}>
              <MaterialCommunityIcons name="comment-text-multiple-outline" size={40} color={COLORS.GRAY_LIGHT} />
              <Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>
            </View>
          )}
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Backdrop to close when tapping outside */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={closeScreen} 
      />

      {/* 3. Main Detail Overlay Panel */}
      <Animated.View style={[styles.gestureContainer, animatedStyle]}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={styles.contentScrollView}
            contentContainerStyle={styles.scrollContainer}
          >
            <View style={styles.paddingForMap} />
            
            <GestureDetector gesture={panGesture}>
              <View>
                {/* Draggable Handle Indicator */}
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>

                {/* Venue Cover Image */}
                <View style={[styles.coverSection, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
            <Image 
              source={{ uri: getImageUrl(venue.cover_image || venue.images?.[0] || venue.image) }} 
              style={styles.coverImage} 
            />

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
                <Text style={styles.ratingText}>{venue.rating || '5.0'}</Text>
              </View>
            </View>

          <View style={[styles.overlayPanel, { minHeight: Dimensions.get('window').height - 180 - 200 }]}>
          {/* Venue Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Image source={{ uri: getImageUrl(venue.logo) }} style={styles.logo} />
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
                <Text style={styles.detailText}>
                  {venue.operating_hours 
                    ? `${venue.operating_hours.open} - ${venue.operating_hours.close}` 
                    : (venue.hours || '06:00 - 22:00')}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.detailRow} 
                onPress={() => {
                  navigation.goBack();
                  navigation.navigate('Main', {
                    screen: 'Map',
                    params: {
                      destination: { latitude: venue.location.lat, longitude: venue.location.lng },
                      showRoute: true,
                      targetVenueId: venue.id
                    }
                  });
                }}
              >
                <MaterialCommunityIcons name="directions" size={20} color={COLORS.PRIMARY} />
                <Text style={[styles.detailText, styles.phoneText]}>Chỉ đường</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailRow} activeOpacity={0.7}>
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
      </Animated.View>

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
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gestureContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85,
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  contentScrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  handleContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  overlayPanel: {
    backgroundColor: COLORS.WHITE,
  },
  coverSection: {
    height: 220,
    width: '100%',
    position: 'relative',
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
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookNowBtn: {
    backgroundColor: COLORS.YELLOW,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookNowText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoCard: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  summaryCount: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.GRAY_MEDIUM,
    paddingVertical: 15,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  reviewUserInfo: {
    marginLeft: 10,
    flex: 1,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 10,
    color: COLORS.GRAY_MEDIUM,
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
    paddingLeft: 42,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  imageWrapper: {
    width: (Dimensions.get('window').width - 50) / 2,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
