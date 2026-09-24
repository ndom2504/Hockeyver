import { saveProfile } from '../../../../server/auth.mjs';
import { jsonResult } from '../../../../server/route.mjs';

export function POST(request: Request) {
  return jsonResult(request.json().then((body) => saveProfile(request.headers.get('authorization'), body)));
}
