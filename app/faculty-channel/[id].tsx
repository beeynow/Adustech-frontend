import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import IntegratedChannelRoom from '@/components/channels/IntegratedChannelRoom';
import integratedChannelsApi from '@/services/integratedChannelsApi';

export default function FacultyChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const resolveChannel = useCallback(async () => {
    const response = await integratedChannelsApi.getFacultyRoom(String(id));
    return response.channel;
  }, [id]);

  return (
    <IntegratedChannelRoom
      resolveChannel={resolveChannel}
      emptyStateTitle="Faculty room is ready"
      readOnlyMessage="This faculty room is read-only for students. Only your faculty admin can post updates here."
    />
  );
}
