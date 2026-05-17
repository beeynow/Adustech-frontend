import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { integratedChannelsApi } from '@/services/integratedChannelsApi';
import { showToast } from '@/utils/toast';
import { useAppTheme } from '@/utils/theme';

type ChannelData = {
  id: string;
  name: string;
  description?: string;
  scope?: string;
  memberCount?: number;
  messageCount?: number;
  canPost?: boolean;
  memberRole?: string | null;
  userRole?: string | null;
  requiredAdminCount?: number;
  assignedAdminCount?: number;
};

type MessageData = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role?: string;
  };
};

type Props = {
  resolveChannel: () => Promise<ChannelData>;
  emptyStateTitle?: string;
  readOnlyMessage?: string;
};

const getScopeTint = (scope?: string) => {
  switch (scope) {
    case 'faculty':
      return '#0F8F5B';
    case 'department':
      return '#C77700';
    case 'level':
      return '#D53F8C';
    default:
      return '#1452CC';
  }
};

export default function IntegratedChannelRoom({
  resolveChannel,
  emptyStateTitle = 'No messages yet',
  readOnlyMessage = 'Only faculty admins can post in this room.',
}: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [draft, setDraft] = useState('');

  const canPost = useMemo(() => {
    if (!channel) {
      return false;
    }

    if (typeof channel.canPost === 'boolean') {
      return channel.canPost;
    }

    if (channel.scope === 'faculty') {
      return ['admin'].includes(channel.memberRole || channel.userRole || '');
    }

    return true;
  }, [channel]);

  const loadRoom = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const resolvedChannel = await resolveChannel();
      setChannel(resolvedChannel);

      const messagesResponse = await integratedChannelsApi.getChannelMessages(resolvedChannel.id);
      setMessages(messagesResponse.messages || []);
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to load channel room.');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [resolveChannel]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoom(false);
    setRefreshing(false);
  };

  const handleSend = async () => {
    if (!channel) {
      return;
    }

    const content = draft.trim();
    if (!content) {
      showToast.info('Write a message before sending.');
      return;
    }

    if (!canPost) {
      showToast.warning(readOnlyMessage);
      return;
    }

    try {
      setSending(true);
      const response = await integratedChannelsApi.sendMessage(channel.id, { content });
      const newMessage = response.data;

      setMessages((current) => [...current, newMessage]);
      setChannel((current) => current ? {
        ...current,
        messageCount: (current.messageCount || 0) + 1,
      } : current);
      setDraft('');
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading room…</Text>
      </View>
    );
  }

  const scopeColor = getScopeTint(channel?.scope);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 18,
            backgroundColor: theme.backgroundMuted,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={[styles.scopePill, { backgroundColor: `${scopeColor}18`, borderColor: `${scopeColor}30` }]}>
          <Ionicons
            name={channel?.scope === 'faculty' ? 'school-outline' : channel?.scope === 'department' ? 'business-outline' : channel?.scope === 'level' ? 'layers-outline' : 'chatbubbles-outline'}
            size={16}
            color={scopeColor}
          />
          <Text style={[styles.scopePillText, { color: scopeColor }]}>
            {(channel?.scope || 'channel').toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{channel?.name}</Text>
        {!!channel?.description ? (
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{channel.description}</Text>
        ) : null}

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: theme.text }]}>{channel?.memberCount || 0}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSoft }]}>Members</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: theme.text }]}>{channel?.messageCount || messages.length}</Text>
            <Text style={[styles.metricLabel, { color: theme.textSoft }]}>Messages</Text>
          </View>
        </View>

        {!canPost && ['faculty', 'department', 'level'].includes(channel?.scope || '') ? (
          <View style={[styles.noticeCard, { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}30` }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.warning} />
            <Text style={[styles.noticeText, { color: theme.warning }]}>{readOnlyMessage}</Text>
          </View>
        ) : null}

        {channel?.scope === 'department' && typeof channel.assignedAdminCount === 'number' ? (
          <View style={[styles.noticeCard, { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}30` }]}>
            <Ionicons name="people-circle-outline" size={16} color={theme.accent} />
            <Text style={[styles.noticeText, { color: theme.accent }]}>
              {`Assigned department admins: ${channel.assignedAdminCount}/${channel.requiredAdminCount || 2}`}
            </Text>
          </View>
        ) : null}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={messages.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        renderItem={({ item }) => (
          <View style={[styles.messageCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.messageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.messageAuthor, { color: theme.text }]}>{item.user?.name || 'Unknown user'}</Text>
                <Text style={[styles.messageMeta, { color: theme.textSoft }]}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.accentSoft,
                }}
              >
                <Text style={{ color: theme.accent, fontSize: 15, fontWeight: '900' }}>
                  {(item.user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.messageBody, { color: theme.textMuted }]}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="sparkles-outline" size={28} color={theme.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{emptyStateTitle}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Messages from this room will appear here once someone starts the conversation.
            </Text>
          </View>
        )}
      />

      <View
        style={[
          styles.composerWrap,
          {
            backgroundColor: theme.surfaceStrong,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <View style={[styles.inputWrap, { backgroundColor: theme.input, borderColor: theme.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={canPost ? 'Share an update with this room...' : 'Read-only room'}
            editable={canPost && !sending}
            multiline
            style={[styles.input, { color: theme.text }]}
            placeholderTextColor={theme.textSoft}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: canPost ? theme.accent : theme.textSoft }]}
          onPress={handleSend}
          disabled={!canPost || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  scopePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  scopePillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  noticeCard: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  messageCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageAuthor: {
    fontSize: 15,
    fontWeight: '900',
  },
  messageMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  messageBody: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  composerWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 56,
  },
  input: {
    fontSize: 15,
    lineHeight: 21,
    minHeight: 32,
    maxHeight: 120,
  },
  sendButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
