import { verifyOtp } from '../../../../server/auth.mjs';
import { jsonResult } from '../../../../server/route.mjs';

export function POST(request: Request) {
  return jsonResult(request.json().then((body) => verifyOtp(body?.phone, body?.code)));
}
