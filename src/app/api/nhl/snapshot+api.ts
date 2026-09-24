import { loadOfficialBoard } from '../../../services/nhl/nhl.live';
import { jsonResult } from '../../../../server/route.mjs';

export function GET() {
  return jsonResult(loadOfficialBoard());
}
