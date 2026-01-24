import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";

import { action, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  pictureUrl?: string;
}

/**
 * Query that requires authentication.
 * Throws "Not authenticated" if user is not logged in.
 * Provides ctx.user with the authenticated user.
 */
export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const user: AuthUser = {
      id: authUser._id,
      email: authUser.email ?? undefined,
      name: authUser.name ?? undefined,
      pictureUrl: authUser.image ?? undefined,
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
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const user: AuthUser = {
      id: authUser._id,
      email: authUser.email ?? undefined,
      name: authUser.name ?? undefined,
      pictureUrl: authUser.image ?? undefined,
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
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new ConvexError("Not authenticated");
    }
    const user: AuthUser = {
      id: authUser._id,
      email: authUser.email ?? undefined,
      name: authUser.name ?? undefined,
      pictureUrl: authUser.image ?? undefined,
    };
    return { user };
  }),
);
