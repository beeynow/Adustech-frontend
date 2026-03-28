import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PostRoomFeed } from '@/components/posts/PostRoomFeed';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/utils/theme';

export default function TimetableRoomScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const canCreateTimetablePosts = ['power', 'admin'].includes(user?.role || '');

  return (
    <PostRoomFeed
      title="Timetable Room"
      subtitle="Posts tagged for timetable updates, lecture schedules, and exam timing changes."
      heroIcon="calendar-outline"
      filters={{ category: 'Timetable' }}
      emptyTitle="No timetable posts yet"
      emptySubtitle="Timetable announcements and schedule posts will appear here as soon as they are published."
      chips={[
        { label: 'Timetable posts', icon: 'calendar-outline', tone: 'accent' },
        { label: 'Schedule updates', icon: 'time-outline', tone: 'success' },
      ]}
      showNavCreateButton={false}
      heroActions={canCreateTimetablePosts ? (
        <Pressable
          onPress={() => router.push('/create-timetable')}
          style={[styles.addButton, { backgroundColor: theme.accent }]}
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
