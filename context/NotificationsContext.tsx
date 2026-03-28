import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import type { AppNotification } from '../services/notificationsApi';
import { notificationsAPI } from '../services/notificationsApi';

type NotificationsContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const REFRESH_INTERVAL_MS = 30000;

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const applyNotificationSnapshot = useCallback((snapshot: {
    notifications: AppNotification[];
    unreadCount: number;
    total: number;
  }) => {
    startTransition(() => {
      setNotifications(snapshot.notifications);
      setUnreadCount(snapshot.unreadCount);
      setTotalCount(snapshot.total);
    });
  }, []);

  const resetNotifications = useCallback(() => {
    startTransition(() => {
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      setIsLoading(false);
    });
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      resetNotifications();
      return;
    }

    if (mountedRef.current) {
      setIsLoading(true);
    }

    try {
      const response = await notificationsAPI.list();
      if (!mountedRef.current) {
        return;
      }

      applyNotificationSnapshot(response);
    } catch (error) {
      if (mountedRef.current) {
        console.warn('Failed to refresh notifications', error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyNotificationSnapshot, isAuthenticated, resetNotifications]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    const normalizedId = id.trim();
    if (!normalizedId) {
      return;
    }

    const currentNotification = notifications.find((notification) => notification.id === normalizedId);
    if (!currentNotification || currentNotification.read) {
      return;
    }

    const response = await notificationsAPI.markAsRead(normalizedId);

    startTransition(() => {
      setNotifications((current) => current.map((notification) => (
        notification.id === normalizedId
          ? { ...notification, read: true }
          : notification
      )));
      setUnreadCount(response.unreadCount);
      setTotalCount(response.total);
    });
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    if (notifications.length === 0 || unreadCount === 0) {
      return;
    }

    const response = await notificationsAPI.markAllAsRead();

    startTransition(() => {
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        read: true,
      })));
      setUnreadCount(response.unreadCount);
      setTotalCount(response.total);
    });
  }, [notifications.length, unreadCount]);

  const clearAll = useCallback(async () => {
    if (notifications.length === 0) {
      return;
    }

    const response = await notificationsAPI.clearAll();

    startTransition(() => {
      setNotifications([]);
      setUnreadCount(response.unreadCount);
      setTotalCount(response.total);
    });
  }, [notifications.length]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      resetNotifications();
      return undefined;
    }

    void refreshNotifications();

    const intervalId = setInterval(() => {
      void refreshNotifications();
    }, REFRESH_INTERVAL_MS);

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshNotifications();
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [isAuthenticated, refreshNotifications, resetNotifications, user?.email]);

  const value = useMemo<NotificationsContextType>(() => ({
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    refreshNotifications,
    markNotificationAsRead,
    markAllAsRead,
    clearAll,
  }), [
    clearAll,
    isLoading,
    markAllAsRead,
    markNotificationAsRead,
    notifications,
    refreshNotifications,
    totalCount,
    unreadCount,
  ]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}
