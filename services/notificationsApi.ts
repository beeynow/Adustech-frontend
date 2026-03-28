import api, { getErrorMessage } from './api';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: string;
  entityType: string;
  entityId: string;
  actor: {
    id: string;
    name: string;
  } | null;
}

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

const normalizeBoolean = (value: unknown): boolean => value === true;

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeType = (value: unknown): NotificationType => {
  switch (value) {
    case 'success':
    case 'warning':
    case 'error':
      return value;
    default:
      return 'info';
  }
};

const buildFallbackTitle = (notification: any): string => {
  if (normalizeString(notification?.entityType) === 'post') {
    return 'New post published';
  }

  return 'Notification';
};

const buildFallbackMessage = (notification: any): string => {
  const actorName = normalizeString(notification?.actor?.name) || 'Someone';

  if (normalizeString(notification?.entityType) === 'post') {
    return `${actorName} shared a new post.`;
  }

  return `${actorName} sent a new update.`;
};

const normalizeNotification = (notification: any): AppNotification => ({
  id: normalizeString(notification?.id),
  type: normalizeType(notification?.type),
  title: normalizeString(notification?.title) || buildFallbackTitle(notification),
  message: normalizeString(notification?.message) || buildFallbackMessage(notification),
  timestamp: normalizeString(notification?.timestamp || notification?.createdAt),
  read: normalizeBoolean(notification?.read ?? notification?.isRead),
  icon: normalizeString(notification?.icon) || undefined,
  entityType: normalizeString(notification?.entityType),
  entityId: normalizeString(notification?.entityId),
  actor: notification?.actor && typeof notification.actor === 'object' ? {
    id: normalizeString(notification.actor.id),
    name: normalizeString(notification.actor.name),
  } : null,
});

const extractError = (error: unknown, fallbackMessage: string): never => {
  throw new Error(getErrorMessage(error, fallbackMessage));
};

export const notificationsAPI = {
  list: async (limit = 50) => {
    try {
      const response = await api.get('/notifications', {
        params: { limit },
      });

      return {
        success: response.data?.success !== false,
        notifications: Array.isArray(response.data?.notifications)
          ? response.data.notifications.map(normalizeNotification)
          : [],
        unreadCount: normalizeNumber(response.data?.unreadCount),
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      extractError(error, 'Failed to load notifications.');
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.post(`/notifications/${id}/read`);
      return {
        success: response.data?.success !== false,
        unreadCount: normalizeNumber(response.data?.unreadCount),
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      extractError(error, 'Failed to update notification.');
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/read-all');
      return {
        success: response.data?.success !== false,
        unreadCount: normalizeNumber(response.data?.unreadCount),
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      extractError(error, 'Failed to mark notifications as read.');
    }
  },

  clearAll: async () => {
    try {
      const response = await api.delete('/notifications');
      return {
        success: response.data?.success !== false,
        unreadCount: normalizeNumber(response.data?.unreadCount),
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      extractError(error, 'Failed to clear notifications.');
    }
  },
};
