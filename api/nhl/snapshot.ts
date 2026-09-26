import { loadOfficialBoard } from '../../src/services/nhl/nhl.live';
import { applyCors, finish } from '../../server/vercel.mjs';

type NodeRequest = { method?: string };
type NodeResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { end: () => void; json: (body: unknown) => void };
};

export default function handler(req: NodeRequest, res: NodeResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée.' });
  return finish(res, loadOfficialBoard());
}
