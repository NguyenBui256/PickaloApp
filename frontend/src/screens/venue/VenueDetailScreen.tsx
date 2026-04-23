import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchVenueById } from '../../services/venue-service';
import { fetchVenueReviews, deleteReview } from '../../services/review-service';
import { BookingModal } from '../../components/BookingModal';
import { useAuthStore } from '../../store/auth-store';
import { updateVenueStatus } from '../../services/admin-service';
import { toggleFavorite } from '../../services/favorite-service';
import type { ReviewResponse } from '../../types/api-types';

type RootStackParamList = {
  VenueDetails: { venueId: string };
  BookingDetails: { venueId: string };
};

type VenueDetailsRouteProp = RouteProp<RootStackParamList, 'VenueDetails'>;

const TABS = ['Thông tin', 'Dịch vụ', 'Hình ảnh', 'Điều khoản & quy định', 'Đánh giá'];

export const VenueDetailScreen: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const navigation = useNavigation<any>();
  const route = useRoute<VenueDetailsRouteProp>();
  const { venueId } = route.params;

  const [venue, setVenue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Thông tin');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchVenueById(venueId);
      if (res) {
        setVenue(res);
        // @ts-ignore
        setIsFavorite((res as any).is_favorite || false);
      }
      
      setIsLoadingReviews(true);
      const reviewsRes = await fetchVenueReviews(venueId);
      setReviews(reviewsRes.items);
    } catch (error) {
      console.error('Error fetching venue data:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [venueId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (activeTab === 'Đánh giá' && reviews.length === 0) {
      fetchData();
    }
  }, [activeTab, fetchData, reviews.length]);

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

  const handleAdminDelete = () => {
    Alert.alert(
      'Xác nhận xóa sân',
      'Bạn có chắc chắn muốn xóa sân này khỏi hệ thống? Sân sẽ được đưa vào danh sách tạm xóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa sân',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await updateVenueStatus(venueId, 'DELETED');
              Alert.alert('Thành công', 'Đã xóa sân thành công');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa sân lúc này');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

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

  const handleToggleFavorite = async () => {
    if (!user) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu sân yêu thích');
      return;
    }

    try {
      const res = await toggleFavorite(venueId);
      setIsFavorite(res.is_favorite);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái yêu thích');
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
      case 'Đánh giá':
        return (
          <View style={styles.tabContent}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
              <View style={styles.ratingSummary}>
                <MaterialCommunityIcons name="star" size={20} color={COLORS.YELLOW} />
                <Text style={styles.summaryScore}>{venue.rating || '0.0'}</Text>
                <Text style={styles.summaryCount}>({reviews.length} đánh giá)</Text>
              </View>
            </View>

            {isLoadingReviews ? (
              <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
            ) : reviews.length > 0 ? (
              reviews.map((item) => (
                <View key={item.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.userAvatarPlaceholder}>
                      <Text style={styles.avatarText}>{item.user?.full_name?.charAt(0) || 'U'}</Text>
                    </View>
                    <View style={styles.reviewUserInfo}>
                      <Text style={styles.reviewUserName}>{item.user?.full_name || 'Người dùng'}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <MaterialCommunityIcons
                            key={s}
                            name={s <= item.rating ? 'star' : 'star-outline'}
                            size={14}
                            color={COLORS.YELLOW}
                          />
                        ))}
                        <Text style={styles.reviewDate}>
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>

                    {user?.id === item.user.id && (
                      <View style={styles.reviewActions}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('ReviewSubmission', {
                            venueId,
                            venueName: venue.name,
                            reviewId: item.id
                          })}
                          style={styles.actionBtn}
                        >
                          <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.PRIMARY} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              'Xóa đánh giá',
                              'Bạn có chắc chắn muốn xóa đánh giá này?',
                              [
                                { text: 'Hủy', style: 'cancel' },
                                {
                                  text: 'Xóa',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await deleteReview(item.id);
                                      Alert.alert('Thành công', 'Đã xóa đánh giá');
                                      fetchData(); // Tải lại toàn bộ dữ liệu (bao gồm rating tổng)
                                    } catch (err) {
                                      Alert.alert('Lỗi', 'Không thể xóa đánh giá lúc này');
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                          style={styles.actionBtn}
                        >
                          <MaterialCommunityIcons name="delete-outline" size={18} color={COLORS.ERROR} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <MaterialCommunityIcons name="comment-text-multiple-outline" size={48} color={COLORS.GRAY_LIGHT} />
                <Text style={styles.emptyText}>Chưa có đánh giá nào cho sân này.</Text>
              </View>
            )}
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
                {isAdmin ? (
                  <TouchableOpacity
                    style={[styles.circularBtn, { backgroundColor: '#F44336' }]}
                    onPress={handleAdminDelete}
                    disabled={isDeleting}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORS.WHITE} />
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={handleShare} style={styles.circularBtn}>
                      <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.BLACK} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleToggleFavorite}
                      style={styles.circularBtn}
                    >
                      <MaterialCommunityIcons
                        name={isFavorite ? 'heart' : 'heart-outline'}
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
                  </>
                )}
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
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryScore: {
    fontSize: 18,
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
    paddingVertical: 20,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  reviewUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: COLORS.GRAY_MEDIUM,
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    paddingLeft: 52,
    marginTop: 4,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
