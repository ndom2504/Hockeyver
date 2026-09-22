import { Alert, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors } from '@/constants/theme';
import { CURRENT_USER_ID } from '@/constants/session';
import { usePerson } from '@/hooks/use-people';
import { useNhlIndex } from '@/hooks/use-nhl';
import { useCommunityStore } from '@/store/useCommunityStore';
import type { Comment } from '@/types/social';
import { formatRelative } from '@/utils/date';
import { tap } from '@/utils/haptics';
import { displayName } from '@/utils/text';

type Props = {
  comment: Comment;
  nested?: boolean;
  onReply: (comment: Comment) => void;
};

export function CommentRow({ comment, nested = false, onReply }: Props) {
  const author = usePerson(comment.authorId);
  const teamId = author?.favoriteTeamId;
  const { index } = useNhlIndex();
  const team = teamId ? index.teams.get(teamId) : undefined;
  const liked = useCommunityStore((state) =>
    state.likes.some((like) => like.targetType === 'comment' && like.targetId === comment.id && like.userId === CURRENT_USER_ID),
  );
  const likeCount = useCommunityStore(
    (state) => state.likes.filter((like) => like.targetType === 'comment' && like.targetId === comment.id).length,
  );
  const toggleLike = useCommunityStore((state) => state.toggleLike);
  const deleteComment = useCommunityStore((state) => state.deleteComment);
  const scale = useSharedValue(1);
  const heart = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!author) return null;

  const onLike = () => {
    scale.value = withSequence(withTiming(1.28, { duration: 110 }), withTiming(1, { duration: 140 }));
    tap();
    toggleLike('comment', comment.id);
  };

  const onDelete = () => {
    Alert.alert('Supprimer le commentaire', 'Cette action retire aussi les réponses.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteComment(comment.id) },
    ]);
  };

  return (
    <View style={[styles.row, nested && styles.nested]}>
      <Avatar uri={author.avatarUrl} name={displayName(author)} size={nested ? 28 : 36} />
      <View style={styles.body}>
        <View style={styles.meta}>
          <AppText variant="footnote" numberOfLines={1} style={styles.name}>
            {displayName(author)}
          </AppText>
          {team ? (
            <AppText variant="caption" color={colors.navy} numberOfLines={1}>
              {team.name}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.faint}>
            {formatRelative(comment.createdAt)}
          </AppText>
        </View>
        <AppText variant="body">{comment.body}</AppText>
        <View style={styles.actions}>
          <PressableOpacity accessibilityRole="button" accessibilityLabel="Aimer le commentaire" onPress={onLike} style={styles.action}>
            <Animated.View style={heart}>
              <Icon name={liked ? 'heart' : 'heartOutline'} size={16} color={liked ? colors.red : colors.muted} />
            </Animated.View>
            <AppText variant="caption" color={liked ? colors.red : colors.muted}>
              {likeCount}
            </AppText>
          </PressableOpacity>
          <PressableOpacity accessibilityRole="button" onPress={() => onReply(comment)} hitSlop={6}>
            <AppText variant="caption" color={colors.navy}>
              Répondre
            </AppText>
          </PressableOpacity>
          {comment.authorId === CURRENT_USER_ID ? (
            <PressableOpacity accessibilityRole="button" onPress={onDelete} hitSlop={6}>
              <AppText variant="caption" color={colors.muted}>
                Supprimer
              </AppText>
            </PressableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  nested: {
    marginLeft: 28,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
