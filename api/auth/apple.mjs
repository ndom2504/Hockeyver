import { signInWithApple } from '../../../server/auth.mjs';
import { applyCors, finish } from '../../../server/vercel.mjs';

export default function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  return finish(res, signInWithApple(req.body?.identityToken, { firstName: req.body?.firstName, lastName: req.body?.lastName }));
}
