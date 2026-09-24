import { deleteAccount } from '../../../../server/auth.mjs';
import { jsonResult } from '../../../../server/route.mjs';

export function DELETE(request: Request) {
  return jsonResult(deleteAccount(request.headers.get('authorization')));
}
