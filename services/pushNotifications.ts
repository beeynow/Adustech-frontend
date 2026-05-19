import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { normalizeNotification, notificationsAPI, type AppNotification } from './notificationsApi';

const PUSH_TOKEN_STORAGE_KEY = 'push_notification_token';
export const PUSH_NOTIFICATION_CHANNEL_ID = 'campus-alerts';
type ExpoNotificationsModule = typeof import('expo-notifications');

type ExpoExtraConfig = {
  eas?: {
    projectId?: string;
  };
};

let hasConfiguredNotificationHandler = false;
let hasWarnedUnsupportedPushRuntime = false;

const isExpoGoAndroid = () => {
  const constantRecord = Constants as typeof Constants & {
    appOwnership?: string;
    executionEnvironment?: string;
  };

  return Platform.OS === 'android' && (
    constantRecord.appOwnership === 'expo'
    || constantRecord.executionEnvironment === 'storeClient'
  );
};

const warnUnsupportedPushRuntime = () => {
  if (hasWarnedUnsupportedPushRuntime) {
    return;
  }

  hasWarnedUnsupportedPushRuntime = true;
  console.warn(
    'Push notifications are disabled in Expo Go on Android. Use a development build to test remote notifications.'
  );
};

const ensureNotificationHandlerConfigured = (Notifications: ExpoNotificationsModule) => {
  if (hasConfiguredNotificationHandler) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  hasConfiguredNotificationHandler = true;
};

export const getExpoNotificationsModule = (): ExpoNotificationsModule | null => {
  if (isExpoGoAndroid()) {
    warnUnsupportedPushRuntime();
    return null;
  }

  try {
    const Notifications = require('expo-notifications') as ExpoNotificationsModule;
    ensureNotificationHandlerConfigured(Notifications);
    return Notifications;
  } catch (error) {
    console.warn('Failed to load expo-notifications runtime', error);
    return null;
  }
};

const getProjectId = () => {
  const extra = Constants.expoConfig?.extra as ExpoExtraConfig | undefined;
  return extra?.eas?.projectId?.trim() || '';
};

const getDeviceName = () => {
  const constantRecord = Constants as typeof Constants & { deviceName?: string };
  return constantRecord.deviceName || Constants.expoConfig?.name || 'Adustech Device';
};

const readPushData = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

export const ensurePushNotificationChannelAsync = async () => {
  const Notifications = getExpoNotificationsModule();

  if (!Notifications) {
    return;
  }

  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(PUSH_NOTIFICATION_CHANNEL_ID, {
    name: 'Campus Alerts',
    description: 'Important school, academic, event, and ticket notifications.',
    importance: Notifications.AndroidImportance.HIGH,
    enableLights: true,
    enableVibrate: true,
    lightColor: '#1976D2',
    showBadge: true,
    vibrationPattern: [0, 250, 120, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

export const registerCurrentDeviceForPushAsync = async () => {
  const Notifications = getExpoNotificationsModule();

  if (!Notifications) {
    return null;
  }

  await ensurePushNotificationChannelAsync();

  const currentPermissions = await Notifications.getPermissionsAsync();
  const alreadyGranted =
    currentPermissions.granted ||
    currentPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  const finalPermissions = alreadyGranted
    ? currentPermissions
    : await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

  const granted =
    finalPermissions.granted ||
    finalPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Missing Expo project ID for push notifications.');
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = pushToken.data;

  await notificationsAPI.registerPushToken({
    token,
    platform: Platform.OS,
    deviceName: getDeviceName(),
  });
  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

  return token;
};

export const unregisterCurrentDeviceForPushAsync = async () => {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (!token) {
    return;
  }

  try {
    await notificationsAPI.unregisterPushToken(token);
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  }
};

export const buildAppNotificationFromPushData = (data: unknown): AppNotification | null => {
  const payload = readPushData(data);
  const notificationId =
    typeof payload.notificationId === 'string' && payload.notificationId.trim()
      ? payload.notificationId.trim()
      : typeof payload.id === 'string' && payload.id.trim()
        ? payload.id.trim()
        : '';

  if (!notificationId && !payload.title && !payload.message) {
    return null;
  }

  return normalizeNotification({
    ...payload,
    id: notificationId || 'push-preview',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    read: false,
    actor: null,
  });
};

export const getActionPathFromPushData = (data: unknown) => {
  const notification = buildAppNotificationFromPushData(data);
  return notification?.actionPath;
};

export const getNotificationIdFromPushData = (data: unknown) => {
  const payload = readPushData(data);
  return typeof payload.notificationId === 'string' ? payload.notificationId : '';
};
