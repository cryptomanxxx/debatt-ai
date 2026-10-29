import {getStatus} from '../../../../features/vannernas-o/server/session.mjs';
export const dynamic='force-dynamic';
export function GET(){return getStatus(process.env)}
