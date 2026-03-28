import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  ActionButton,
  EmptyState,
  HeroCard,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useNotifications } from '@/context/NotificationsContext';
import type { AppNotification } from '@/services/notificationsApi';
import { useAppTheme } from '@/utils/theme';
import { showToast } from '@/utils/toast';

const formatNotificationTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

const getNotificationEmoji = (notification: AppNotification) => {
  if (notification.entityType === 'post') {
    return '📰';
  }

  if (notification.type === 'success') {
    return '✅';
  }

  if (notification.type === 'warning') {
    return '⚠️';
  }

  if (notification.type === 'error') {
    return '🚨';
  }

  return '🔔';
};

export default function NotificationsScreen() {
  const theme = useAppTheme();
  const {
    notifications,
    unreadCount,
    totalCount,
    markNotificationAsRead,
    markAllAsRead,
  } = useNotifications();

  const getTone = (type: AppNotification['type']) => {
    if (type === 'success') {
      return theme.success;
    }
    if (type === 'warning') {
      return theme.warning;
    }
    if (type === 'error') {
      return theme.danger;
    }
    return theme.accent;
  };

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Notifications"
        title="A cleaner inbox for campus activity"
        subtitle="Unread items stand out more clearly, while routine updates feel calmer and easier to scan."
        icon="notifications-outline"
        actions={unreadCount > 0 ? (
          <View style={{ width: 132 }}>
            <ActionButton
              label="Mark All"
              icon="checkmark-done-outline"
              variant="secondary"
              onPress={() => {
                void markAllAsRead().catch(() => {
                  showToast.error('Unable to mark all notifications as read.');
                });
              }}
            />
          </View>
        ) : undefined}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>{totalCount}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>Total updates</Text>
          </View>
          <View>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>{unreadCount}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>Unread now</Text>
          </View>
        </View>
      </HeroCard>

      <SectionHeading
        title="Recent Activity"
        subtitle={unreadCount > 0 ? `${unreadCount} item${unreadCount === 1 ? '' : 's'} still need your attention.` : 'You are all caught up right now.'}
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          subtitle="You&apos;re all caught up. New campus alerts, messages, and reminders will appear here."
          icon="notifications-off-outline"
        />
      ) : (
        <View style={{ gap: 12 }}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => {
                void markNotificationAsRead(notification.id).catch(() => {
                  showToast.error('Unable to update that notification right now.');
                });
              }}
            >
              <SurfaceCard style={{ borderColor: notification.read ? theme.border : theme.borderStrong }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${getTone(notification.type)}18`,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{getNotificationEmoji(notification)}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <Text style={{ color: theme.text, fontSize: 16, fontWeight: notification.read ? '800' : '900', flex: 1 }}>
                        {notification.title}
                      </Text>
                      {!notification.read ? (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getTone(notification.type) }} />
                      ) : null}
                    </View>
                    <Text style={{ color: theme.textMuted, marginTop: 8, lineHeight: 21 }}>
                      {notification.message}
                    </Text>
                    <Text style={{ color: theme.textSoft, marginTop: 10, fontSize: 12, fontWeight: '700' }}>
                      {formatNotificationTime(notification.timestamp)}
                    </Text>
                  </View>
                </View>
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenShell>
  );
}
