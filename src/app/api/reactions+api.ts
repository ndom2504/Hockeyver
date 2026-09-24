import { toggleReaction } from '../../../server/posts.mjs';
import { jsonResult } from '../../../server/route.mjs';

export function POST(request: Request) {
  return jsonResult(request.json().then((body) => toggleReaction(request.headers.get('authorization'), body)));
}
