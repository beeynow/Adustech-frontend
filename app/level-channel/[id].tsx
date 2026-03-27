import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import IntegratedChannelRoom from '@/components/channels/IntegratedChannelRoom';
import integratedChannelsApi from '@/services/integratedChannelsApi';

export default function LevelChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const resolveChannel = useCallback(async () => {
    const response = await integratedChannelsApi.getLevelRoom(String(id));
    return response.channel;
  }, [id]);

  return (
    <IntegratedChannelRoom
      resolveChannel={resolveChannel}
      emptyStateTitle="Department level room is ready"
      readOnlyMessage="This room is for level-specific announcements only. Only the 2 assigned admins of this department can post."
    />
  );
}
