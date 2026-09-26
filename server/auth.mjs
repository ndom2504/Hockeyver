import { createHash, createHmac, createPublicKey, timingSafeEqual, verify as verifySignature } from 'node:crypto';

import { neon } from '@neondatabase/serverless';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new HttpError(500, 'Le serveur n’est pas configuré.');
  return value;
}

let client;

function sql() {
  if (!client) client = neon(required('DATABASE_URL'));
  return client;
}

let migrated;

function ready() {
  if (!migrated) migrated = migrate();
  return migrated;
}

export function ensureDatabase() {
  return ready();
}

export function database() {
  return sql();
}

async function migrate() {
  await sql()`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone text UNIQUE,
      first_name text NOT NULL DEFAULT '',
      last_name text NOT NULL DEFAULT '',
      username text UNIQUE,
      avatar_url text NOT NULL DEFAULT '',
      favorite_team_id text,
      bio text NOT NULL DEFAULT '',
      points integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql()`ALTER TABLE users ALTER COLUMN phone DROP NOT NULL`;
  await sql()`ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_sub text`;
  await sql()`CREATE UNIQUE INDEX IF NOT EXISTS users_apple_sub_key ON users (apple_sub)`;
}

export function normalizePhone(input) {
  const raw = String(input ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  let phone = '';
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) phone = `+${digits}`;
  else if (digits.length === 10) phone = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith('1')) phone = `+${digits}`;
  if (!/^\+[1-9]\d{9,14}$/.test(phone)) {
    throw new HttpError(400, 'Entrez un numéro de téléphone valide.');
  }
  return phone;
}

function avatarFor(seed) {
  return `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seed)}&backgroundColor=e7f0fa`;
}

function toUser(row) {
  return {
    id: row.id,
    phone: row.phone ?? '',
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username ?? '',
    avatarUrl: row.avatar_url,
    favoriteTeamId: row.favorite_team_id ?? '',
    bio: row.bio,
    points: row.points,
    needsProfile: !row.first_name || !row.username || !row.favorite_team_id,
  };
}

function secret() {
  const value = process.env.AUTH_SECRET || process.env.TWILIO_AUTH_TOKEN;
  if (value) return value;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new HttpError(500, 'Le serveur n’est pas configuré.');
  return createHash('sha256').update(databaseUrl).digest('base64url');
}

export function signToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }),
  ).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readUserId(authorization) {
  const token = String(authorization ?? '').replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature) throw new HttpError(401, 'Session expirée.');
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new HttpError(401, 'Session expirée.');
  }
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!data.sub || !data.exp || data.exp < Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, 'Session expirée.');
  }
  return data.sub;
}

async function twilio(path, params) {
  const account = required('TWILIO_ACCOUNT_SID');
  const token = required('TWILIO_AUTH_TOKEN');
  const service = required('TWILIO_VERIFY_SERVICE_SID');
  const response = await fetch(`https://verify.twilio.com/v2/Services/${service}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Twilio', response.status, body.code || 'unknown');
    if (body.code === 60200 || body.code === 21211) throw new HttpError(400, 'Ce numéro ne peut pas recevoir de code.');
    if (body.code === 20404) throw new HttpError(401, 'Ce code a expiré. Demandez-en un nouveau.');
    if (body.code === 60202 || body.code === 60203 || body.code === 20429) {
      throw new HttpError(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
    }
    throw new HttpError(502, 'La vérification a échoué. Réessayez.');
  }
  return body;
}

function reviewPhone() {
  const raw = process.env.REVIEW_PHONE || '+15555550199';
  try {
    return normalizePhone(raw);
  } catch {
    return '';
  }
}

function reviewCode() {
  return String(process.env.REVIEW_CODE || '204826').replace(/\D/g, '');
}

export async function sendOtp(phoneInput) {
  const phone = normalizePhone(phoneInput);
  if (phone === reviewPhone()) return { phone };
  await twilio('/Verifications', { To: phone, Channel: 'sms' });
  return { phone };
}

async function reviewSession(phone) {
  await ready();
  const existing = await sql()`SELECT * FROM users WHERE phone = ${phone} LIMIT 1`;
  const row = existing[0]
    ? (
        await sql()`
          UPDATE users
          SET first_name = 'Revue',
              last_name = 'Apple',
              username = COALESCE(NULLIF(username, ''), 'revue.hockey'),
              favorite_team_id = COALESCE(NULLIF(favorite_team_id, ''), 'MTL'),
              avatar_url = ${avatarFor('revue.hockey')}
          WHERE id = ${existing[0].id}
          RETURNING *
        `
      )[0]
    : (
        await sql()`
          INSERT INTO users (phone, first_name, last_name, username, favorite_team_id, avatar_url)
          VALUES (${phone}, 'Revue', 'Apple', 'revue.hockey', 'MTL', ${avatarFor('revue.hockey')})
          RETURNING *
        `
      )[0];
  const user = toUser(row);
  return { token: signToken(user.id), user, needsProfile: user.needsProfile };
}

export async function verifyOtp(phoneInput, codeInput) {
  const phone = normalizePhone(phoneInput);
  const code = String(codeInput ?? '').replace(/\D/g, '');
  if (code.length < 4 || code.length > 10) throw new HttpError(400, 'Entrez le code reçu par texto.');
  if (phone === reviewPhone() && reviewCode() && code === reviewCode()) return reviewSession(phone);
  const check = await twilio('/VerificationCheck', { To: phone, Code: code });
  if (check.status !== 'approved') throw new HttpError(401, 'Code incorrect.');

  await ready();
  const existing = await sql()`SELECT * FROM users WHERE phone = ${phone} LIMIT 1`;
  const row =
    existing[0] ??
    (
      await sql()`
        INSERT INTO users (phone, avatar_url)
        VALUES (${phone}, ${avatarFor(phone)})
        RETURNING *
      `
    )[0];
  const user = toUser(row);
  return { token: signToken(user.id), user, needsProfile: user.needsProfile };
}

const APPLE_AUDIENCES = new Set(['com.hockeyver.app', 'host.exp.Exponent']);

function decodeJwtPart(part) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

export async function signInWithApple(identityToken, name) {
  const token = String(identityToken ?? '').trim();
  const parts = token.split('.');
  if (parts.length !== 3) throw new HttpError(401, 'La connexion Apple a échoué.');
  let header;
  let payload;
  try {
    header = decodeJwtPart(parts[0]);
    payload = decodeJwtPart(parts[1]);
  } catch {
    throw new HttpError(401, 'La connexion Apple a échoué.');
  }
  if (header.alg !== 'RS256' || !header.kid) throw new HttpError(401, 'La connexion Apple a échoué.');

  const keysResponse = await fetch('https://appleid.apple.com/auth/keys');
  if (!keysResponse.ok) throw new HttpError(502, 'Apple est injoignable. Réessayez.');
  const keysBody = await keysResponse.json();
  const jwk = (keysBody.keys ?? []).find((key) => key.kid === header.kid);
  if (!jwk) throw new HttpError(401, 'La connexion Apple a échoué.');

  let valid = false;
  try {
    valid = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(parts[2], 'base64url'),
    );
  } catch {
    throw new HttpError(401, 'La connexion Apple a échoué.');
  }
  const expired = !payload.exp || payload.exp < Math.floor(Date.now() / 1000);
  if (!valid || payload.iss !== 'https://appleid.apple.com' || !APPLE_AUDIENCES.has(payload.aud) || !payload.sub || expired) {
    throw new HttpError(401, 'La connexion Apple a échoué.');
  }

  await ready();
  const existing = await sql()`SELECT * FROM users WHERE apple_sub = ${payload.sub} LIMIT 1`;
  const firstName = String(name?.firstName ?? '').trim().slice(0, 40);
  const lastName = String(name?.lastName ?? '').trim().slice(0, 40);
  const row =
    existing[0] ??
    (
      await sql()`
        INSERT INTO users (apple_sub, first_name, last_name, avatar_url)
        VALUES (${payload.sub}, ${firstName}, ${lastName}, ${avatarFor(payload.sub)})
        RETURNING *
      `
    )[0];
  const user = toUser(row);
  return { token: signToken(user.id), user, needsProfile: user.needsProfile };
}

export async function currentUser(authorization) {
  await ready();
  const userId = readUserId(authorization);
  const rows = await sql()`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  if (!rows[0]) throw new HttpError(401, 'Session expirée.');
  const user = toUser(rows[0]);
  return { user, needsProfile: user.needsProfile };
}

export async function saveProfile(authorization, input) {
  await ready();
  const userId = readUserId(authorization);
  const firstName = String(input?.firstName ?? '').trim();
  const lastName = String(input?.lastName ?? '').trim();
  const username = String(input?.username ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  const favoriteTeamId = String(input?.favoriteTeamId ?? '').trim();
  const current = await sql()`SELECT bio FROM users WHERE id = ${userId} LIMIT 1`;
  if (!current[0]) throw new HttpError(401, 'Session expirée.');
  const bio = input?.bio === undefined ? current[0].bio : String(input.bio).trim();

  if (firstName.length < 1 || firstName.length > 40) throw new HttpError(400, 'Entrez votre prénom.');
  if (lastName.length > 40) throw new HttpError(400, 'Le nom est trop long.');
  if (!/^[a-z0-9._]{3,20}$/.test(username)) {
    throw new HttpError(400, 'Le pseudo doit contenir 3 à 20 lettres, chiffres, points ou tirets bas.');
  }
  if (!/^[A-Z]{2,3}$/.test(favoriteTeamId)) throw new HttpError(400, 'Choisissez votre équipe favorite.');

  const taken = await sql()`SELECT id FROM users WHERE username = ${username} AND id <> ${userId} LIMIT 1`;
  if (taken[0]) throw new HttpError(409, 'Ce pseudo est déjà utilisé.');

  const rows = await sql()`
    UPDATE users
    SET first_name = ${firstName},
        last_name = ${lastName},
        username = ${username},
        favorite_team_id = ${favoriteTeamId},
        bio = ${bio},
        avatar_url = ${avatarFor(username)}
    WHERE id = ${userId}
    RETURNING *
  `;
  if (!rows[0]) throw new HttpError(401, 'Session expirée.');
  const user = toUser(rows[0]);
  return { user, needsProfile: user.needsProfile };
}

export async function deleteAccount(authorization) {
  await ready();
  const userId = readUserId(authorization);
  const rows = await sql()`DELETE FROM users WHERE id = ${userId} RETURNING id`;
  if (!rows[0]) throw new HttpError(401, 'Session expirée.');
  return { deleted: true };
}

export async function health() {
  await ready();
  const rows = await sql()`SELECT 1 AS ok`;
  return { ok: rows[0]?.ok === 1 };
}
