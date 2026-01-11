import { generateObject } from "ai";
import { v } from "convex/values";
import invariant from "tiny-invariant";

import { action } from "./_generated/server";
import { buildAutoTagPrompt } from "./_generated_prompts";
import { authedMutation, authedQuery } from "./functions";
import { libraryItemTypeValidator, libraryMetadataValidator } from "./schema";
import {
  autoTagResponseSchema,
  processAutoTagResponse,
  type ProcessedMetadata,
} from "./validators/libraryAutoTag";

/**
 * Save an item to the library
 */
export const saveItem = authedMutation({
  args: {
    title: v.string(),
    type: libraryItemTypeValidator,
    content: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const itemId = await ctx.db.insert("library", {
      ownerId: ctx.user.id,
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
export const saveExercise = authedMutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const exerciseId = await ctx.db.insert("library", {
      ownerId: ctx.user.id,
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
export const getMyItems = authedQuery({
  args: {
    type: v.optional(libraryItemTypeValidator),
  },
  handler: async (ctx, args) => {
    let items;
    if (args.type) {
      items = await ctx.db
        .query("library")
        .withIndex("by_owner_type", (q) =>
          q.eq("ownerId", ctx.user.id).eq("type", args.type!)
        )
        .collect();
    } else {
      items = await ctx.db
        .query("library")
        .withIndex("by_owner", (q) => q.eq("ownerId", ctx.user.id))
        .collect();
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get all exercises owned by the current user, ordered by most recently created
 */
export const getMyExercises = authedQuery({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db
      .query("library")
      .withIndex("by_owner_type", (q) =>
        q.eq("ownerId", ctx.user.id).eq("type", "exercise")
      )
      .collect();

    return exercises.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single library item by ID
 */
export const getItem = authedQuery({
  args: {
    itemId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);

    invariant(item, "Item not found");
    invariant(
      item.ownerId === ctx.user.id,
      "Not authorized to access this item"
    );

    return item;
  },
});

/**
 * Get a single exercise by ID (convenience wrapper)
 */
export const getExercise = authedQuery({
  args: {
    exerciseId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);

    invariant(exercise, "Exercise not found");
    invariant(
      exercise.ownerId === ctx.user.id,
      "Not authorized to access this exercise"
    );

    return exercise;
  },
});

/**
 * Update library item title
 */
export const updateItemTitle = authedMutation({
  args: {
    itemId: v.id("library"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);

    invariant(item, "Item not found");
    invariant(
      item.ownerId === ctx.user.id,
      "Not authorized to modify this item"
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
export const updateExerciseTitle = authedMutation({
  args: {
    exerciseId: v.id("library"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);

    invariant(exercise, "Exercise not found");
    invariant(
      exercise.ownerId === ctx.user.id,
      "Not authorized to modify this exercise"
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
export const deleteItem = authedMutation({
  args: {
    itemId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);

    invariant(item, "Item not found");
    invariant(
      item.ownerId === ctx.user.id,
      "Not authorized to delete this item"
    );

    await ctx.db.delete(args.itemId);
  },
});

/**
 * Delete an exercise (convenience wrapper)
 */
export const deleteExercise = authedMutation({
  args: {
    exerciseId: v.id("library"),
  },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);

    invariant(exercise, "Exercise not found");
    invariant(
      exercise.ownerId === ctx.user.id,
      "Not authorized to delete this exercise"
    );

    await ctx.db.delete(args.exerciseId);
  },
});

// ============================================================================
// METADATA AND AUTO-TAGGING
// ============================================================================

/**
 * Build searchText from item fields for text search
 */
function buildSearchText(
  title: string,
  description?: string,
  metadata?: { topic?: string; tags?: string[] }
): string {
  const parts = [title.toLowerCase()];
  if (description) {
    parts.push(description.toLowerCase());
  }
  if (metadata?.topic) {
    parts.push(metadata.topic.toLowerCase());
  }
  if (metadata?.tags) {
    parts.push(...metadata.tags.map((t) => t.toLowerCase()));
  }
  return parts.join(" ");
}

/**
 * Auto-tag content using AI
 * Analyzes the content and returns suggested metadata
 */
export const autoTagContent = action({
  args: {
    content: v.string(),
  },
  returns: v.object({
    language: v.optional(v.string()),
    levels: v.optional(v.array(v.string())),
    topic: v.optional(v.string()),
    exerciseTypes: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    autoTagged: v.boolean(),
  }),
  handler: async (_ctx, args): Promise<ProcessedMetadata> => {
    try {
      const promptText = buildAutoTagPrompt({ content: args.content });

      const result = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: autoTagResponseSchema,
        prompt: promptText,
      });

      return processAutoTagResponse(result.object);
    } catch (error) {
      console.error("Auto-tagging failed:", error);
      return {
        language: undefined,
        levels: undefined,
        topic: undefined,
        exerciseTypes: undefined,
        tags: undefined,
        autoTagged: false,
      };
    }
  },
});

/**
 * Save an item with metadata to the library
 */
export const saveItemWithMetadata = authedMutation({
  args: {
    title: v.string(),
    type: libraryItemTypeValidator,
    content: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(libraryMetadataValidator),
  },
  handler: async (ctx, args) => {
    const searchText = buildSearchText(
      args.title,
      args.description,
      args.metadata
    );

    const now = Date.now();
    const itemId = await ctx.db.insert("library", {
      ownerId: ctx.user.id,
      title: args.title,
      type: args.type,
      content: args.content,
      description: args.description,
      metadata: args.metadata,
      searchText,
      createdAt: now,
      updatedAt: now,
    });

    return itemId;
  },
});

/**
 * Update metadata for a library item
 */
export const updateItemMetadata = authedMutation({
  args: {
    itemId: v.id("library"),
    metadata: libraryMetadataValidator,
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);

    invariant(item, "Item not found");
    invariant(item.ownerId === ctx.user.id, "Not authorized to modify this item");

    const searchText = buildSearchText(item.title, item.description, args.metadata);

    await ctx.db.patch(args.itemId, {
      metadata: args.metadata,
      searchText,
      updatedAt: Date.now(),
    });
  },
});
