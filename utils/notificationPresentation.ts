import Ionicons from '@expo/vector-icons/Ionicons';
import type { AppNotification } from '@/services/notificationsApi';
import type { AppTheme } from '@/utils/theme';

export type NotificationPresentation = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent: string;
  soft: string;
};

export const formatNotificationTime = (value: string) => {
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

const coerceIonicon = (value?: string): keyof typeof Ionicons.glyphMap | undefined => {
  if (!value) {
    return undefined;
  }

  return value as keyof typeof Ionicons.glyphMap;
};

export const getNotificationScopeLabel = (notification: AppNotification) => {
  switch (notification.scope) {
    case 'faculty':
      return 'Faculty';
    case 'department':
      return 'Department';
    case 'level':
      return 'Level';
    case 'personal':
      return 'Direct';
    case 'global':
      return 'School';
    default:
      return 'System';
  }
};

const buildPresentationFromClassification = (
  notification: AppNotification,
  theme: AppTheme
): NotificationPresentation => {
  switch (notification.classification) {
    case 'school-announcement':
      return {
        icon: 'megaphone-outline',
        label: 'School Announcement',
        accent: theme.accent,
        soft: theme.accentSoft,
      };
    case 'faculty-announcement':
      return {
        icon: 'business-outline',
        label: 'Faculty Announcement',
        accent: theme.accentAlt,
        soft: theme.successSoft,
      };
    case 'department-announcement':
      return {
        icon: 'library-outline',
        label: 'Department Announcement',
        accent: theme.accentAlt,
        soft: theme.accentSoft,
      };
    case 'level-announcement':
      return {
        icon: 'school-outline',
        label: 'Level Announcement',
        accent: theme.accent,
        soft: theme.accentSoft,
      };
    case 'exam-alert':
      return {
        icon: 'alert-circle-outline',
        label: 'Exam Alert',
        accent: theme.warning,
        soft: theme.warningSoft,
      };
    case 'timetable-alert':
      return {
        icon: 'calendar-outline',
        label: 'Timetable Alert',
        accent: theme.warning,
        soft: theme.warningSoft,
      };
    case 'event-alert':
      return {
        icon: 'ticket-outline',
        label: 'Event Alert',
        accent: theme.success,
        soft: theme.successSoft,
      };
    case 'ticket-alert':
      return {
        icon: 'qr-code-outline',
        label: 'Ticket Update',
        accent: theme.success,
        soft: theme.successSoft,
      };
    case 'discussion-comment':
      return {
        icon: 'chatbubble-ellipses-outline',
        label: 'Comment',
        accent: theme.accentAlt,
        soft: theme.successSoft,
      };
    case 'discussion-reply':
      return {
        icon: 'return-up-forward-outline',
        label: 'Reply',
        accent: theme.accentAlt,
        soft: theme.successSoft,
      };
    case 'engagement-like':
      return {
        icon: 'heart-outline',
        label: 'Like',
        accent: theme.success,
        soft: theme.successSoft,
      };
    case 'engagement-comment-like':
      return {
        icon: 'thumbs-up-outline',
        label: 'Comment Like',
        accent: theme.success,
        soft: theme.successSoft,
      };
    default:
      return {
        icon: notification.type === 'error'
          ? 'alert-circle-outline'
          : notification.type === 'warning'
            ? 'warning-outline'
            : 'notifications-outline',
        label: 'System Alert',
        accent: notification.type === 'error'
          ? theme.danger
          : notification.type === 'warning'
            ? theme.warning
            : theme.accent,
        soft: notification.type === 'error'
          ? theme.dangerSoft
          : notification.type === 'warning'
            ? theme.warningSoft
            : theme.accentSoft,
      };
  }
};

export const getNotificationPresentation = (
  notification: AppNotification,
  theme: AppTheme
): NotificationPresentation => {
  const presentation = buildPresentationFromClassification(notification, theme);
  const customIcon = coerceIonicon(notification.icon);
  return customIcon
    ? {
        ...presentation,
        icon: customIcon,
      }
    : presentation;
};
