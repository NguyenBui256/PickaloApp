import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

interface BookingSummaryBarProps {
  totalHours: string;
  totalPrice: string;
  onNext: () => void;
  isVisible: boolean;
}

export const BookingSummaryBar: React.FC<BookingSummaryBarProps> = ({
  totalHours,
  totalPrice,
  onNext,
  isVisible,
}) => {
  const slideAnim = useRef(new Animated.Value(150)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : 150,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isVisible, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.topIcon}>
          <Icon name="chevron-up" size={24} color={COLORS.WHITE} />
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.leftInfo}>
            <Text style={styles.summaryLabel}>Tổng giờ: <Text style={styles.boldText}>{totalHours}</Text></Text>
            <Text style={styles.summaryLabel}>Tổng tiền: <Text style={styles.priceText}>{totalPrice} đ</Text></Text>
          </View>
          
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextBtnText}>TIẾP THEO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F6B3A', // Dark Green
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30, // SafeArea space roughly
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topIcon: {
    alignSelf: 'center',
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flex: 1,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 2,
  },
  boldText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  priceText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: '#EAB308', // Gold/Yellow
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 15,
  },
  nextBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
