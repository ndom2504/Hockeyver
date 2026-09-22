import { CURRENT_USER_ID } from '@/constants/session';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useSessionStore } from '@/store/useSessionStore';

export function usePerson(userId?: string) {
  const me = useSessionStore((state) => state.user);
  const fans = useCommunityStore((state) => state.users);
  if (!userId) return undefined;
  if (userId === CURRENT_USER_ID || userId === me.id) return me;
  return fans.find((fan) => fan.id === userId);
}
