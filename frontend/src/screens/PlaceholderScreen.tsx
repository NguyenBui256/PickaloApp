/**
 * Placeholder screen component for screens not yet implemented.
 * Shows the screen name and a "coming soon" message.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PlaceholderScreenProps {
  name: string;
}

export function PlaceholderScreen({ name }: PlaceholderScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
      <Text style={styles.note}>This screen will be implemented in Sprint 11 (User Features).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});
