import { database, ensureDatabase, HttpError, readUserId } from './auth.mjs';

const CATEGORIES = new Set(['player', 'team', 'match', 'nhl', 'society']);

let migrated;

function ensurePosts() {
  if (!migrated) {
    migrated = (async () => {
      await ensureDatabase();
      await database()`
        CREATE TABLE IF NOT EXISTS posts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          author_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          body text NOT NULL,
          image_url text,
          category text NOT NULL,
          player_id text,
          team_id text,
          match_id text,
          hashtags text NOT NULL DEFAULT '[]',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await database()`
        CREATE TABLE IF NOT EXISTS comments (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
          author_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          parent_id uuid REFERENCES comments (id) ON DELETE CASCADE,
          body text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await database()`
        CREATE TABLE IF NOT EXISTS reactions (
          user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
          target_id uuid NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (user_id, target_type, target_id)
        )
      `;
      await database()`CREATE INDEX IF NOT EXISTS comments_post_idx ON comments (post_id, created_at)`;
      await database()`CREATE INDEX IF NOT EXISTS reactions_target_idx ON reactions (target_type, target_id)`;
    })();
  }
  return migrated;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value ?? ''));
}

function clip(value, max) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return text.slice(0, max);
}

function parseTags(value) {
  try {
    const tags = JSON.parse(value || '[]');
    return Array.isArray(tags) ? tags.map((tag) => String(tag)).slice(0, 12) : [];
  } catch {
    return [];
  }
}

function toPost(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    imageUrl: row.image_url || undefined,
    category: row.category,
    playerId: row.player_id || undefined,
    teamId: row.team_id || undefined,
    matchId: row.match_id || undefined,
    hashtags: parseTags(row.hashtags),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function toAuthor(row) {
  return {
    id: row.author_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username ?? '',
    avatarUrl: row.avatar_url,
    favoriteTeamId: row.favorite_team_id ?? '',
    bio: row.bio ?? '',
    points: row.points ?? 0,
  };
}

export async function listPosts() {
  await ensurePosts();
  const rows = await database()`
    SELECT p.id, p.author_id, p.body, p.image_url, p.category, p.player_id, p.team_id, p.match_id,
           p.hashtags, p.created_at, u.first_name, u.last_name, u.username, u.avatar_url,
           u.favorite_team_id, u.bio, u.points
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC
    LIMIT 100
  `;
  const commentRows = await database()`
    SELECT c.id, c.post_id, c.author_id, c.parent_id, c.body, c.created_at,
           u.first_name, u.last_name, u.username, u.avatar_url, u.favorite_team_id, u.bio, u.points
    FROM comments c
    JOIN users u ON u.id = c.author_id
    ORDER BY c.created_at ASC
    LIMIT 500
  `;
  const reactionRows = await database()`
    SELECT user_id, target_type, target_id
    FROM reactions
    WHERE (target_type = 'post' AND target_id IN (SELECT id FROM posts ORDER BY created_at DESC LIMIT 100))
       OR (target_type = 'comment' AND target_id IN (SELECT id FROM comments ORDER BY created_at DESC LIMIT 500))
    LIMIT 2000
  `;
  const authors = new Map();
  const posts = rows.map((row) => {
    authors.set(row.author_id, toAuthor(row));
    return toPost(row);
  });
  const comments = commentRows.map((row) => {
    authors.set(row.author_id, toAuthor(row));
    return toComment(row);
  });
  const likes = reactionRows.map((row) => ({
    userId: row.user_id,
    targetType: row.target_type,
    targetId: row.target_id,
  }));
  return { posts, comments, likes, authors: [...authors.values()] };
}

function toComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    body: row.body,
    parentId: row.parent_id || undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function publishPost(authorization, input) {
  await ensurePosts();
  const userId = readUserId(authorization);
  const body = String(input?.body ?? '').trim();
  if (body.length < 3 || body.length > 2000) {
    throw new HttpError(400, 'La publication doit contenir entre 3 et 2000 caractères.');
  }
  const category = String(input?.category ?? '');
  if (!CATEGORIES.has(category)) throw new HttpError(400, 'Choisissez une catégorie.');
  const user = await database()`SELECT username FROM users WHERE id = ${userId} LIMIT 1`;
  if (!user[0]?.username) throw new HttpError(403, 'Complétez votre profil avant de publier.');

  const tags = (Array.isArray(input?.hashtags) ? input.hashtags : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 12);
  const rows = await database()`
    INSERT INTO posts (author_id, body, image_url, category, player_id, team_id, match_id, hashtags)
    VALUES (
      ${userId},
      ${body},
      ${clip(input?.imageUrl, 2000)},
      ${category},
      ${clip(input?.playerId, 40)},
      ${clip(input?.teamId, 8)},
      ${clip(input?.matchId, 40)},
      ${JSON.stringify(tags)}
    )
    RETURNING id, author_id, body, image_url, category, player_id, team_id, match_id, hashtags, created_at
  `;
  await database()`UPDATE users SET points = points + 5 WHERE id = ${userId}`;
  return { post: toPost(rows[0]) };
}

export async function removePost(authorization, postId) {
  await ensurePosts();
  const userId = readUserId(authorization);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(postId ?? ''))) {
    throw new HttpError(404, 'Publication introuvable.');
  }
  const owned = await database()`
    SELECT id FROM posts WHERE id = ${postId}::uuid AND author_id = ${userId} LIMIT 1
  `;
  if (!owned[0]) throw new HttpError(404, 'Publication introuvable.');
  await database()`
    DELETE FROM reactions
    WHERE (target_type = 'post' AND target_id = ${postId}::uuid)
       OR (target_type = 'comment' AND target_id IN (SELECT id FROM comments WHERE post_id = ${postId}::uuid))
  `;
  await database()`DELETE FROM posts WHERE id = ${postId}::uuid AND author_id = ${userId}`;
  return { deleted: true };
}

export async function publishComment(authorization, input) {
  await ensurePosts();
  const userId = readUserId(authorization);
  const postId = String(input?.postId ?? '');
  const parentId = input?.parentId ? String(input.parentId) : null;
  if (!isUuid(postId) || (parentId && !isUuid(parentId))) throw new HttpError(404, 'Publication introuvable.');
  const body = String(input?.body ?? '').trim();
  if (body.length < 1 || body.length > 1000) {
    throw new HttpError(400, 'Le commentaire doit contenir entre 1 et 1000 caractères.');
  }
  const user = await database()`SELECT username FROM users WHERE id = ${userId} LIMIT 1`;
  if (!user[0]?.username) throw new HttpError(403, 'Complétez votre profil avant de commenter.');
  const post = await database()`SELECT id FROM posts WHERE id = ${postId}::uuid LIMIT 1`;
  if (!post[0]) throw new HttpError(404, 'Publication introuvable.');
  if (parentId) {
    const parent = await database()`
      SELECT id FROM comments WHERE id = ${parentId}::uuid AND post_id = ${postId}::uuid LIMIT 1
    `;
    if (!parent[0]) throw new HttpError(404, 'Commentaire introuvable.');
  }
  const rows = parentId
    ? await database()`
        INSERT INTO comments (post_id, author_id, parent_id, body)
        VALUES (${postId}::uuid, ${userId}, ${parentId}::uuid, ${body})
        RETURNING id, post_id, author_id, parent_id, body, created_at
      `
    : await database()`
        INSERT INTO comments (post_id, author_id, body)
        VALUES (${postId}::uuid, ${userId}, ${body})
        RETURNING id, post_id, author_id, parent_id, body, created_at
      `;
  await database()`UPDATE users SET points = points + 2 WHERE id = ${userId}`;
  return { comment: toComment(rows[0]) };
}

export async function removeComment(authorization, commentId) {
  await ensurePosts();
  const userId = readUserId(authorization);
  if (!isUuid(commentId)) throw new HttpError(404, 'Commentaire introuvable.');
  const owned = await database()`
    SELECT id FROM comments WHERE id = ${commentId}::uuid AND author_id = ${userId} LIMIT 1
  `;
  if (!owned[0]) throw new HttpError(404, 'Commentaire introuvable.');
  await database()`
    DELETE FROM reactions
    WHERE target_type = 'comment'
      AND target_id IN (
        SELECT id FROM comments WHERE id = ${commentId}::uuid OR parent_id = ${commentId}::uuid
      )
  `;
  await database()`DELETE FROM comments WHERE id = ${commentId}::uuid AND author_id = ${userId}`;
  return { deleted: true };
}

export async function toggleReaction(authorization, input) {
  await ensurePosts();
  const userId = readUserId(authorization);
  const targetType = String(input?.targetType ?? '');
  const targetId = String(input?.targetId ?? '');
  if ((targetType !== 'post' && targetType !== 'comment') || !isUuid(targetId)) {
    throw new HttpError(400, 'Réaction impossible.');
  }
  const user = await database()`SELECT username FROM users WHERE id = ${userId} LIMIT 1`;
  if (!user[0]?.username) throw new HttpError(403, 'Complétez votre profil avant de réagir.');
  const target =
    targetType === 'post'
      ? await database()`SELECT author_id FROM posts WHERE id = ${targetId}::uuid LIMIT 1`
      : await database()`SELECT author_id FROM comments WHERE id = ${targetId}::uuid LIMIT 1`;
  if (!target[0]) throw new HttpError(404, 'Contenu introuvable.');

  const existing = await database()`
    SELECT user_id FROM reactions
    WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${targetId}::uuid
    LIMIT 1
  `;
  if (existing[0]) {
    await database()`
      DELETE FROM reactions
      WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${targetId}::uuid
    `;
    if (target[0].author_id !== userId) {
      await database()`UPDATE users SET points = GREATEST(points - 1, 0) WHERE id = ${target[0].author_id}`;
    }
    return { liked: false };
  }
  await database()`
    INSERT INTO reactions (user_id, target_type, target_id)
    VALUES (${userId}, ${targetType}, ${targetId}::uuid)
  `;
  if (target[0].author_id !== userId) {
    await database()`UPDATE users SET points = points + 1 WHERE id = ${target[0].author_id}`;
  }
  return { liked: true, like: { userId, targetType, targetId } };
}
