import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import COLORS from '@theme/colors';

interface BookingCellProps {
  status: string; // 'available', 'booked', 'locked', 'event', 'selected'
  isSelected: boolean;
  onPress: () => void;
  isMaintenanceMode?: boolean;
}

export const BookingCell: React.FC<BookingCellProps> = React.memo(({ status, isSelected, onPress, isMaintenanceMode }) => {
  const getBackgroundColor = () => {
    if (isSelected) return '#dcfce7'; // Light Green
    const s = status?.toLowerCase();
    switch (s) {
      case 'booked': return '#ff5252'; // Red
      case 'locked': return '#9e9e9e'; // Gray (Quá giờ)
      case 'maintenance': return '#FF9800'; // Orange (Bảo trì)
      case 'event': return '#e040fb'; // Purple
      default: return COLORS.WHITE; // Available
    }
  };

  const isClickable = isMaintenanceMode ? true : (status?.toLowerCase() === 'available');

  return (
    <TouchableOpacity
      disabled={!isClickable}
      onPress={onPress}
      style={[
        styles.cell,
        { backgroundColor: getBackgroundColor() },
        isSelected && styles.selectedCell,
      ]}
      activeOpacity={0.7}
    />
  );
});

const styles = StyleSheet.create({
  cell: {
    width: 60,
    height: 40,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  selectedCell: {
    borderWidth: 1.5,
    borderColor: COLORS.BLACK,
  },
});
