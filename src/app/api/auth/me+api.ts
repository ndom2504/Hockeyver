import { currentUser } from '../../../../server/auth.mjs';
import { jsonResult } from '../../../../server/route.mjs';

export function GET(request: Request) {
  return jsonResult(currentUser(request.headers.get('authorization')));
}
