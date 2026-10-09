import type { Access, FieldAccess } from 'payload';

type Role = 'admin' | 'editor';
const hasRole = (user: unknown, role: Role) => Boolean(user && (user as { roles?: Role[] }).roles?.includes(role));

export const isAdmin: Access & FieldAccess = ({ req: { user } }) => hasRole(user, 'admin');
export const isStaff: Access = ({ req: { user } }) => hasRole(user, 'admin') || hasRole(user, 'editor');
/** Published content is readable by anyone (needed by the static-site sync); drafts only by staff. */
export const publicRead: Access = ({ req: { user } }) =>
  hasRole(user, 'admin') || hasRole(user, 'editor') ? true : { _status: { equals: 'published' } };
