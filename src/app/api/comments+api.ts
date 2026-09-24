import { publishComment, removeComment } from '../../../server/posts.mjs';
import { jsonResult } from '../../../server/route.mjs';

export function POST(request: Request) {
  return jsonResult(request.json().then((body) => publishComment(request.headers.get('authorization'), body)));
}

export function DELETE(request: Request) {
  return jsonResult(
    request.json().then((body: { id?: string }) => removeComment(request.headers.get('authorization'), body?.id)),
  );
}
