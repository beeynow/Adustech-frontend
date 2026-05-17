import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AppNotification } from '../services/notificationsApi';
import {
  formatNotificationTime,
  getNotificationPresentation,
  getNotificationScopeLabel,
} from '../utils/notificationPresentation';
import { useAppTheme } from '../utils/theme';

const { width } = Dimensions.get('window');

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications?: AppNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onPressNotification?: (notification: AppNotification) => void;
}

export default function NotificationModal({
  visible,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onPressNotification,
}: NotificationModalProps) {
  const theme = useAppTheme();
  const [slideAnim] = useState(new Animated.Value(300));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [slideAnim, visible]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationTitle = (notification: AppNotification) => {
    const title = notification.title.trim();
    return title || 'New notification';
  };

  const getNotificationMessage = (notification: AppNotification) => {
    const message = notification.message.trim();
    if (message) {
      return message;
    }

    if (notification.entityType === 'post') {
      return `${notification.actor?.name || 'Someone'} shared a new post.`;
    }

    return 'You have a new notification.';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.surfaceStrong,
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderStrong }]}>
            <View style={styles.headerLeft}>
              <Ionicons 
                name="notifications" 
                size={24} 
                color={theme.accent} 
              />
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <View style={[styles.actions, { borderBottomColor: theme.borderStrong }]}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={onMarkAllAsRead} style={styles.actionButton}>
                  <Ionicons name="checkmark-done" size={16} color={theme.accent} />
                  <Text style={[styles.actionText, { color: theme.accent }]}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClearAll} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={16} color={theme.danger} />
                <Text style={[styles.actionText, { color: theme.danger }]}>
                  Clear all
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications List */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              notifications.length === 0 && styles.scrollContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="notifications-off-outline" 
                  size={64} 
                  color={theme.textSoft} 
                />
                <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>
                  No notifications
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSoft }]}>
                  You&apos;re all caught up!
                </Text>
              </View>
            ) : (
              notifications.map((notification) => {
                const presentation = getNotificationPresentation(notification, theme);

                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      {
                        backgroundColor: notification.read ? 'transparent' : presentation.soft,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      if (onPressNotification) {
                        onPressNotification(notification);
                        return;
                      }

                      onMarkAsRead?.(notification.id);
                    }}
                  >
                    <View
                      style={[
                        styles.notificationIconContainer,
                        { backgroundColor: presentation.soft },
                      ]}
                    >
                      <Ionicons
                        name={presentation.icon}
                        size={22}
                        color={presentation.accent}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            { color: theme.text },
                            !notification.read && styles.notificationTitleUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {getNotificationTitle(notification)}
                        </Text>
                        {!notification.read ? (
                          <View style={[styles.unreadDot, { backgroundColor: presentation.accent }]} />
                        ) : null}
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={[styles.metaPill, { color: presentation.accent, backgroundColor: presentation.soft }]}>
                          {presentation.label}
                        </Text>
                        <Text style={[styles.metaPill, { color: theme.textMuted, backgroundColor: theme.surface }]}>
                          {getNotificationScopeLabel(notification)}
                        </Text>
                        {notification.actionPath ? (
                          <Text style={[styles.metaHint, { color: theme.textSoft }]}>Tap to open</Text>
                        ) : null}
                      </View>
                      <Text
                        style={[styles.notificationMessage, { color: theme.textMuted }]}
                        numberOfLines={2}
                      >
                        {getNotificationMessage(notification)}
                      </Text>
                      <Text style={[styles.notificationTime, { color: theme.textSoft }]}>
                        {formatNotificationTime(notification.timestamp)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContainer: {
    width: Math.min(width * 0.9, 400),
    maxHeight: '90%',
    minHeight: 220,
    marginTop: 60,
    marginRight: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaPill: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  metaHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    marginTop: 2,
  },
});
