import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';

type ToastPalette = {
  accent: string;
  background: string;
  text: string;
  subtext: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const buildToast = (palette: ToastPalette) => (
  { text1, text2 }: ToastConfigParams<any>,
) => (
  <View style={[styles.shell, { backgroundColor: palette.background, borderColor: palette.accent }]}>
    <View style={[styles.iconWrap, { backgroundColor: palette.accent }]}>
      <Ionicons name={palette.icon} size={18} color="#FFFFFF" />
    </View>
    <View style={styles.content}>
      {text1 ? <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>{text1}</Text> : null}
      {text2 ? <Text style={[styles.message, { color: palette.subtext }]} numberOfLines={3}>{text2}</Text> : null}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  success: buildToast({
    accent: '#0F9D58',
    background: '#F1FFF7',
    text: '#0C3B23',
    subtext: '#355C45',
    icon: 'checkmark',
  }),
  error: buildToast({
    accent: '#D93025',
    background: '#FFF5F4',
    text: '#5A1712',
    subtext: '#7A403A',
    icon: 'close',
  }),
  info: buildToast({
    accent: '#1976D2',
    background: '#F3F9FF',
    text: '#123A63',
    subtext: '#486888',
    icon: 'information',
  }),
  warning: buildToast({
    accent: '#F59E0B',
    background: '#FFF9ED',
    text: '#6B4B05',
    subtext: '#8B6B31',
    icon: 'warning',
  }),
};

export function AppToast() {
  return <Toast config={toastConfig} />;
}

const styles = StyleSheet.create({
  shell: {
    width: '92%',
    minHeight: 72,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
