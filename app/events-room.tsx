import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostRoomFeed } from '@/components/posts/PostRoomFeed';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/utils/theme';

export default function EventsRoomScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const canCreateEventPosts = ['power', 'admin'].includes(user?.role || '');

  return (
    <PostRoomFeed
      title="Events Room"
      subtitle="Post-based event announcements, activity teasers, and reminders collected in one focused room."
      heroIcon="megaphone-outline"
      filters={{ category: 'Event' }}
      emptyTitle="No event posts yet"
      emptySubtitle="When event announcements are published through the post system, they will show up here."
      chips={[
        { label: 'Event posts', icon: 'megaphone-outline', tone: 'warning' },
        { label: 'Campus activity', icon: 'sparkles-outline', tone: 'danger' },
      ]}
      showNavCreateButton={false}
      heroActions={canCreateEventPosts ? (
        <Pressable
          onPress={() => router.push('/create-event')}
          style={[styles.addButton, { backgroundColor: theme.warning }]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      ) : undefined}
    />
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
