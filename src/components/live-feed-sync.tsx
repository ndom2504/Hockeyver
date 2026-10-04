import { useEffect } from 'react';

import { useNhlSnapshot } from '@/hooks/use-nhl';
import { seedFans } from '@/services/community/community.mock';
import { buildLiveCommunity } from '@/services/community/live-feed';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useSessionStore } from '@/store/useSessionStore';

export function LiveFeedSync() {
  const { data } = useNhlSnapshot();
  const favoriteTeamId = useSessionStore((state) => state.user?.favoriteTeamId);

  useEffect(() => {
    if (!data) return;
    useCommunityStore.getState().syncLive(buildLiveCommunity(data, seedFans, favoriteTeamId));
  }, [data, favoriteTeamId]);

  return null;
}
