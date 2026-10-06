import { apiRequest } from '@/api/client';
import type { ReportReason } from '@/types/social';

export type ModerationAction = 'report' | 'block';

export async function notifyModeration(
  token: string,
  input: {
    action: ModerationAction;
    reason: ReportReason | 'abuse';
    targetUserId?: string;
    postId?: string;
    note?: string;
  },
) {
  return apiRequest<{ ok: true; id: string; createdAt: string }>('/api/moderation', {
    method: 'POST',
    token,
    body: input,
  });
}
