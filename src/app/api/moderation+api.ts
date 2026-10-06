import { submitModeration } from '../../../server/moderation.mjs';
import { jsonResult } from '../../../server/route.mjs';

export function POST(request: Request) {
  return jsonResult(
    request.json().then((body) => submitModeration(request.headers.get('authorization'), body)),
  );
}
