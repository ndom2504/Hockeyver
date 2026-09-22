import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { PollCard } from '@/components/feed/poll-card';
import { PostCard } from '@/components/feed/post-card';
import { ComposeButton } from '@/components/navigation/compose-button';
import { TabHeader } from '@/components/navigation/tab-header';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterRow } from '@/components/ui/filter-row';
import { FEED_FILTERS } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { useCommunityStore } from '@/store/useCommunityStore';
import type { PostCategory } from '@/types/social';

type Filter = PostCategory | 'all';

export function CommunityScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const posts = useCommunityStore((state) => state.posts);
  const hidden = useCommunityStore((state) => state.hiddenPostIds);
  const poll = useCommunityStore((state) => state.polls.find((item) => item.id === 'poll-rivalry'));

  const visible = useMemo(() => {
    return posts
      .filter((post) => !hidden.includes(post.id))
      .filter((post) => (filter === 'all' ? true : post.category === filter))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [posts, hidden, filter]);

  return (
    <View style={styles.screen}>
      <TabHeader title="Communauté" subtitle="Discussions, matchs et hockey au-delà du score." />
      <FilterRow options={FEED_FILTERS} value={filter} onChange={(id) => setFilter(id as Filter)} />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.navy}
            colors={[colors.navy]}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 500);
            }}
          />
        }
        ListHeaderComponent={
          filter === 'all' && poll ? (
            <View style={styles.poll}>
              <PollCard poll={poll} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucune discussion"
            body="Ce filtre est calme pour le moment. Essayez une autre catégorie ou lancez le sujet."
          />
        }
        renderItem={({ item }) => <PostCard post={item} layout="full" />}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
      />
      <ComposeButton />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: 96 },
  poll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  gap: { height: 8, backgroundColor: colors.bg },
});
