import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { BookingOptionCard } from './BookingOptionCard';

interface BookingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectOption: (type: 'normal' | 'event') => void;
  onModalHide?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isVisible,
  onClose,
  onSelectOption,
  onModalHide,
}) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      style={styles.modal}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriver
      propagateSwipe
      onModalHide={onModalHide}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>Chọn hình thức đặt</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.GRAY_MEDIUM} />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <BookingOptionCard
            title="Đặt lịch ngày trực quan"
            subtext="Đặt lịch ngày khi khách chơi nhiều khung giờ, nhiều sân."
            bgColor="#f0fdf4"
            textColor="#15803d"
            onPress={() => onSelectOption('normal')}
          />

          <BookingOptionCard
            title="Đặt lịch sự kiện"
            subtext="Sự kiện giúp bạn chơi chung với người có cùng niềm đam mê..."
            bgColor="#faf5ff"
            textColor="#7e22ce"
            hasBadge
            onPress={() => onSelectOption('event')}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  optionsContainer: {
    padding: 20,
  },
});
