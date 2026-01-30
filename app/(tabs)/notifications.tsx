import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'message';
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      icon: '✅',
      title: 'Profile Updated',
      message: 'Your profile has been successfully updated.',
      time: '2 minutes ago',
      read: false,
    },
    {
      id: 2,
      type: 'info',
      icon: '📚',
      title: 'New Course Available',
      message: 'Introduction to Machine Learning is now available for enrollment.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 3,
      type: 'warning',
      icon: '⏰',
      title: 'Assignment Due Soon',
      message: 'Your Data Structures assignment is due in 2 days.',
      time: '3 hours ago',
      read: false,
    },
    {
      id: 4,
      type: 'message',
      icon: '💬',
      title: 'New Message',
      message: 'You have a new message from Dr. Johnson.',
      time: '5 hours ago',
      read: true,
    },
    {
      id: 5,
      type: 'info',
      icon: '🎓',
      title: 'Semester Registration',
      message: 'Registration for next semester begins on December 1st.',
      time: '1 day ago',
      read: true,
    },
    {
      id: 6,
      type: 'success',
      icon: '🏆',
      title: 'Achievement Unlocked',
      message: 'Congratulations! You&apos;ve completed 10 assignments.',
      time: '2 days ago',
      read: true,
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return isDark ? '#10B981' : '#059669';
      case 'warning':
        return isDark ? '#F59E0B' : '#D97706';
      case 'message':
        return isDark ? '#8B5CF6' : '#7C3AED';
      default:
        return isDark ? '#42A5F5' : '#1976D2';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A1929' : '#E6F4FE' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadCount, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={[styles.markAllButton, { color: isDark ? '#42A5F5' : '#1976D2' }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptyText, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
              You&apos;re all caught up! Check back later for updates.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  { backgroundColor: isDark ? '#1E3A5F' : '#FFFFFF' },
                  !notification.read && styles.unreadCard,
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={styles.notificationIcon}>{notification.icon}</Text>
                    <Text style={[styles.notificationTitle, { color: isDark ? '#FFFFFF' : '#0A1929' }]}>
                      {notification.title}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View style={[styles.unreadDot, { backgroundColor: getNotificationColor(notification.type) }]} />
                  )}
                </View>
                <Text style={[styles.notificationMessage, { color: isDark ? '#90CAF9' : '#546E7A' }]}>
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { color: isDark ? '#546E7A' : '#90A4AE' }]}>
                  {notification.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unreadCount: {
    fontSize: 14,
    marginTop: 4,
  },
  markAllButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    padding: 16,
    paddingTop: 0,
  },
  notificationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#42A5F5',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
