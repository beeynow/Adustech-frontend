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

type NotificationToastProps = {
  accent?: string;
  background?: string;
  text?: string;
  subtext?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
};

const buildToast = (palette: ToastPalette) => {
  function ToastCard({ text1, text2 }: ToastConfigParams<Record<string, unknown>>) {
    return (
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
  }

  ToastCard.displayName = `Toast${palette.icon}`;
  return ToastCard;
};

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
  notification({ text1, text2, props }: ToastConfigParams<NotificationToastProps>) {
    const accent = props?.accent || '#1976D2';
    const background = props?.background || '#F3F9FF';
    const text = props?.text || '#123A63';
    const subtext = props?.subtext || '#486888';
    const icon = props?.icon || 'notifications-outline';
    const label = props?.label || 'Notification';

    return (
      <View style={[styles.notificationShell, { backgroundColor: background, borderColor: accent }]}>
        <View style={styles.notificationTopRow}>
          <View style={[styles.notificationPill, { backgroundColor: accent }]}>
            <Text style={styles.notificationPillText}>{label}</Text>
          </View>
        </View>
        <View style={styles.notificationBody}>
          <View style={[styles.notificationIconWrap, { backgroundColor: accent }]}>
            <Ionicons name={icon} size={18} color="#FFFFFF" />
          </View>
          <View style={styles.content}>
            {text1 ? <Text style={[styles.title, { color: text }]} numberOfLines={1}>{text1}</Text> : null}
            {text2 ? <Text style={[styles.message, { color: subtext }]} numberOfLines={3}>{text2}</Text> : null}
          </View>
        </View>
      </View>
    );
  },
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
  notificationShell: {
    width: '92%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 9,
  },
  notificationTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  notificationPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  notificationPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  notificationBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
