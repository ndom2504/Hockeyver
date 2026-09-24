import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { currentUser, deleteAccount, health, saveProfile, sendOtp, signInWithApple, verifyOtp } from './auth.mjs';
import { listPosts, publishComment, publishPost, removeComment, removePost, toggleReaction } from './posts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = readFileSync(resolve(root, '.env'), 'utf8');
for (const line of envFile.split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
  const index = line.indexOf('=');
  const key = line.slice(0, index).trim();
  const value = line.slice(index + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

const routes = new Map([
  ['POST /api/auth/send', (body) => sendOtp(body.phone)],
  ['POST /api/auth/verify', (body) => verifyOtp(body.phone, body.code)],
  ['POST /api/auth/apple', (body) => signInWithApple(body.identityToken, body)],
  ['POST /api/auth/profile', (body, authorization) => saveProfile(authorization, body)],
  ['GET /api/auth/me', (_body, authorization) => currentUser(authorization)],
  ['DELETE /api/auth/account', (_body, authorization) => deleteAccount(authorization)],
  ['GET /api/posts', () => listPosts()],
  ['POST /api/posts', (body, authorization) => publishPost(authorization, body)],
  ['DELETE /api/posts', (body, authorization) => removePost(authorization, body?.id)],
  ['POST /api/comments', (body, authorization) => publishComment(authorization, body)],
  ['DELETE /api/comments', (body, authorization) => removeComment(authorization, body?.id)],
  ['POST /api/reactions', (body, authorization) => toggleReaction(authorization, body)],
  ['GET /api/health', () => health()],
]);

const port = Number(process.env.PORT || 8787);
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', 'http://localhost');
  const handler = routes.get(`${req.method} ${url.pathname}`);
  if (!handler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Introuvable.' }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  let body = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Requête invalide.' }));
      return;
    }
  }
  try {
    const result = await handler(body, req.headers.authorization);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (error) {
    const status = error.status || 500;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: status === 500 ? 'Erreur serveur.' : error.message }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`HOCKEYVER API http://0.0.0.0:${port}`);
});
