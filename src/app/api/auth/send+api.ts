import { sendOtp } from '../../../../server/auth.mjs';
import { jsonResult } from '../../../../server/route.mjs';

export function POST(request: Request) {
  return jsonResult(request.json().then((body) => sendOtp(body?.phone)));
}
