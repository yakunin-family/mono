import { ConvexError } from "convex/values";

import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  pictureUrl?: string;
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
    pictureUrl: identity.pictureUrl,
  };
}

/**
 * Get the authenticated user or throw if not authenticated.
 * Use this in protected endpoints.
 */
export async function requireAuth(ctx: Ctx): Promise<AuthUser> {
  const user = await getAuthUser(ctx);
  if (!user) {
    throw new ConvexError("Not authenticated");
  }
  return user;
}
