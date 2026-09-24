import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MatchAlerts } from '@/components/match-alerts';
import { prepareAlerts } from '@/services/alerts/alerts';
import { useCommunityStore } from '@/store/useCommunityStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const hydrateFeed = useCommunityStore((state) => state.hydrateFeed);
  useEffect(() => {
    void hydrateFeed();
    void prepareAlerts();
  }, [hydrateFeed]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <MatchAlerts />
        {children}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
