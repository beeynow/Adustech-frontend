import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PostComment } from '@/services/postsApi';
import { useAppTheme } from '@/utils/theme';
import { PostAvatar } from './PostAvatar';
import { buildAuthorHandle, formatPostCount, formatPostTimeAgo } from './postUi';

type PostCommentCardProps = {
  comment: PostComment;
  onPressLike?: () => void;
};

export function PostCommentCard({ comment, onPressLike }: PostCommentCardProps) {
  const theme = useAppTheme();
  const handle = buildAuthorHandle(comment.author.name, comment.author.id);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >

      <View style={styles.content}>
        <View style={styles.headerRow}>
      <PostAvatar
        name={comment.author.name}
        imageUri={comment.author.profileImage}
        size={40}
      />
          <View style={styles.identity}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {comment.author.name}
            </Text>
            <Text style={[styles.meta, { color: theme.textSoft }]} numberOfLines={1}>
              {handle} / {formatPostTimeAgo(comment.createdAt)}{" "}ago
            </Text>
          </View>

          <Pressable
            onPress={onPressLike}
            style={[
              styles.likeButton,
              {
                backgroundColor: comment.isLiked ? theme.dangerSoft : theme.surfaceMuted,
                borderColor: comment.isLiked ? theme.dangerSoft : theme.border,
              },
            ]}
          >
            <Ionicons
              name={comment.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={comment.isLiked ? theme.danger : theme.textSoft}
            />
            <Text
              style={[
                styles.likeText,
                { color: comment.isLiked ? theme.danger : theme.textSoft },
              ]}
            >
              {formatPostCount(comment.likesCount)}
            </Text>
          </Pressable>
        </View>

        {comment.parent ? (
          <View
            style={[
              styles.parentPreview,
              {
                borderLeftColor: theme.borderStrong,
                backgroundColor: theme.surfaceMuted,
              },
            ]}
          >
            <Text style={[styles.parentAuthor, { color: theme.textMuted }]}>
              Replying to {comment.parent.userName}
            </Text>
            <Text style={[styles.parentText, { color: theme.textSoft }]} numberOfLines={2}>
              {comment.parent.text}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.body, { color: theme.text }]}>{comment.text}</Text>

        <View style={styles.footerRow}>
          <View style={[styles.metaPill, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.textSoft} />
            <Text style={[styles.metaPillText, { color: theme.textSoft }]}>
              {comment.repliesCount > 0 ? `${formatPostCount(comment.repliesCount)} replies` : 'Comment'}
            </Text>
          </View>
          <Text style={[styles.footerMeta, { color: theme.textSoft }]}>
            {formatPostTimeAgo(comment.updatedAt || comment.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  content: {
    flex: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '900',
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  likeButton: {
    minWidth: 58,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  likeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  parentPreview: {
    borderLeftWidth: 2,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  parentAuthor: {
    fontSize: 12,
    fontWeight: '700',
  },
  parentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
});
