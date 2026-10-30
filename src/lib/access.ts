import { createMiddleware, createServerFn } from "@tanstack/react-start";

export type ViewerAccess = { signedIn: boolean; email: string | null; verified: boolean; admin: boolean };

const SIGNED_OUT: ViewerAccess = { signedIn: false, email: null, verified: false, admin: false };

// Forwards the live-preview bearer token (partitioned iframe cookies), like authMiddleware does.
const sessionMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("./auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next }) => {
    const { assertSameSiteRequest } = await import("./auth/isolation.server");
    assertSameSiteRequest();
    return next();
  });

/** Who is signed in, and whether they get the admin tools. Decided on the server only. */
export const getViewerAccess = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<ViewerAccess> => {
    const { getSessionUser } = await import("./auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    if (!user) return SIGNED_OUT;
    const { getSql } = await import("./db");
    const { isOwnerEmail } = await import("./owner.server");
    const sql = await getSql();
    const rows = await sql<{ emailVerified: boolean }>`select "emailVerified" from "user" where id = ${user.id}`;
    const verified = rows[0]?.emailVerified === true;
    return { signedIn: true, email: user.email, verified, admin: verified && isOwnerEmail(user.email) };
  });

/**
 * Deletes the signed-in account and everything stored for it on the server
 * (Google Play requires in-app account deletion). The career itself lives on
 * the device and is not touched.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<{ deleted: boolean }> => {
    const { getSessionUser } = await import("./auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    if (!user) return { deleted: false };
    const { getSql } = await import("./db");
    const sql = await getSql();
    await sql`delete from "session" where "userId" = ${user.id}`;
    await sql`delete from "account" where "userId" = ${user.id}`;
    await sql`delete from "verification" where "identifier" = ${user.email ?? ""}`;
    await sql`delete from "user" where id = ${user.id}`;
    return { deleted: true };
  });

/** Just the admin bit, decided on the server against the verified session. Signed out or unlisted = false. */
export const getIsAdmin = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { getSessionUser } = await import("./auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    if (!user) return { isAdmin: false };
    const { getSql } = await import("./db");
    const { isOwnerEmail } = await import("./owner.server");
    const sql = await getSql();
    const rows = await sql<{ emailVerified: boolean }>`select "emailVerified" from "user" where id = ${user.id}`;
    return { isAdmin: rows[0]?.emailVerified === true && isOwnerEmail(user.email) };
  });
