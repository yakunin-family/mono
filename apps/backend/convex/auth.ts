import invariant from "tiny-invariant";

import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

type Ctx = QueryCtx | MutationCtx | ActionCtx;

/**
 * Get the authenticated user from WorkOS JWT.
 * Returns the user identity if authenticated, null otherwise.
 */
export async function getAuthUser(ctx: Ctx): Promise<AuthUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return {
    id: identity.subject,
    email: identity.email,
    name: identity.name,
  };
}

/**
 * Get the authenticated user or throw if not authenticated.
 * Use this in protected endpoints.
 */
export async function requireAuth(ctx: Ctx): Promise<AuthUser> {
  const user = await getAuthUser(ctx);
  invariant(user, "Not authenticated");
  return user;
}
