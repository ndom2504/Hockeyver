import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentRow } from '@/components/feed/comment-row';
import { PostCard } from '@/components/feed/post-card';
import { StackHeader } from '@/components/navigation/stack-header';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PressableOpacity } from '@/components/ui/pressable';
import { colors, radius } from '@/constants/theme';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useToastStore } from '@/store/useToastStore';
import type { Comment } from '@/types/social';
import { tap } from '@/utils/haptics';

export function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = useCommunityStore((state) => state.posts.find((item) => item.id === id));
  const comments = useCommunityStore((state) => state.comments);
  const addComment = useCommunityStore((state) => state.addComment);
  const show = useToastStore((state) => state.show);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [parent, setParent] = useState<Comment | null>(null);

  const thread = useMemo(() => {
    const list = comments
      .filter((comment) => comment.postId === id)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    return list
      .filter((comment) => !comment.parentId)
      .map((root) => ({
        root,
        replies: list.filter((comment) => comment.parentId === root.id),
      }));
  }, [comments, id]);

  const rows = thread.flatMap((item) => [
    { key: item.root.id, comment: item.root, nested: false },
    ...item.replies.map((reply) => ({ key: reply.id, comment: reply, nested: true })),
  ]);

  const publish = () => {
    const body = draft.trim();
    if (!post || body.length < 1) return;
    addComment({ postId: post.id, body, parentId: parent?.parentId ?? parent?.id });
    setDraft('');
    setParent(null);
    tap();
    show('Commentaire publié');
  };

  if (!post) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Discussion" />
        <EmptyState title="Publication introuvable" body="Elle a peut-être été supprimée." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StackHeader title="Discussion" />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <PostCard post={post} variant="detail" layout="full" />
            <AppText variant="label" color={colors.navy} style={styles.commentsLabel}>
              Commentaires
            </AppText>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucun commentaire" body="Soyez le premier à répondre." />}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <CommentRow
              comment={item.comment}
              nested={item.nested}
              onReply={(comment) => {
                setParent(comment.parentId ? rows.find((row) => row.comment.id === comment.parentId)?.comment ?? comment : comment);
                setDraft((value) => (value.startsWith('@') ? value : ''));
              }}
            />
          </View>
        )}
      />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {parent ? (
          <View style={styles.replying}>
            <AppText variant="caption" color={colors.muted}>
              Réponse à un commentaire
            </AppText>
            <PressableOpacity onPress={() => setParent(null)} hitSlop={8}>
              <AppText variant="caption" color={colors.navy}>
                Annuler
              </AppText>
            </PressableOpacity>
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ajouter un commentaire"
            placeholderTextColor={colors.faint}
            style={styles.input}
            multiline
          />
          <PressableOpacity
            accessibilityRole="button"
            accessibilityLabel="Publier le commentaire"
            disabled={draft.trim().length < 1}
            onPress={publish}
            style={[styles.send, draft.trim().length < 1 && styles.sendOff]}
          >
            <Icon name="send" size={18} color={colors.white} />
          </PressableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: 16 },
  header: { gap: 16, marginBottom: 8 },
  commentsLabel: { paddingHorizontal: 16 },
  comment: { paddingHorizontal: 16 },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  replying: { flexDirection: 'row', justifyContent: 'space-between' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.35 },
});
