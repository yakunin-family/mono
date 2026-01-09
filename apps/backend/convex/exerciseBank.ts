import { v } from "convex/values";
import invariant from "tiny-invariant";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { libraryItemTypeValidator } from "./schema";

/**
 * Save an item to the library
 */
export const saveItem = mutation({
  args: {
    title: v.string(),
    type: libraryItemTypeValidator,
    content: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const now = Date.now();
    const itemId = await ctx.db.insert("library", {
      ownerId: user._id,
      title: args.title,
      type: args.type,
      content: args.content,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    return itemId;
  },
});

/**
 * Save an exercise to the library (convenience wrapper)
 */
export const saveExercise = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const now = Date.now();
    const exerciseId = await ctx.db.insert("library", {
      ownerId: user._id,
      title: args.title,
      type: "exercise",
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    return exerciseId;
  },
});

/**
 * Get all library items owned by the current user, optionally filtered by type
 */
export const getMyItems = query({
  args: {
    type: v.optional(libraryItemTypeValidator),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    let items;
    if (args.type) {
      items = await ctx.db
        .query("library")
        .withIndex("by_owner_type", (q) =>
          q.eq("ownerId", user._id).eq("type", args.type!)
        )
        .collect();
    } else {
      items = await ctx.db
        .query("library")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get all exercises owned by the current user, ordered by most recently created
 */
export const getMyExercises = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    const exercises = await ctx.db
      .query("library")
      .withIndex("by_owner_type", (q) =>
        q.eq("ownerId", user._id).eq("type", "exercise")
      )
      .collect();

    return exercises.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single library item by ID
 */
export const getItem = query({
  args: {
    itemId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const item = await ctx.db.get(args.itemId);

    invariant(item, "Item not found");
    invariant(
      item.ownerId === user._id,
      "Not authorized to access this item",
    );

    return item;
  },
});

/**
 * Get a single exercise by ID (convenience wrapper)
 */
export const getExercise = query({
  args: {
    exerciseId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const exercise = await ctx.db.get(args.exerciseId);

    invariant(exercise, "Exercise not found");
    invariant(
      exercise.ownerId === user._id,
      "Not authorized to access this exercise",
    );

    return exercise;
  },
});

/**
 * Update library item title
 */
export const updateItemTitle = mutation({
  args: {
    itemId: v.id("library"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const item = await ctx.db.get(args.itemId);

    invariant(item, "Item not found");
    invariant(
      item.ownerId === user._id,
      "Not authorized to modify this item",
    );

    await ctx.db.patch(args.itemId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update exercise title (convenience wrapper)
 */
export const updateExerciseTitle = mutation({
  args: {
    exerciseId: v.id("library"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const exercise = await ctx.db.get(args.exerciseId);

    invariant(exercise, "Exercise not found");
    invariant(
      exercise.ownerId === user._id,
      "Not authorized to modify this exercise",
    );

    await ctx.db.patch(args.exerciseId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a library item
 */
export const deleteItem = mutation({
  args: {
    itemId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const item = await ctx.db.get(args.itemId);

    invariant(item, "Item not found");
    invariant(
      item.ownerId === user._id,
      "Not authorized to delete this item",
    );

    await ctx.db.delete(args.itemId);
  },
});

/**
 * Delete an exercise (convenience wrapper)
 */
export const deleteExercise = mutation({
  args: {
    exerciseId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const exercise = await ctx.db.get(args.exerciseId);

    invariant(exercise, "Exercise not found");
    invariant(
      exercise.ownerId === user._id,
      "Not authorized to delete this exercise",
    );

    await ctx.db.delete(args.exerciseId);
  },
});
