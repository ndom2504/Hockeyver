import { submitModeration } from '../server/moderation.mjs';
import { applyCors, finish, readJson } from '../server/vercel.mjs';

export default function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  return finish(res, submitModeration(req.headers.authorization, readJson(req)));
}
