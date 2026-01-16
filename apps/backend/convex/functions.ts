import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import invariant from "tiny-invariant";

import { action, mutation, query } from "./_generated/server";
import type { AuthUser } from "./auth";

/**
 * Query that requires authentication.
 * Throws "Not authenticated" if user is not logged in.
 * Provides ctx.user with the authenticated user.
 */
export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    invariant(identity, "Not authenticated");
    const user: AuthUser = {
      id: identity.subject,
      email: identity.email,
      name: identity.name,
      pictureUrl: identity.pictureUrl,
    };
    return { user };
  }),
);

/**
 * Mutation that requires authentication.
 * Throws "Not authenticated" if user is not logged in.
 * Provides ctx.user with the authenticated user.
 */
export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    invariant(identity, "Not authenticated");
    const user: AuthUser = {
      id: identity.subject,
      email: identity.email,
      name: identity.name,
      pictureUrl: identity.pictureUrl,
    };
    return { user };
  }),
);

/**
 * Action that requires authentication.
 * Throws "Not authenticated" if user is not logged in.
 * Provides ctx.user with the authenticated user.
 */
export const authedAction = customAction(
  action,
  customCtx(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    invariant(identity, "Not authenticated");
    const user: AuthUser = {
      id: identity.subject,
      email: identity.email,
      name: identity.name,
      pictureUrl: identity.pictureUrl,
    };
    return { user };
  }),
);
