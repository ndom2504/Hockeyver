import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { PostCard } from '@/components/feed/post-card';
import { StackHeader } from '@/components/navigation/stack-header';
import { EmptyState } from '@/components/ui/empty-state';
import { colors } from '@/constants/theme';
import { useCommunityStore } from '@/store/useCommunityStore';
import { fold } from '@/utils/text';

export function TopicScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const decoded = decodeURIComponent(tag ?? '');
  const posts = useCommunityStore((state) => state.posts);
  const hidden = useCommunityStore((state) => state.hiddenPostIds);
  const matches = useMemo(
    () =>
      posts.filter(
        (post) => !hidden.includes(post.id) && post.hashtags.some((item) => fold(item) === fold(decoded)),
      ),
    [posts, hidden, decoded],
  );

  return (
    <View style={styles.screen}>
      <StackHeader title={`#${decoded}`} subtitle="Sujet en tendance" />
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState title="Sujet calme" body="Aucune publication ne porte ce hashtag pour le moment." />
        }
        renderItem={({ item }) => (
          <View style={styles.pad}>
            <PostCard post={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: 32, paddingTop: 8 },
  pad: { paddingHorizontal: 16 },
  gap: { height: 12 },
});
