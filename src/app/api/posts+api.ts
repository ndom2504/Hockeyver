import { listPosts, publishPost, removePost } from '../../../server/posts.mjs';
import { jsonResult } from '../../../server/route.mjs';

export function GET() {
  return jsonResult(listPosts());
}

export function POST(request: Request) {
  return jsonResult(
    request.json().then((body) => publishPost(request.headers.get('authorization'), body)),
  );
}

export function DELETE(request: Request) {
  return jsonResult(
    request.json().then((body: { id?: string }) => removePost(request.headers.get('authorization'), body?.id)),
  );
}
