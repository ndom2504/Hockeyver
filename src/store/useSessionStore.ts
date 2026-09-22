import { create } from 'zustand';

import { seedUser } from '@/services/community/community.mock';
import type { FanUser } from '@/types/social';

type SessionState = {
  user: FanUser;
  setFavoriteTeam: (teamId: string) => void;
  addPoints: (points: number) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: seedUser,
  setFavoriteTeam: (teamId) =>
    set((state) => ({
      user: { ...state.user, favoriteTeamId: teamId },
    })),
  addPoints: (points) =>
    set((state) => ({
      user: { ...state.user, points: state.user.points + points },
    })),
}));
