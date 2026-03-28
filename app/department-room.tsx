import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, LoadingState, ScreenShell } from '@/components/ui/AppChrome';
import { PostRoomFeed } from '@/components/posts/PostRoomFeed';
import { profileAPI, type UserProfile } from '@/services/profileApi';
import { showToast } from '@/utils/toast';

export default function DepartmentRoomScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfile();

      if (!response.success) {
        showToast.error(response.message || 'Unable to load your department room.');
        setProfile(null);
        return;
      }

      setProfile((response.data?.user || null) as UserProfile | null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Preparing your department room…" />
      </ScreenShell>
    );
  }

  if (!profile?.departmentId) {
    return (
      <ScreenShell>
        <EmptyState
          title="Department room unavailable"
          subtitle="Add your department to your profile so we can open the right post room for you."
          icon="business-outline"
        />
      </ScreenShell>
    );
  }

  return (
    <PostRoomFeed
      title={profile.department ? `${profile.department} Room` : 'Department Room'}
      subtitle="Department-wide updates, notices, and discussions for your current academic unit."
      heroIcon="business-outline"
      filters={{ departmentId: profile.departmentId }}
      emptyTitle="No department posts yet"
      emptySubtitle="When your department posts updates, they will appear here."
      chips={[
        { label: profile.department || 'Department', icon: 'business-outline', tone: 'warning' },
        { label: 'Current user room', icon: 'person-outline', tone: 'neutral' },
      ]}
    />
  );
}
