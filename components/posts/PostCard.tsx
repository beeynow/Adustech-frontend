import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PostItem } from '@/services/postsApi';
import { useAppTheme } from '@/utils/theme';
import { PostAvatar } from './PostAvatar';
import {
  buildAuthorHandle,
  formatPostCount,
  formatPostTimeAgo,
  getPostScopeLabel,
  getPriorityLabel,
  getRoleLabel,
  shouldShowPostTitle,
} from './postUi';

type PostCardProps = {
  post: PostItem;
  onPress?: () => void;
  onPressComments?: () => void;
  onPressLike?: () => void;
  onPressShare?: () => void;
  variant?: 'feed' | 'detail';
};

type ActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
  active?: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress?: () => void;
  showZero?: boolean;
};

const POST_ACTION_ICON_SIZE = 20;
const FEED_BODY_PREVIEW_LENGTH = 180;

const getPostBodyPreview = (value: string, isDetail: boolean) => {
  if (isDetail || value.length <= FEED_BODY_PREVIEW_LENGTH) {
    return value;
  }

  return `${value.slice(0, FEED_BODY_PREVIEW_LENGTH).trimEnd()}.....`;
};

function PostAction({
  icon,
  count,
  active = false,
  activeColor,
  inactiveColor,
  onPress,
  showZero = false,
}: ActionProps) {
  const color = active ? activeColor : inactiveColor;
  const showCount = typeof count === 'number' && (count > 0 || showZero);

  return (
    <Pressable onPress={onPress} style={styles.actionButton}>
      <Ionicons name={icon} size={POST_ACTION_ICON_SIZE} color={color} />
      {showCount ? (
        <Text style={[styles.actionCount, { color }]}>{formatPostCount(count)}</Text>
      ) : null}
    </Pressable>
  );
}

export function PostCard({
  post,
  onPress,
  onPressComments,
  onPressLike,
  onPressShare,
  variant = 'feed',
}: PostCardProps) {
  const theme = useAppTheme();
  const isDetail = variant === 'detail';
  const handle = buildAuthorHandle(post.author.name, post.author.id);
  const showTitle = shouldShowPostTitle(post);
  const bodyText = post.text || (!showTitle ? post.title : '');
  const visibleBodyText = getPostBodyPreview(bodyText, isDetail);
  const roleLabel = getRoleLabel(post.author.role);
  const priorityLabel = getPriorityLabel(post.priority);
  const detailContext = [
    post.isPinned ? 'Pinned' : '',
    getPostScopeLabel(post),
    post.category && post.category !== 'All' ? post.category : '',
    priorityLabel,
    isDetail && roleLabel ? roleLabel : '',
  ].filter(Boolean).join(' / ');

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: theme.surfaceStrong,
          borderColor: isDetail ? theme.borderStrong : theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={styles.row}>

        <View style={styles.content}>
          <View style={styles.headerRow}>
        <PostAvatar
          name={post.author.name}
          imageUri={post.author.profileImage}
          size={isDetail ? 44 : 40}
        />
            <View style={styles.headerMeta}>
              <View style={styles.identityRow}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {post.author.name}
                </Text>
                <Text style={[styles.secondaryMeta, { color: theme.textSoft }]}>
                  {formatPostTimeAgo(post.createdAt)}{" "}ago
                </Text>
              </View>
                <Text style={[styles.secondaryMeta, { color: theme.textSoft }]} numberOfLines={1}>
                  {handle}
                </Text>

              {isDetail && detailContext ? (
                <Text style={[styles.contextLine, { color: theme.textSoft }]} numberOfLines={1}>
                  {detailContext}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
              <Ionicons name="ellipsis-horizontal" size={16} color={theme.textSoft} />
            </TouchableOpacity>
          </View>

          <Pressable onPress={onPress} disabled={!onPress} style={styles.bodyWrap}>
            {showTitle ? (
              <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>
            ) : null}

            {!!visibleBodyText ? (
              <Text style={[styles.body, { color: theme.text }]}>{visibleBodyText}</Text>
            ) : null}

            {post.imageUrl ? (
              <View
                style={[
                  styles.imageWrap,
                  {
                    borderColor: theme.border,
                  },
                ]}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.image} />
              </View>
            ) : null}
          </Pressable>

          <View
            style={[
              styles.actionsRow,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
            ]}
          >
            <PostAction
              icon="chatbubble-outline"
              count={post.commentsCount}
              activeColor={theme.accent}
              inactiveColor={theme.textSoft}
              onPress={onPressComments}
              showZero
            />
            <PostAction
              icon="eye-outline"
              count={post.viewsCount}
              activeColor={theme.accent}
              inactiveColor={theme.textSoft}
              showZero
            />
            <PostAction
              icon={post.isLiked ? 'heart' : 'heart-outline'}
              count={post.likesCount}
              active={post.isLiked}
              activeColor={theme.danger}
              inactiveColor={theme.textSoft}
              onPress={onPressLike}
              showZero
            />
            <PostAction
              icon="arrow-redo-outline"
              activeColor={theme.accent}
              inactiveColor={theme.textSoft}
              onPress={onPressShare}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  contextLine: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
  bodyWrap: {
    gap: 10,
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  imageWrap: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 2,
  },
  image: {
    width: '100%',
    height: 220,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionButton: {
    minWidth: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '700',
  },
});
