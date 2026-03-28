import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { channelsAPI, type Channel } from '@/services/channelsApi';
import { showToast } from '@/utils/toast';
import {
  ActionButton,
  Chip,
  EmptyState,
  FloatingActionButton,
  HeroCard,
  LoadingState,
  ScreenShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/ui/AppChrome';
import { useAppTheme } from '@/utils/theme';

export default function ChannelsListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const canManageChannels = ['power', 'admin', 'd-admin'].includes(user?.role || '');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await channelsAPI.list();
      setChannels(data.channels || []);
    } catch {
      showToast.error('Failed to load channels. Please retry.', 'Error');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelPress = (channel: Channel) => {
    showToast.info(`Opening ${channel.name} in the Channels tab.`, 'Redirecting');
    router.push('/(tabs)/channels' as any);
  };

  if (loading) {
    return (
      <ScreenShell>
        <LoadingState label="Loading channels…" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll>
      <HeroCard
        eyebrow="Channels"
        title="Join the right campus spaces"
        subtitle="Browse the available rooms for announcements, department updates, and focused student conversations."
        icon="chatbubbles-outline"
        actions={canManageChannels ? (
          <View style={{ width: 120 }}>
            <ActionButton label="Create" icon="add" onPress={() => router.push('/create-channel' as any)} />
          </View>
        ) : undefined}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={`${channels.length} channels`} icon="grid-outline" tone="accent" />
          <Chip label={canManageChannels ? 'Admin access' : 'Member view'} icon="shield-checkmark-outline" tone={canManageChannels ? 'success' : 'neutral'} />
        </View>
      </HeroCard>

      <SectionHeading
        title="Available Channels"
        subtitle="Each card shows the space type, membership hints, and whether it is department-linked."
      />

      {channels.length === 0 ? (
        <EmptyState
          title="No channels published yet"
          subtitle={canManageChannels ? 'Create the first room to give students a dedicated place to talk and receive updates.' : 'New channels will appear here as the platform grows.'}
          icon="chatbubbles-outline"
          action={canManageChannels ? (
            <ActionButton label="Create Channel" icon="add" onPress={() => router.push('/create-channel' as any)} style={{ marginTop: 8, width: '100%' }} />
          ) : undefined}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {channels.map((channel) => {
            const channelId = channel.id || channel._id || '';
            const isPrivate = channel.visibility === 'private';
            return (
              <SurfaceCard key={channelId}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.accentSoft,
                    }}
                  >
                    <Ionicons
                      name={isPrivate ? 'lock-closed-outline' : 'chatbubble-ellipses-outline'}
                      size={22}
                      color={theme.accent}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{channel.name}</Text>
                    {!!channel.description ? (
                      <Text style={{ color: theme.textMuted, marginTop: 6, lineHeight: 21 }}>
                        {channel.description}
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      <Chip label={isPrivate ? 'Private room' : 'Public room'} icon={isPrivate ? 'lock-closed-outline' : 'globe-outline'} tone={isPrivate ? 'warning' : 'accent'} />
                      {channel.departmentId ? <Chip label="Department linked" icon="business-outline" tone="success" /> : null}
                      {channel.level ? <Chip label={`Level ${channel.level}`} icon="layers-outline" tone="neutral" /> : null}
                      {channel.members?.length ? <Chip label={`${channel.members.length} members`} icon="people-outline" tone="neutral" /> : null}
                    </View>
                  </View>
                </View>

                <ActionButton
                  label="Open in Channels"
                  icon="arrow-forward"
                  variant="secondary"
                  onPress={() => handleChannelPress(channel)}
                  style={{ marginTop: 16 }}
                />
              </SurfaceCard>
            );
          })}
        </View>
      )}

      {canManageChannels ? <FloatingActionButton onPress={() => router.push('/create-channel' as any)} /> : null}
    </ScreenShell>
  );
}
