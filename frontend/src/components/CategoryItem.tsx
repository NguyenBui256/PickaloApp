import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

interface CategoryItemProps {
  name: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  isActive?: boolean;
  onPress: () => void;
}

export const CategoryItem: React.FC<CategoryItemProps> = ({
  name,
  iconName,
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
        <MaterialCommunityIcons name={iconName} size={30} color={isActive ? COLORS.WHITE : COLORS.PRIMARY} />
      </View>
      <Text style={[styles.label, isActive && styles.activeLabel]}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeIconContainer: {
    backgroundColor: COLORS.PRIMARY,
  },
  label: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
});
