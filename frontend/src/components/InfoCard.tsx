import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

interface InfoCardProps {
  title: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, iconName, children, style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name={iconName} size={20} color="#EAB308" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#053e30', // Darker green than the background
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    color: '#EAB308', // Golden Yellow
    fontSize: 15,
    fontWeight: 'bold',
  },
  content: {
    // Styling for nested content if needed
  },
});
