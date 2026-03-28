import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, LoadingState, ScreenShell } from '@/components/ui/AppChrome';
import { PostRoomFeed } from '@/components/posts/PostRoomFeed';
import { profileAPI, type UserProfile } from '@/services/profileApi';
import { showToast } from '@/utils/toast';

export default function LevelRoomScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfile();

      if (!response.success) {
        showToast.error(response.message || 'Unable to load your class room.');
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

  const levelLabel = profile?.level ? `${profile.level} Level` : 'Your level';

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Preparing your class room…" />
      </ScreenShell>
    );
  }

  if (!profile?.departmentId || (!profile?.levelId && !profile?.level)) {
    return (
      <ScreenShell>
        <EmptyState
          title="Class room unavailable"
          subtitle="Add your department and level to your profile so we can open your class post room."
          icon="layers-outline"
        />
      </ScreenShell>
    );
  }

  return (
    <PostRoomFeed
      title={`${levelLabel} Room`}
      subtitle={`Level-specific posts for ${profile.department || 'your department'}, plus department-wide updates relevant to your class.`}
      heroIcon="layers-outline"
      filters={{
        departmentId: profile.departmentId,
        ...(profile.levelId ? { levelId: profile.levelId } : {}),
        ...(profile.level ? { level: profile.level } : {}),
      }}
      emptyTitle="No class posts yet"
      emptySubtitle="Once your class or department publishes updates for this level, they will show up here."
      chips={[
        { label: levelLabel, icon: 'layers-outline', tone: 'danger' },
        ...(profile.department ? [{ label: profile.department, icon: 'business-outline' as const, tone: 'warning' as const }] : []),
      ]}
    />
  );
}
