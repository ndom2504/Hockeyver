import { listPosts, publishPost, removePost } from '../server/posts.mjs';
import { applyCors, finish, readJson } from '../server/vercel.mjs';

export default function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return finish(res, listPosts());
  if (req.method === 'POST') return finish(res, publishPost(req.headers.authorization, readJson(req)));
  if (req.method === 'DELETE') return finish(res, removePost(req.headers.authorization, readJson(req).id));
  return res.status(405).json({ error: 'Méthode non autorisée.' });
}
