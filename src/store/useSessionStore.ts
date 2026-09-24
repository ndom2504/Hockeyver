import { create } from 'zustand';

import { deleteAccount, fetchSession, saveProfile } from '@/services/auth/auth.api';
import { clearToken, loadToken, saveToken } from '@/services/auth/storage';
import type { FanUser } from '@/types/social';

export type SessionStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

type SessionState = {
  status: SessionStatus;
  token: string | null;
  user: FanUser | null;
  hydrate: () => Promise<void>;
  establish: (token: string, user: FanUser, needsProfile: boolean) => Promise<void>;
  completeProfile: (input: { firstName: string; lastName: string; username: string; favoriteTeamId: string }) => Promise<void>;
  setFavoriteTeam: (teamId: string) => Promise<void>;
  addPoints: (points: number) => void;
  signOut: () => Promise<void>;
  removeAccount: () => Promise<void>;
};

function statusFor(needsProfile: boolean): SessionStatus {
  return needsProfile ? 'needsProfile' : 'ready';
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'loading',
  token: null,
  user: null,
  hydrate: async () => {
    const token = await loadToken();
    if (!token) {
      set({ status: 'signedOut', token: null, user: null });
      return;
    }
    try {
      const session = await fetchSession(token);
      set({ status: statusFor(session.needsProfile), token, user: session.user });
    } catch {
      await clearToken();
      set({ status: 'signedOut', token: null, user: null });
    }
  },
  establish: async (token, user, needsProfile) => {
    await saveToken(token);
    set({ status: statusFor(needsProfile), token, user });
  },
  completeProfile: async (input) => {
    const token = get().token;
    if (!token) throw new Error('Session expirée.');
    const session = await saveProfile(token, input);
    set({ status: statusFor(session.needsProfile), user: session.user });
  },
  setFavoriteTeam: async (teamId) => {
    const previous = get().user;
    const token = get().token;
    if (!previous || !token) return;
    set({ user: { ...previous, favoriteTeamId: teamId } });
    try {
      const session = await saveProfile(token, {
        firstName: previous.firstName,
        lastName: previous.lastName,
        username: previous.username,
        favoriteTeamId: teamId,
      });
      set({ user: session.user, status: statusFor(session.needsProfile) });
    } catch (error) {
      set({ user: previous });
      throw error;
    }
  },
  addPoints: (points) =>
    set((state) => ({
      user: state.user ? { ...state.user, points: state.user.points + points } : null,
    })),
  signOut: async () => {
    await clearToken();
    set({ status: 'signedOut', token: null, user: null });
  },
  removeAccount: async () => {
    const token = get().token;
    if (!token) throw new Error('Session expirée.');
    await deleteAccount(token);
    await clearToken();
    set({ status: 'signedOut', token: null, user: null });
  },
}));
