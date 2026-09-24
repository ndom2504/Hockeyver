import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { TeamLogo } from '@/components/ui/team-logo';
import { PostActions } from '@/components/feed/post-actions';
import { colors, radius, shadow } from '@/constants/theme';
import { useSessionStore } from '@/store/useSessionStore';
import { useNhlIndex } from '@/hooks/use-nhl';
import { usePerson } from '@/hooks/use-people';
import { useCommunityStore } from '@/store/useCommunityStore';
import type { Post } from '@/types/social';
import { formatRelative } from '@/utils/date';
import { tap } from '@/utils/haptics';
import { displayName, formatNumber } from '@/utils/text';

type Props = {
  post: Post;
  variant?: 'feed' | 'detail';
  layout?: 'card' | 'full';
  onComment?: () => void;
};

function PostImage({ uri, full }: { uri: string; full: boolean }) {
  const [ratio, setRatio] = useState(4 / 3);
  return (
    <Image
      source={{ uri }}
      style={[full ? styles.imageFull : styles.image, { aspectRatio: ratio }]}
      contentFit="contain"
      transition={200}
      cachePolicy="memory-disk"
      onLoad={(event) => {
        const width = event.source?.width ?? 0;
        const height = event.source?.height ?? 0;
        if (width > 0 && height > 0) setRatio(width / height);
      }}
    />
  );
}

export function PostCard({ post, variant = 'feed', layout = 'card', onComment }: Props) {
  const author = usePerson(post.authorId) ?? {
    id: post.authorId,
    firstName: 'Partisan',
    lastName: '',
    username: 'partisan',
    avatarUrl: `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(post.authorId)}&backgroundColor=e7f0fa`,
    favoriteTeamId: '',
    bio: '',
    points: 0,
  };
  const { index } = useNhlIndex();
  const favorite = author ? index.teams.get(author.favoriteTeamId) : undefined;
  const contextTeam = post.teamId ? index.teams.get(post.teamId) : undefined;
  const contextPlayer = post.playerId ? index.players.get(post.playerId) : undefined;
  const meId = useSessionStore((state) => state.user?.id);
  const liked = useCommunityStore((state) =>
    state.likes.some((like) => like.targetType === 'post' && like.targetId === post.id && like.userId === meId),
  );
  const likeCount = useCommunityStore(
    (state) => state.likes.filter((like) => like.targetType === 'post' && like.targetId === post.id).length,
  );
  const commentCount = useCommunityStore((state) => state.comments.filter((comment) => comment.postId === post.id).length);
  const toggleLike = useCommunityStore((state) => state.toggleLike);
  const [menu, setMenu] = useState(false);
  const [expanded, setExpanded] = useState(variant === 'detail');
  const scale = useSharedValue(1);
  const heart = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const full = layout === 'full';
  const long = post.body.length > 220;
  const body = expanded || !long ? post.body : `${post.body.slice(0, 220).trim()}…`;

  const open = () => {
    if (variant === 'detail') return;
    router.push(`/post/${post.id}`);
  };

  const onLike = () => {
    scale.value = withSequence(withTiming(1.3, { duration: 120 }), withTiming(1, { duration: 150 }));
    tap();
    toggleLike('post', post.id);
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `${displayName(author)} sur HOCKEYVER\n\n${post.body}` });
    } catch {
      // Le partage a été annulé.
    }
  };

  return (
    <View style={[styles.card, full && styles.full]}>
      <View style={[styles.header, full && styles.inset]}>
        <Avatar uri={author.avatarUrl} name={displayName(author)} size={42} />
        <View style={styles.identity}>
          <AppText variant="callout" numberOfLines={1}>
            {displayName(author)}
          </AppText>
          <AppText variant="caption" color={colors.muted} numberOfLines={1}>
            {favorite ? favorite.name : 'NHL'} · {formatRelative(post.createdAt)}
          </AppText>
        </View>
        <PressableOpacity accessibilityLabel="Plus d’actions" onPress={() => setMenu(true)} hitSlop={8}>
          <Icon name="more" size={18} color={colors.faint} />
        </PressableOpacity>
      </View>

      <PressableOpacity onPress={open} disabled={variant === 'detail'} style={full ? styles.inset : undefined}>
        <AppText variant="body">{body}</AppText>
      </PressableOpacity>
      {long && variant === 'feed' ? (
        <PressableOpacity onPress={() => setExpanded((value) => !value)} style={full ? styles.inset : undefined}>
          <AppText variant="footnote" color={colors.navy}>
            {expanded ? 'Réduire' : 'Voir plus'}
          </AppText>
        </PressableOpacity>
      ) : null}

      {post.imageUrl ? (
        <PressableOpacity onPress={open} disabled={variant === 'detail'}>
          <PostImage uri={post.imageUrl} full={full} />
        </PressableOpacity>
      ) : null}

      {contextPlayer || contextTeam ? (
        <PressableOpacity
          onPress={() => {
            if (contextPlayer) router.push(`/player/${contextPlayer.id}`);
            else if (contextTeam) router.push(`/team/${contextTeam.id}`);
          }}
          style={[styles.context, full && styles.contextFull]}
        >
          {contextTeam ? <TeamLogo team={contextTeam} size={22} /> : null}
          <AppText variant="footnote" color={colors.navy} numberOfLines={1}>
            {contextPlayer ? `${contextPlayer.firstName} ${contextPlayer.lastName}` : contextTeam?.fullName}
          </AppText>
        </PressableOpacity>
      ) : null}

      {post.hashtags.length > 0 ? (
        <View style={[styles.tags, full && styles.inset]}>
          {post.hashtags.map((tag) => (
            <PressableOpacity key={tag} onPress={() => router.push(`/topic/${encodeURIComponent(tag)}`)}>
              <AppText variant="footnote" color={colors.navy}>
                #{tag}
              </AppText>
            </PressableOpacity>
          ))}
        </View>
      ) : null}

      <View style={[styles.actions, full && styles.actionsFull]}>
        <PressableOpacity accessibilityRole="button" accessibilityLabel="Aimer" onPress={onLike} style={styles.action}>
          <Animated.View style={heart}>
            <Icon name={liked ? 'heart' : 'heartOutline'} size={20} color={liked ? colors.red : colors.muted} />
          </Animated.View>
          <AppText variant="footnote" color={liked ? colors.red : colors.muted}>
            {formatNumber(likeCount)}
          </AppText>
        </PressableOpacity>
        <PressableOpacity
          accessibilityRole="button"
          accessibilityLabel="Commenter"
          onPress={onComment ?? open}
          style={styles.action}
        >
          <Icon name="chat" size={20} color={colors.muted} />
          <AppText variant="footnote" color={colors.muted}>
            {formatNumber(commentCount)}
          </AppText>
        </PressableOpacity>
        <PressableOpacity accessibilityRole="button" accessibilityLabel="Partager" onPress={onShare} style={styles.action}>
          <Icon name="share" size={18} color={colors.muted} />
        </PressableOpacity>
      </View>
      <PostActions postId={post.id} visible={menu} onClose={() => setMenu(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  full: {
    borderRadius: 0,
    borderWidth: 0,
    padding: 0,
    paddingTop: 12,
    gap: 10,
    ...Platform.select({
      ios: { shadowOpacity: 0, shadowRadius: 0 },
      android: { elevation: 0 },
      default: { boxShadow: 'none' as const },
    }),
  },
  inset: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  image: {
    width: '100%',
    borderRadius: radius.md,
    backgroundColor: colors.ice,
  },
  imageFull: {
    width: '100%',
    backgroundColor: colors.bg,
  },
  context: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.ice,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  contextFull: {
    marginHorizontal: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingTop: 2,
  },
  actionsFull: {
    justifyContent: 'space-around',
    gap: 0,
    marginTop: 2,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
