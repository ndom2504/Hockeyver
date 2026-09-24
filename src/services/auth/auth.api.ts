import { apiRequest } from '@/api/client';
import type { FanUser } from '@/types/social';

export type AuthUser = FanUser & { phone: string; needsProfile: boolean };

type SessionPayload = {
  token?: string;
  user: AuthUser;
  needsProfile: boolean;
};

export function sendOtp(phone: string) {
  return apiRequest<{ phone: string }>('/api/auth/send', { body: { phone } });
}

export function verifyOtp(phone: string, code: string) {
  return apiRequest<SessionPayload & { token: string }>('/api/auth/verify', { body: { phone, code } });
}

export function signInWithApple(input: { identityToken: string; firstName?: string | null; lastName?: string | null }) {
  return apiRequest<SessionPayload & { token: string }>('/api/auth/apple', { body: input });
}

export function fetchSession(token: string) {
  return apiRequest<SessionPayload>('/api/auth/me', { method: 'GET', token });
}

export function deleteAccount(token: string) {
  return apiRequest<{ deleted: boolean }>('/api/auth/account', { method: 'DELETE', token });
}

export function saveProfile(
  token: string,
  input: { firstName: string; lastName: string; username: string; favoriteTeamId: string },
) {
  return apiRequest<SessionPayload>('/api/auth/profile', { token, body: input });
}
