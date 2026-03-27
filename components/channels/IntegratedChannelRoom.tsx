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
import integratedChannelsApi from '@/services/integratedChannelsApi';
import { showToast } from '@/utils/toast';

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
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#1452CC" />
        <Text style={styles.loadingText}>Loading room...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={[styles.scopePill, { backgroundColor: `${getScopeTint(channel?.scope)}18` }]}>
          <Ionicons
            name={channel?.scope === 'faculty' ? 'school' : 'chatbubbles'}
            size={16}
            color={getScopeTint(channel?.scope)}
          />
          <Text style={[styles.scopePillText, { color: getScopeTint(channel?.scope) }]}>
            {(channel?.scope || 'channel').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>{channel?.name}</Text>
        {!!channel?.description && <Text style={styles.subtitle}>{channel.description}</Text>}

        <View style={styles.metricsRow}>
          <Text style={styles.metricText}>{channel?.memberCount || 0} members</Text>
          <Text style={styles.metricDivider}>•</Text>
          <Text style={styles.metricText}>{channel?.messageCount || messages.length} messages</Text>
        </View>

        {!canPost && ['faculty', 'department', 'level'].includes(channel?.scope || '') && (
          <View style={styles.noticeCard}>
            <Ionicons name="shield-checkmark" size={16} color="#A15C00" />
            <Text style={styles.noticeText}>{readOnlyMessage}</Text>
          </View>
        )}

        {channel?.scope === 'department' && typeof channel.assignedAdminCount === 'number' && (
          <View style={styles.noticeCard}>
            <Ionicons name="people-circle" size={16} color="#A15C00" />
            <Text style={styles.noticeText}>
              {`Assigned department admins: ${channel.assignedAdminCount}/${channel.requiredAdminCount || 2}`}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={messages.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageAuthor}>{item.user?.name || 'Unknown user'}</Text>
              <Text style={styles.messageMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            <Text style={styles.messageBody}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={34} color="#94A3B8" />
            <Text style={styles.emptyTitle}>{emptyStateTitle}</Text>
            <Text style={styles.emptySubtitle}>Messages from this room will appear here.</Text>
          </View>
        )}
      />

      <View style={styles.composerWrap}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={canPost ? 'Share an update with this room...' : 'Read-only room'}
          editable={canPost && !sending}
          multiline
          style={[styles.input, !canPost && styles.inputDisabled]}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!canPost || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canPost || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FB',
  },
  loadingText: {
    marginTop: 12,
    color: '#5B6B83',
    fontSize: 15,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scopePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  scopePillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10213A',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#5B6B83',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  metricText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  metricDivider: {
    marginHorizontal: 8,
    color: '#94A3B8',
  },
  noticeCard: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFF4D8',
    borderWidth: 1,
    borderColor: '#F6D68A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    color: '#8A5600',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  listContent: {
    padding: 18,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  messageAuthor: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#10213A',
  },
  messageMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10213A',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
  },
  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D6E0EE',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#10213A',
  },
  inputDisabled: {
    backgroundColor: '#EEF2F7',
    color: '#94A3B8',
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1452CC',
  },
  sendButtonDisabled: {
    backgroundColor: '#A7B9DB',
  },
});
