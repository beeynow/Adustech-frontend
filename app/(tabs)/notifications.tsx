import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ActionButton,
  Chip,
  EmptyState,
  HeroCard,
  ScreenShell,
  SectionHeading,
  SegmentedControl,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useNotifications } from '@/context/NotificationsContext';
import type { AppNotification, NotificationClassification } from '@/services/notificationsApi';
import {
  formatNotificationTime,
  getNotificationPresentation,
  getNotificationScopeLabel,
} from '@/utils/notificationPresentation';
import { useAppTheme } from '@/utils/theme';
import { showToast } from '@/utils/toast';
import Ionicons from '@expo/vector-icons/Ionicons';

type InboxFilter = 'all' | 'unread' | 'announcement' | 'activity' | 'system';

const CLASSIFICATION_ORDER: NotificationClassification[] = [
  'school-announcement',
  'faculty-announcement',
  'department-announcement',
  'level-announcement',
  'exam-alert',
  'timetable-alert',
  'event-alert',
  'ticket-alert',
  'discussion-comment',
  'discussion-reply',
  'engagement-like',
  'engagement-comment-like',
  'system-alert',
];

const getClassificationChipLabel = (classification: NotificationClassification) => {
  switch (classification) {
    case 'school-announcement':
      return 'School';
    case 'faculty-announcement':
      return 'Faculty';
    case 'department-announcement':
      return 'Department';
    case 'level-announcement':
      return 'Level';
    case 'exam-alert':
      return 'Exams';
    case 'timetable-alert':
      return 'Timetables';
    case 'event-alert':
      return 'Events';
    case 'ticket-alert':
      return 'Tickets';
    case 'discussion-comment':
      return 'Comments';
    case 'discussion-reply':
      return 'Replies';
    case 'engagement-like':
      return 'Likes';
    case 'engagement-comment-like':
      return 'Comment Likes';
    default:
      return 'System';
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const {
    notifications,
    unreadCount,
    totalCount,
    markNotificationAsRead,
    markAllAsRead,
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');
  const [activeClassification, setActiveClassification] = useState<'all' | NotificationClassification>('all');

  const counts = useMemo(() => ({
    announcements: notifications.filter((notification) => notification.category === 'announcement').length,
    activity: notifications.filter((notification) => (
      notification.category === 'comment' || notification.category === 'engagement'
    )).length,
    system: notifications.filter((notification) => notification.category === 'system').length,
    exams: notifications.filter((notification) => notification.classification === 'exam-alert').length,
    events: notifications.filter((notification) => notification.classification === 'event-alert').length,
    tickets: notifications.filter((notification) => notification.classification === 'ticket-alert').length,
  }), [notifications]);

  const classificationCounts = useMemo(() => {
    const initialCounts = {} as Record<NotificationClassification, number>;

    CLASSIFICATION_ORDER.forEach((classification) => {
      initialCounts[classification] = 0;
    });

    notifications.forEach((notification) => {
      initialCounts[notification.classification] = (initialCounts[notification.classification] || 0) + 1;
    });

    return initialCounts;
  }, [notifications]);

  const visibleClassificationFilters = useMemo(() => (
    CLASSIFICATION_ORDER.filter((classification) => classificationCounts[classification] > 0)
  ), [classificationCounts]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (activeFilter === 'unread') {
      filtered = filtered.filter((notification) => !notification.read);
    }

    if (activeFilter === 'announcement') {
      filtered = filtered.filter((notification) => notification.category === 'announcement');
    }

    if (activeFilter === 'activity') {
      filtered = filtered.filter((notification) => (
        notification.category === 'comment' || notification.category === 'engagement'
      ));
    }

    if (activeFilter === 'system') {
      filtered = filtered.filter((notification) => notification.category === 'system');
    }

    if (activeClassification !== 'all') {
      filtered = filtered.filter((notification) => notification.classification === activeClassification);
    }

    return filtered;
  }, [activeClassification, activeFilter, notifications]);

  const handleOpenNotification = async (notification: AppNotification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
      }

      if (notification.actionPath) {
        router.push(notification.actionPath as never);
      }
    } catch {
      showToast.error('Unable to open that notification right now.');
    }
  };

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Notifications"
        title="A smarter campus inbox"
        subtitle="Academic updates, discussion activity, and system alerts are separated more clearly so you can act faster."
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={`${totalCount} total`} icon="mail-outline" tone="accent" />
          <Chip label={`${unreadCount} unread`} icon="ellipse-outline" tone={unreadCount > 0 ? 'warning' : 'success'} />
          <Chip label={`${counts.announcements} academic`} icon="school-outline" tone="accent" />
          <Chip label={`${counts.activity} activity`} icon="chatbubble-ellipses-outline" tone="success" />
          <Chip label={`${counts.exams} exams`} icon="alert-circle-outline" tone="warning" />
          <Chip label={`${counts.events} events`} icon="ticket-outline" tone="success" />
          <Chip label={`${counts.tickets} tickets`} icon="qr-code-outline" tone="success" />
        </View>
      </HeroCard>

      <SegmentedControl
        value={activeFilter}
        onChange={setActiveFilter}
        items={[
          { label: 'All', value: 'all' },
          { label: 'Unread', value: 'unread' },
          { label: 'Academic', value: 'announcement' },
          { label: 'Activity', value: 'activity' },
          { label: 'System', value: 'system' },
        ]}
      />

      {visibleClassificationFilters.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
        >
          <Pressable onPress={() => setActiveClassification('all')}>
            <Chip
              label="All Types"
              icon="apps-outline"
              tone="neutral"
              active={activeClassification === 'all'}
            />
          </Pressable>
          {visibleClassificationFilters.map((classification) => (
            <Pressable key={classification} onPress={() => setActiveClassification(classification)}>
              <Chip
                label={`${getClassificationChipLabel(classification)} ${classificationCounts[classification]}`}
                tone={
                  classification === 'exam-alert' || classification === 'timetable-alert'
                    ? 'warning'
                    : classification === 'event-alert' || classification === 'ticket-alert'
                      ? 'success'
                      : classification === 'system-alert'
                        ? 'danger'
                        : 'accent'
                }
                active={activeClassification === classification}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <SectionHeading
        title="Recent Activity"
        subtitle={
          filteredNotifications.length > 0
            ? `${filteredNotifications.length} item${filteredNotifications.length === 1 ? '' : 's'} in this view.`
            : 'No notifications match this view right now.'
        }
      />

      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications here"
          subtitle="You&apos;re caught up for this category. New campus alerts and activity will appear here as they happen."
          icon="notifications-off-outline"
        />
      ) : (
        <View style={{ gap: 12 }}>
          {filteredNotifications.map((notification) => {
            const presentation = getNotificationPresentation(notification, theme);

            return (
              <Pressable
                key={notification.id}
                onPress={() => {
                  void handleOpenNotification(notification);
                }}
              >
                <SurfaceCard style={{ borderColor: notification.read ? theme.border : theme.borderStrong }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: presentation.soft,
                      }}
                    >
                      <Ionicons name={presentation.icon} size={22} color={presentation.accent} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: notification.read ? '800' : '900', flex: 1 }}>
                          {notification.title}
                        </Text>
                        {!notification.read ? (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: presentation.accent }} />
                        ) : null}
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        <Chip label={presentation.label} tone={notification.type === 'warning' ? 'warning' : notification.type === 'error' ? 'danger' : notification.category === 'engagement' ? 'success' : 'accent'} />
                        <Chip
                          label={getNotificationScopeLabel(notification)}
                          tone={
                            notification.scope === 'personal'
                              ? 'neutral'
                              : notification.scope === 'faculty' || notification.scope === 'department'
                                ? 'accent'
                                : notification.scope === 'level'
                                  ? 'success'
                                  : notification.scope === 'global'
                                    ? 'accent'
                                    : 'danger'
                          }
                        />
                        {notification.actionPath ? <Chip label="Tap to open" icon="arrow-forward-outline" tone="neutral" /> : null}
                      </View>

                      <Text style={{ color: theme.textMuted, marginTop: 10, lineHeight: 21 }}>
                        {notification.message}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700' }}>
                          {formatNotificationTime(notification.timestamp)}
                        </Text>
                        {notification.actor?.name ? (
                          <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700' }}>
                            by {notification.actor.name}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </SurfaceCard>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenShell>
  );
}
