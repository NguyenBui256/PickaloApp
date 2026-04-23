import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

interface BookingOptionCardProps {
  title: string;
  subtext: string;
  bgColor: string;
  textColor: string;
  hasBadge?: boolean;
  onPress: () => void;
}

export const BookingOptionCard: React.FC<BookingOptionCardProps> = ({
  title,
  subtext,
  bgColor,
  textColor,
  hasBadge = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        <Text style={[styles.subtext, { color: textColor }]}>{subtext}</Text>
      </View>

      {/* "New" Badge - Starburst style */}
      {hasBadge && (
        <View style={styles.badgeContainer}>
          <View style={styles.starburst}>
            <View style={[styles.starPart, { transform: [{ rotate: '0deg' }] }]} />
            <View style={[styles.starPart, { transform: [{ rotate: '45deg' }] }]} />
          </View>
          <Text style={styles.badgeText}>New</Text>
        </View>
      )}

      {/* Bottom right arrow button */}
      <View style={[styles.arrowBtn, { backgroundColor: textColor }]}>
        <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.WHITE} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    minHeight: 120,
    position: 'relative',
    marginBottom: 16,
  },
  content: {
    paddingRight: 40, // Space for the potentially large badge or arrow logic area
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  arrowBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starburst: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starPart: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: '900',
    zIndex: 1,
    textTransform: 'uppercase',
  },
});
