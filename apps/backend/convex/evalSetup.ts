import { httpAction } from "./_generated/server";
import { internalMutation } from "./_generated/server";

/**
 * Generate a random string for cleanup tokens
 */
function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Verify signed eval request
 * Simple API key check for now - can be enhanced with HMAC signing later
 */
async function verifyEvalRequest(request: Request): Promise<boolean> {
  const apiKey = request.headers.get("X-Eval-Api-Key");
  const expectedKey = process.env.EVAL_API_KEY;

  if (!apiKey || !expectedKey) {
    return false;
  }

  // Simple API key comparison for now
  // TODO: Implement HMAC signing with timestamp and nonce
  return apiKey === expectedKey;
}

/**
 * Clean up existing eval test data
 * Deletes any data marked as eval (cleanupToken starts with "eval-")
 */
async function cleanupExistingEvalData(ctx: any) {
  // Find all eval user profiles
  const evalProfiles = await ctx.db
    .query("userProfile")
    .filter((q: any) =>
      q.or(
        q.eq(q.field("userId"), "eval-teacher"),
        q.eq(q.field("userId"), "eval-student"),
      ),
    )
    .collect();

  for (const profile of evalProfiles) {
    // Delete spaces where this user is teacher or student
    const teacherSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher", (q: any) => q.eq("teacherId", profile.userId))
      .collect();

    const studentSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_student", (q: any) => q.eq("studentId", profile.userId))
      .collect();

    const allSpaces = [...teacherSpaces, ...studentSpaces];

    for (const space of allSpaces) {
      // Delete documents in this space
      const documents = await ctx.db
        .query("document")
        .withIndex("by_space", (q: any) => q.eq("spaceId", space._id))
        .collect();

      for (const doc of documents) {
        await ctx.db.delete(doc._id);
      }

      // Delete homework items in this space
      const homeworkItems = await ctx.db
        .query("homeworkItems")
        .withIndex("by_space", (q: any) => q.eq("spaceId", space._id))
        .collect();

      for (const item of homeworkItems) {
        await ctx.db.delete(item._id);
      }

      // Delete the space
      await ctx.db.delete(space._id);
    }

    // Delete the user profile
    await ctx.db.delete(profile._id);
  }
}

/**
 * Create eval test data
 * Returns teacherId, studentId, spaceId, and documentId
 */
async function createEvalTestData(ctx: any) {
  const now = Date.now();

  // Create eval teacher user profile
  await ctx.db.insert("userProfile", {
    userId: "eval-teacher",
    name: "Eval Teacher",
    pictureUrl: undefined,
    createdAt: now,
    isTeacher: true,
    isStudent: false,
  });

  // Create eval student user profile
  await ctx.db.insert("userProfile", {
    userId: "eval-student",
    name: "Eval Student",
    pictureUrl: undefined,
    createdAt: now,
    isTeacher: false,
    isStudent: true,
  });

  // Create space linking teacher and student
  const spaceId = await ctx.db.insert("spaces", {
    teacherId: "eval-teacher",
    studentId: "eval-student",
    language: "English",
    createdAt: now,
  });

  // Create a test document in the space
  const documentId = await ctx.db.insert("document", {
    spaceId,
    lessonNumber: 1,
    title: "Eval Test Document",
    createdAt: now,
    updatedAt: now,
  });

  return {
    teacherId: "eval-teacher",
    studentId: "eval-student",
    spaceId,
    documentId,
  };
}

/**
 * Setup eval test environment
 * Secured with API key, disabled in production by default
 */
export const setupEvalEnvironment = httpAction(async (ctx, request) => {
  // 1. Verify API key
  const isValid = await verifyEvalRequest(request);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing API key" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // 2. Environment protection - disabled in production by default
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.ENABLE_EVAL_IN_PROD
  ) {
    return new Response(
      JSON.stringify({ error: "Eval endpoints disabled in production" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // 3. Clean up any existing eval data first
    await cleanupExistingEvalData(ctx);

    // 4. Create fresh test data
    const testData = await createEvalTestData(ctx);

    // 5. Generate cleanup token (for future enhancement)
    const cleanupToken = `eval-${Date.now()}-${generateRandomString(8)}`;

    return new Response(
      JSON.stringify({
        ...testData,
        cleanupToken,
        message: "Eval test environment setup complete",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Eval setup error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to setup eval environment",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * Cleanup eval environment
 * Can be called after evals complete or for manual cleanup
 */
export const cleanupEvalEnvironment = httpAction(async (ctx, request) => {
  // 1. Verify API key
  const isValid = await verifyEvalRequest(request);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing API key" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // 2. Clean up all eval data
    await cleanupExistingEvalData(ctx);

    return new Response(
      JSON.stringify({
        message: "Eval environment cleanup complete",
        cleaned: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Eval cleanup error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to cleanup eval environment",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * Scheduled function to clean up old eval data (>24 hours old)
 * Runs automatically via Convex scheduler
 */
export const cleanupOldEvalData = internalMutation({
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Find eval user profiles created more than 24 hours ago
    const oldEvalProfiles = await ctx.db
      .query("userProfile")
      .filter((q: any) =>
        q.and(
          q.or(
            q.eq(q.field("userId"), "eval-teacher"),
            q.eq(q.field("userId"), "eval-student"),
          ),
          q.lt(q.field("createdAt"), twentyFourHoursAgo),
        ),
      )
      .collect();

    let cleanedCount = 0;

    for (const profile of oldEvalProfiles) {
      // Clean up related data (similar to cleanupExistingEvalData)
      const teacherSpaces = await ctx.db
        .query("spaces")
        .withIndex("by_teacher", (q: any) => q.eq("teacherId", profile.userId))
        .collect();

      const studentSpaces = await ctx.db
        .query("spaces")
        .withIndex("by_student", (q: any) => q.eq("studentId", profile.userId))
        .collect();

      const allSpaces = [...teacherSpaces, ...studentSpaces];

      for (const space of allSpaces) {
        // Delete documents
        const documents = await ctx.db
          .query("document")
          .withIndex("by_space", (q: any) => q.eq("spaceId", space._id))
          .collect();

        for (const doc of documents) {
          await ctx.db.delete(doc._id);
        }

        // Delete homework items
        const homeworkItems = await ctx.db
          .query("homeworkItems")
          .withIndex("by_space", (q: any) => q.eq("spaceId", space._id))
          .collect();

        for (const item of homeworkItems) {
          await ctx.db.delete(item._id);
        }

        await ctx.db.delete(space._id);
      }

      await ctx.db.delete(profile._id);
      cleanedCount++;
    }

    console.log(`Cleaned up ${cleanedCount} old eval profiles`);
    return { cleanedCount };
  },
});
