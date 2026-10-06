import { database, ensureDatabase, HttpError, readUserId } from './auth.mjs';

const ACTIONS = new Set(['report', 'block']);
const REASONS = new Set(['spam', 'offensive', 'harassment', 'offtopic', 'other', 'abuse']);

let migrated;

function ensureModeration() {
  if (!migrated) {
    migrated = (async () => {
      await ensureDatabase();
      await database()`
        CREATE TABLE IF NOT EXISTS moderation_events (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          reporter_id uuid REFERENCES users (id) ON DELETE SET NULL,
          action text NOT NULL,
          reason text NOT NULL,
          target_user_id text,
          post_id text,
          note text,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await database()`CREATE INDEX IF NOT EXISTS moderation_events_created_idx ON moderation_events (created_at DESC)`;
    })();
  }
  return migrated;
}

function clip(value, max) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return text.slice(0, max);
}

export async function submitModeration(authorization, body) {
  await ensureModeration();
  const reporterId = readUserId(authorization);
  const action = String(body?.action ?? '');
  const reason = String(body?.reason ?? 'other');
  if (!ACTIONS.has(action)) throw new HttpError(400, 'Action de modération invalide.');
  if (!REASONS.has(reason)) throw new HttpError(400, 'Motif invalide.');

  const targetUserId = clip(body?.targetUserId, 80);
  const postId = clip(body?.postId, 80);
  const note = clip(body?.note, 500);
  if (action === 'block' && !targetUserId) throw new HttpError(400, 'Utilisateur à bloquer manquant.');
  if (action === 'report' && !postId && !targetUserId) throw new HttpError(400, 'Contenu à signaler manquant.');

  const rows = await database()`
    INSERT INTO moderation_events (reporter_id, action, reason, target_user_id, post_id, note)
    VALUES (${reporterId}, ${action}, ${reason}, ${targetUserId}, ${postId}, ${note})
    RETURNING id, created_at
  `;
  return { ok: true, id: rows[0].id, createdAt: rows[0].created_at };
}
