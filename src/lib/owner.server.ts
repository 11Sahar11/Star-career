/**
 * Accounts that get admin tools in STAR. Server-only: never import from client code.
 *
 * An address counts only when the session's email is VERIFIED (Google sign-in
 * verifies it). A password sign-up is never verified here, so nobody can claim
 * an owner address just by registering it first.
 *
 * The list comes only from ADMIN_EMAILS (comma-separated) in the deploy
 * environment; nothing is hardcoded. Unset = nobody is admin.
 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}
