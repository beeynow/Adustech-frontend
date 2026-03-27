import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import IntegratedChannelRoom from '@/components/channels/IntegratedChannelRoom';
import integratedChannelsApi from '@/services/integratedChannelsApi';

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const resolveChannel = useCallback(async () => {
    const response = await integratedChannelsApi.getMyChannels();
    const channel = (response.channels || []).find((item: any) => item.id === String(id));

    if (!channel) {
      throw new Error('Channel not found in your memberships.');
    }

    return channel;
  }, [id]);

  return (
    <IntegratedChannelRoom
      resolveChannel={resolveChannel}
      emptyStateTitle="Start the conversation"
    />
  );
}
