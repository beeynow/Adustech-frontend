import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import {
  buildAppNotificationFromPushData,
  ensurePushNotificationChannelAsync,
  getExpoNotificationsModule,
  getActionPathFromPushData,
  getNotificationIdFromPushData,
  registerCurrentDeviceForPushAsync,
} from '@/services/pushNotifications';
import { getNotificationPresentation } from '@/utils/notificationPresentation';
import { useAppTheme } from '@/utils/theme';
import { showToast } from '@/utils/toast';

export default function PushNotificationsBridge() {
  const router = useRouter();
  const theme = useAppTheme();
  const { isAuthenticated, user } = useAuth();
  const { markNotificationAsRead, refreshNotifications } = useNotifications();
  const handledResponseKeysRef = useRef(new Set<string>());
  const registrationKeyRef = useRef('');

  const openNotificationFromData = useCallback(async (data: unknown, fallbackKey?: string) => {
    const notificationId = getNotificationIdFromPushData(data);
    const actionPath = getActionPathFromPushData(data);
    const dedupeKey = notificationId || fallbackKey || actionPath || '';

    if (dedupeKey && handledResponseKeysRef.current.has(dedupeKey)) {
      return;
    }

    if (dedupeKey) {
      handledResponseKeysRef.current.add(dedupeKey);
    }

    if (notificationId) {
      try {
        await markNotificationAsRead(notificationId);
      } catch {
        // Keep navigation responsive even if the read mutation fails.
      }
    }

    if (actionPath) {
      router.push(actionPath as never);
    }

    void refreshNotifications();
  }, [markNotificationAsRead, refreshNotifications, router]);

  useEffect(() => {
    void ensurePushNotificationChannelAsync().catch((error) => {
      console.warn('Failed to configure push notification channel', error);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      registrationKeyRef.current = '';
      return;
    }

    const registrationKey = user.email.toLowerCase();
    if (registrationKeyRef.current === registrationKey) {
      return;
    }

    registrationKeyRef.current = registrationKey;
    let cancelled = false;

    const register = async () => {
      try {
        await registerCurrentDeviceForPushAsync();
        if (!cancelled) {
          void refreshNotifications();
        }
      } catch (error) {
        console.warn('Push notification registration failed', error);
      }
    };

    void register();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshNotifications, user?.email]);

  useEffect(() => {
    let cancelled = false;
    let receivedSubscription: { remove: () => void } | null = null;
    let responseSubscription: { remove: () => void } | null = null;

    const attachListeners = async () => {
      const Notifications = getExpoNotificationsModule();
      if (!Notifications || cancelled) {
        return;
      }

      receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const appNotification = buildAppNotificationFromPushData(notification.request.content.data);

        if (appNotification) {
          const presentation = getNotificationPresentation(appNotification, theme);
          showToast.notification({
            title: appNotification.title,
            message: appNotification.message,
            label: presentation.label,
            accent: presentation.accent,
            background: presentation.soft,
            text: theme.text,
            subtext: theme.textMuted,
            icon: presentation.icon,
          });
        }

        void refreshNotifications();
      });

      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        void openNotificationFromData(
          response.notification.request.content.data,
          response.notification.request.identifier
        );
      });

      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (!response || cancelled) {
          return;
        }

        await openNotificationFromData(
          response.notification.request.content.data,
          response.notification.request.identifier
        );
        await Notifications.clearLastNotificationResponseAsync();
      } catch (error) {
        console.warn('Failed to inspect the last push notification response', error);
      }
    };

    void attachListeners();

    return () => {
      cancelled = true;
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, [openNotificationFromData, refreshNotifications, theme]);

  return null;
}
