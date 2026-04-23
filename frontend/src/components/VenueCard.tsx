import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

const { width } = Dimensions.get('window');

interface VenueCardProps {
  id?: string;
  name?: string | null;
  address?: string | null;
  distance?: string;           // FE-only: tự tính từ location + user GPS. BE không trả.
  images?: string[] | null;            // BE: VenueListItem.images
  image?: string | null;               // FE-only fallback: derive từ images[0]
  logo?: string | null;                // BE: VenueListItem.logo (nullable)
  hours?: string | null;               // FE-only: derive từ operating_hours
  operating_hours?: { open: string; close: string } | null; // BE: OperatingHours
  badges?: string[] | null;            // FE-only: không có trong BE
  amenities?: string[] | null;         // BE: VenueListItem.amenities
  category?: string | null;            // BE: VenueListItem.category
  rating?: number | null;              // BE: VenueListItem.rating
  review_count?: number | null;        // BE: VenueListItem.review_count
  fullAddress?: string | null;         // BE: VenueListItem.fullAddress
  district?: string | null;            // BE: VenueListItem.district
  is_verified?: boolean;               // BE: is_verified column
  is_favorite?: boolean;         // BE: is_favorite column
  onPress: () => void;
  onFavoriteToggle: () => void;
  onBook: () => void;
}

export const VenueCard: React.FC<VenueCardProps> = ({
  id,
  name,
  address,
  distance = '',
  images,
  image,
  logo,
  hours,
  operating_hours,
  badges = [],
  is_favorite = false,
  onPress,
  onFavoriteToggle,
  onBook,
}) => {
  // Derive display values từ BE fields
  const displayImage = images?.[0] || image || '';
  const displayHours = operating_hours ? `${operating_hours.open} - ${operating_hours.close}` : (hours || '');
  const displayLogo = logo || 'https://via.placeholder.com/100';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Top Section with Image and Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: displayImage }} style={styles.image} />

        {/* <View style={styles.badgeContainer}>
          {badges.map((badge, index) => (
            <View
              key={index}
              style={[
                styles.badge,
                { backgroundColor: badge === 'Đơn ngày' ? COLORS.PRIMARY : COLORS.PURPLE }
              ]}
            >
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View> */}

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.actionCircle} onPress={onFavoriteToggle}>
            <MaterialCommunityIcons name={is_favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={is_favorite ? COLORS.ERROR : COLORS.GRAY_MEDIUM}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCircle}>
            <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.GRAY_MEDIUM} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Content */}
      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Image source={{ uri: displayLogo }} style={styles.logo} />
          <View style={styles.details}>
            <Text style={styles.name} numberOfLines={1}>{name || 'Tên sân'}</Text>
            <Text style={styles.distance}>{distance}</Text>
            <Text style={styles.address} numberOfLines={1}>{address || 'Chưa có địa chỉ'}</Text>
            <View style={styles.hoursRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.hoursText}>{displayHours}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={onBook} activeOpacity={0.8}>
          <Text style={styles.bookText}>ĐẶT LỊCH</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: 'bold',
  },
  topActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  distance: {
    fontSize: 12,
    color: COLORS.SECONDARY,
    fontWeight: '600',
    marginVertical: 2,
  },
  address: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    color: COLORS.GRAY_MEDIUM,
  },
  bookButton: {
    backgroundColor: COLORS.YELLOW,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  bookText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
