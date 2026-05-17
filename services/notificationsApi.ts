import api, { getErrorMessage } from './api';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'announcement' | 'engagement' | 'comment' | 'system';
export type NotificationClassification =
  | 'school-announcement'
  | 'faculty-announcement'
  | 'department-announcement'
  | 'level-announcement'
  | 'exam-alert'
  | 'timetable-alert'
  | 'event-alert'
  | 'ticket-alert'
  | 'discussion-comment'
  | 'discussion-reply'
  | 'engagement-like'
  | 'engagement-comment-like'
  | 'system-alert';
export type NotificationScope = 'global' | 'faculty' | 'department' | 'level' | 'personal' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  classification: NotificationClassification;
  scope: NotificationScope;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: string;
  entityType: string;
  entityId: string;
  actionPath?: string;
  actor: {
    id: string;
    name: string;
  } | null;
}

export interface NotificationsListResponse {
  success: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  total: number;
}

export interface NotificationsMutationResponse {
  success: boolean;
  unreadCount: number;
  total: number;
}

export interface PushTokenMutationResponse {
  success: boolean;
  token?: string;
  platform?: string;
  deactivatedCount?: number;
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

const normalizeCategory = (value: unknown, entityType: unknown, type: unknown): NotificationCategory => {
  switch (value) {
    case 'announcement':
    case 'engagement':
    case 'comment':
      return value;
    case 'system':
      return 'system';
    default:
      break;
  }

  const normalizedEntityType = normalizeString(entityType).toLowerCase();
  if (normalizedEntityType.includes('comment')) {
    return 'comment';
  }

  if (normalizedEntityType.includes('like') || normalizedEntityType.includes('reaction')) {
    return 'engagement';
  }

  if (normalizedEntityType.includes('post') || normalizedEntityType.includes('event')) {
    return 'announcement';
  }

  const normalizedType = normalizeType(type);
  if (normalizedType === 'warning' || normalizedType === 'error') {
    return 'system';
  }

  return 'system';
};

const normalizeClassification = (
  value: unknown,
  category: unknown,
  entityType: unknown,
  title: unknown,
  type: unknown
): NotificationClassification => {
  switch (value) {
    case 'school-announcement':
    case 'faculty-announcement':
    case 'department-announcement':
    case 'level-announcement':
    case 'exam-alert':
    case 'timetable-alert':
    case 'event-alert':
    case 'ticket-alert':
    case 'discussion-comment':
    case 'discussion-reply':
    case 'engagement-like':
    case 'engagement-comment-like':
      return value;
    case 'system-alert':
      return 'system-alert';
    default:
      break;
  }

  const normalizedEntityType = normalizeString(entityType).toLowerCase();
  const normalizedTitle = normalizeString(title).toLowerCase();
  const normalizedCategory = normalizeCategory(category, entityType, type);

  if (normalizedEntityType.includes('ticket') || normalizedTitle.includes('ticket')) {
    return 'ticket-alert';
  }

  if (normalizedCategory === 'comment') {
    return normalizedEntityType.includes('reply') ? 'discussion-reply' : 'discussion-comment';
  }

  if (normalizedCategory === 'engagement') {
    return normalizedEntityType.includes('comment') ? 'engagement-comment-like' : 'engagement-like';
  }

  if (normalizedEntityType.includes('timetable') || normalizedTitle.includes('timetable')) {
    return 'timetable-alert';
  }

  if (normalizedEntityType.includes('event') || normalizedTitle.includes('event')) {
    return 'event-alert';
  }

  if (normalizedTitle.includes('exam')) {
    return 'exam-alert';
  }

  if (normalizedCategory === 'announcement') {
    return 'school-announcement';
  }

  return 'system-alert';
};

const normalizeScope = (value: unknown, category: unknown, entityType: unknown): NotificationScope => {
  switch (value) {
    case 'global':
    case 'faculty':
    case 'department':
    case 'level':
    case 'personal':
      return value;
    case 'system':
      return 'system';
    default:
      break;
  }

  const normalizedCategory = normalizeCategory(category, entityType, 'info');
  if (normalizedCategory === 'announcement') {
    return 'global';
  }

  if (normalizedCategory === 'engagement' || normalizedCategory === 'comment') {
    return 'personal';
  }

  return 'system';
};

const buildFallbackActionPath = (entityType: unknown, entityId: unknown): string | undefined => {
  const normalizedEntityType = normalizeString(entityType).toLowerCase();
  const normalizedEntityId = normalizeString(entityId);

  if (!normalizedEntityId) {
    return undefined;
  }

  if (normalizedEntityType.includes('post')) {
    return `/post/${normalizedEntityId}`;
  }

  if (normalizedEntityType.includes('timetable')) {
    return `/timetable/${normalizedEntityId}`;
  }

  if (normalizedEntityType.includes('event')) {
    return `/event/${normalizedEntityId}`;
  }

  return undefined;
};

const buildFallbackTitle = (notification: any): string => {
  const classification = normalizeClassification(
    notification?.classification,
    notification?.category,
    notification?.entityType,
    notification?.title,
    notification?.type
  );

  if (classification === 'exam-alert') {
    return 'New exam alert';
  }

  if (classification === 'timetable-alert') {
    return 'New timetable update';
  }

  if (classification === 'event-alert') {
    return 'New event alert';
  }

  if (classification === 'ticket-alert') {
    return 'Ticket update';
  }

  if (classification === 'faculty-announcement') {
    return 'New faculty announcement';
  }

  if (classification === 'department-announcement') {
    return 'New department announcement';
  }

  if (classification === 'level-announcement') {
    return 'New level announcement';
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

export const normalizeNotification = (notification: any): AppNotification => ({
  id: normalizeString(notification?.id),
  type: normalizeType(notification?.type),
  category: normalizeCategory(notification?.category, notification?.entityType, notification?.type),
  classification: normalizeClassification(
    notification?.classification,
    notification?.category,
    notification?.entityType,
    notification?.title,
    notification?.type
  ),
  scope: normalizeScope(notification?.scope, notification?.category, notification?.entityType),
  title: normalizeString(notification?.title) || buildFallbackTitle(notification),
  message: normalizeString(notification?.message) || buildFallbackMessage(notification),
  timestamp: normalizeString(notification?.timestamp || notification?.createdAt),
  read: normalizeBoolean(notification?.read ?? notification?.isRead),
  icon: normalizeString(notification?.icon) || undefined,
  entityType: normalizeString(notification?.entityType),
  entityId: normalizeString(notification?.entityId),
  actionPath: normalizeString(notification?.actionPath) || buildFallbackActionPath(notification?.entityType, notification?.entityId),
  actor: notification?.actor && typeof notification.actor === 'object' ? {
    id: normalizeString(notification.actor.id),
    name: normalizeString(notification.actor.name),
  } : null,
});

const extractError = (error: unknown, fallbackMessage: string): never => {
  throw new Error(getErrorMessage(error, fallbackMessage));
};

export const notificationsAPI = {
  list: async (limit = 50): Promise<NotificationsListResponse> => {
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
      return extractError(error, 'Failed to load notifications.');
    }
  },

  markAsRead: async (id: string): Promise<NotificationsMutationResponse> => {
    try {
      const response = await api.post(`/notifications/${id}/read`);
      return {
        success: response.data?.success !== false,
        unreadCount: normalizeNumber(response.data?.unreadCount),
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      return extractError(error, 'Failed to update notification.');
    }
  },

  markAllAsRead: async (): Promise<NotificationsMutationResponse> => {
    try {
      const response = await api.post('/notifications/read-all');
      return {
        success: response.data?.success !== false,
        unreadCount: normalizeNumber(response.data?.unreadCount),
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      return extractError(error, 'Failed to mark notifications as read.');
    }
  },

  clearAll: async (): Promise<NotificationsMutationResponse> => {
    try {
      const response = await api.delete('/notifications');
      return {
        success: response.data?.success !== false,
        unreadCount: normalizeNumber(response.data?.unreadCount),
        total: normalizeNumber(response.data?.total),
      };
    } catch (error) {
      return extractError(error, 'Failed to clear notifications.');
    }
  },

  registerPushToken: async (payload: {
    token: string;
    platform: string;
    deviceName?: string;
  }): Promise<PushTokenMutationResponse> => {
    try {
      const response = await api.post('/notifications/push-token', payload);
      return {
        success: response.data?.success !== false,
        token: normalizeString(response.data?.token) || payload.token,
        platform: normalizeString(response.data?.platform) || payload.platform,
      };
    } catch (error) {
      return extractError(error, 'Failed to enable push notifications.');
    }
  },

  unregisterPushToken: async (token: string): Promise<PushTokenMutationResponse> => {
    try {
      const response = await api.delete('/notifications/push-token', {
        data: { token },
      });
      return {
        success: response.data?.success !== false,
        deactivatedCount: normalizeNumber(response.data?.deactivatedCount),
      };
    } catch (error) {
      return extractError(error, 'Failed to disable push notifications.');
    }
  },
};
