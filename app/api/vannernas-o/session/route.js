import {createSession} from '../../../../features/vannernas-o/server/session.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export function POST(request){return createSession(request,process.env)}
