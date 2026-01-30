import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

export default function Logo() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <View style={[styles.logoCircle, isDark ? styles.logoDark : styles.logoLight]}>
        <Text style={[styles.logoText, isDark ? styles.textDark : styles.textLight]}>
          AT
        </Text>
      </View>
      <Text style={[styles.brandName, isDark ? styles.textDark : styles.textLight]}>
        ADUSTECH
      </Text>
      <Text style={[styles.tagline, isDark ? styles.subtextDark : styles.subtextLight]}>
        Innovation Simplified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoLight: {
    backgroundColor: '#1976D2',
  },
  logoDark: {
    backgroundColor: '#42A5F5',
  },
  logoText: {
    fontSize: 72,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '300',
  },
  subtextLight: {
    color: '#546E7A',
  },
  subtextDark: {
    color: '#90CAF9',
  },
});
