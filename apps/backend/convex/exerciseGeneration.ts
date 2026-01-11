import { generateObject } from "ai";
import { v } from "convex/values";
import invariant from "tiny-invariant";

import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import {
  buildGenerationPrompt,
  buildPlanningPrompt,
  buildValidationPrompt,
} from "./_generated_prompts";
import { hasDocumentAccess } from "./accessControl";
import { authedMutation, authedQuery } from "./functions";
import {
  generationResponseSchema,
  planningResponseSchema,
  validationResponseSchema,
} from "./validators/exerciseGeneration";

/**
 * Start a new exercise generation session
 * Creates a session and immediately runs validation step
 */
export const startExerciseGeneration = authedMutation({
  args: {
    documentId: v.id("document"),
    promptText: v.string(),
    model: v.string(), // e.g., "openai/gpt-4o" or "anthropic/claude-3-5-sonnet"
  },
  returns: v.object({ sessionId: v.id("exerciseGenerationSession") }),
  handler: async (ctx, args) => {
    const documentId = args.documentId;

    // Verify document access
    const hasAccess = await hasDocumentAccess(ctx, documentId, ctx.user.id);
    invariant(hasAccess, "Not authorized to access this document");

    const now = Date.now();

    // Create the generation session
    const sessionId = await ctx.db.insert("exerciseGenerationSession", {
      documentId,
      userId: ctx.user.id,
      initialPrompt: args.promptText,
      model: args.model,
      currentStep: "validating",
      createdAt: now,
      updatedAt: now,
    });

    // Schedule the validation action to run
    await ctx.scheduler.runAfter(0, internal.exerciseGeneration.runValidation, {
      sessionId: sessionId as string,
    });

    return { sessionId };
  },
});

/**
 * Run the validation step (internal action)
 */
export const runValidation = internalAction({
  args: {
    sessionId: v.string(),
    previousClarifications: v.optional(v.string()), // JSON string
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;

    // Get the session
    const session = await ctx.runQuery(
      internal.exerciseGeneration.getSessionForAction,
      { sessionId }
    );
    invariant(session, "Session not found");

    try {
      // Create validation step record
      const stepId = await ctx.runMutation(
        internal.exerciseGeneration.createStep,
        {
          sessionId,
          stepType: "validation",
          input: JSON.stringify({
            userPrompt: session.initialPrompt,
            previousClarifications: args.previousClarifications,
          }),
        }
      );

      // Load prompt template
      const promptText = buildValidationPrompt({
        userPrompt: session.initialPrompt,
        previousClarifications: args.previousClarifications,
      });

      // Call AI with structured output
      const result = await generateObject({
        model: session.model,
        schema: validationResponseSchema,
        prompt: promptText,
      });

      const validationResult = result.object;

      // Update step with output
      await ctx.runMutation(internal.exerciseGeneration.completeStep, {
        stepId: stepId as string,
        output: JSON.stringify(validationResult),
        tokensUsed: result.usage?.totalTokens,
      });

      // Update session based on validation result
      if (validationResult.status === "ready") {
        // Requirements are complete, move to planning
        await ctx.runMutation(
          internal.exerciseGeneration.updateSessionRequirements,
          {
            sessionId: sessionId as string,
            requirements: validationResult.extractedRequirements,
            newStep: "planning",
          }
        );

        // Schedule planning step
        await ctx.scheduler.runAfter(
          0,
          internal.exerciseGeneration.runPlanning,
          {
            sessionId: sessionId as string,
          }
        );
      } else {
        // Need clarification from user
        await ctx.runMutation(internal.exerciseGeneration.updateSessionStep, {
          sessionId: sessionId as string,
          newStep: "awaiting_clarification",
        });
      }
    } catch (error) {
      // Mark session as failed
      await ctx.runMutation(internal.exerciseGeneration.failSession, {
        sessionId: sessionId as string,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

/**
 * User provides answers to clarification questions
 */
export const answerClarifications = authedMutation({
  args: {
    sessionId: v.id("exerciseGenerationSession"),
    answers: v.string(), // JSON string of { questionId: answer }
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId;

    const session = await ctx.db.get(sessionId);
    invariant(session, "Session not found");
    invariant(session.userId === ctx.user.id, "Not authorized");
    invariant(
      session.currentStep === "awaiting_clarification",
      "Session not awaiting clarification"
    );

    // Update session step
    await ctx.db.patch(sessionId, {
      currentStep: "validating",
      updatedAt: Date.now(),
    });

    // Re-run validation with answers
    await ctx.scheduler.runAfter(0, internal.exerciseGeneration.runValidation, {
      sessionId: sessionId as string,
      previousClarifications: args.answers,
    });

    return { success: true };
  },
});

/**
 * Run the planning step (internal action)
 */
export const runPlanning = internalAction({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;

    // Get the session
    const session = await ctx.runQuery(
      internal.exerciseGeneration.getSessionForAction,
      { sessionId }
    );
    invariant(session, "Session not found");
    invariant(session.requirements, "Requirements not set");

    try {
      // Create planning step record
      const stepId = await ctx.runMutation(
        internal.exerciseGeneration.createStep,
        {
          sessionId,
          stepType: "planning",
          input: JSON.stringify(session.requirements),
        }
      );

      // Build planning prompt
      const promptText = buildPlanningPrompt({
        requirements: JSON.stringify(session.requirements),
      });

      // Call AI with structured output
      const result = await generateObject({
        model: session.model,
        schema: planningResponseSchema,
        prompt: promptText,
      });

      const plan = result.object;

      // Update step with output
      await ctx.runMutation(internal.exerciseGeneration.completeStep, {
        stepId: stepId as string,
        output: JSON.stringify(plan),
        tokensUsed: result.usage?.totalTokens,
      });

      // Update session with plan
      await ctx.runMutation(internal.exerciseGeneration.updateSessionPlan, {
        sessionId: sessionId as string,
        plan,
        newStep: "awaiting_approval",
      });
    } catch (error) {
      // Mark session as failed
      await ctx.runMutation(internal.exerciseGeneration.failSession, {
        sessionId: sessionId as string,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

/**
 * User approves the plan
 */
export const approvePlan = authedMutation({
  args: {
    sessionId: v.id("exerciseGenerationSession"),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId;

    const session = await ctx.db.get(sessionId);
    invariant(session, "Session not found");
    invariant(session.userId === ctx.user.id, "Not authorized");
    invariant(
      session.currentStep === "awaiting_approval",
      "Session not awaiting approval"
    );
    invariant(session.plan, "No plan to approve");

    // Update session step
    await ctx.db.patch(sessionId, {
      currentStep: "generating",
      updatedAt: Date.now(),
    });

    // Schedule generation step
    await ctx.scheduler.runAfter(0, internal.exerciseGeneration.runGeneration, {
      sessionId: sessionId as string,
    });

    return { success: true };
  },
});

/**
 * Run the generation step (internal action)
 */
export const runGeneration = internalAction({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;

    // Get the session
    const session = await ctx.runQuery(
      internal.exerciseGeneration.getSessionForAction,
      { sessionId }
    );
    invariant(session, "Session not found");
    invariant(session.plan, "Plan not set");
    invariant(session.requirements, "Requirements not set");

    try {
      // Create generation step record
      const stepId = await ctx.runMutation(
        internal.exerciseGeneration.createStep,
        {
          sessionId,
          stepType: "generation",
          input: JSON.stringify(session.plan),
        }
      );

      // Generate exercises one by one
      const generatedExercises = [];
      let totalTokens = 0;

      for (const exerciseItem of session.plan.exercises) {
        try {
          const promptText = buildGenerationPrompt({
            requirements: JSON.stringify(session.requirements),
            approvedPlan: JSON.stringify(session.plan),
            exerciseItem: JSON.stringify(exerciseItem),
          });

          // Generate with appropriate schema based on exercise type
          const result = await generateObject({
            model: session.model,
            schema: generationResponseSchema,
            prompt: promptText,
          });

          generatedExercises.push({
            planItemId: exerciseItem.id,
            content: result.object.exercises[0]?.content,
          });

          totalTokens += result.usage?.totalTokens || 0;
        } catch (error) {
          console.error(
            `Failed to generate exercise ${exerciseItem.id}:`,
            error
          );
          // Continue with other exercises
        }
      }

      const output = {
        exercises: generatedExercises,
        totalGenerated: generatedExercises.length,
      };

      // Update step with output
      await ctx.runMutation(internal.exerciseGeneration.completeStep, {
        stepId: stepId as string,
        output: JSON.stringify(output),
        tokensUsed: totalTokens,
      });

      // Mark session as completed
      await ctx.runMutation(internal.exerciseGeneration.completeSession, {
        sessionId: sessionId as string,
        tokensUsed: totalTokens,
      });
    } catch (error) {
      // Mark session as failed
      await ctx.runMutation(internal.exerciseGeneration.failSession, {
        sessionId: sessionId as string,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

/**
 * Get a generation session by ID for real-time updates
 */
export const getGenerationSession = authedQuery({
  args: {
    sessionId: v.id("exerciseGenerationSession"),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId;

    const session = await ctx.db.get(sessionId);
    invariant(session, "Session not found");

    // Verify document access
    const hasAccess = await hasDocumentAccess(
      ctx,
      session.documentId,
      ctx.user.id
    );
    invariant(hasAccess, "Not authorized to access this session");

    // Get all steps for this session
    const steps = await ctx.db
      .query("exerciseGenerationStep")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    // Parse output for the latest relevant step
    let validationResult = null;
    let planResult = null;
    let generationResult = null;

    for (const step of steps) {
      if (step.status === "completed" && step.output) {
        if (step.stepType === "validation") {
          validationResult = JSON.parse(step.output);
        } else if (step.stepType === "planning") {
          planResult = JSON.parse(step.output);
        } else if (step.stepType === "generation") {
          generationResult = JSON.parse(step.output);
        }
      }
    }

    return {
      session,
      steps,
      validationResult,
      planResult,
      generationResult,
    };
  },
});

// ==================== Internal Mutations ====================

/**
 * Get session for action (no auth check)
 */
export const getSessionForAction = internalQuery({
  args: {
    sessionId: v.id("exerciseGenerationSession"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

/**
 * Create a new step
 */
export const createStep = internalMutation({
  args: {
    sessionId: v.id("exerciseGenerationSession"),
    stepType: v.union(
      v.literal("validation"),
      v.literal("planning"),
      v.literal("generation")
    ),
    input: v.string(),
  },
  returns: v.id("exerciseGenerationStep"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("exerciseGenerationStep", {
      sessionId: args.sessionId,
      stepType: args.stepType,
      status: "processing",
      input: args.input,
      createdAt: Date.now(),
    });
  },
});

/**
 * Complete a step
 */
export const completeStep = internalMutation({
  args: {
    stepId: v.string(),
    output: v.string(),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const stepId = args.stepId as Id<"exerciseGenerationStep">;
    await ctx.db.patch(stepId, {
      status: "completed",
      output: args.output,
      tokensUsed: args.tokensUsed,
      completedAt: Date.now(),
    });
  },
});

/**
 * Update session requirements
 */
export const updateSessionRequirements = internalMutation({
  args: {
    sessionId: v.string(),
    requirements: v.any(),
    newStep: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;
    await ctx.db.patch(sessionId, {
      requirements: args.requirements,
      currentStep: args.newStep as "planning",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update session step
 */
export const updateSessionStep = internalMutation({
  args: {
    sessionId: v.string(),
    newStep: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;
    await ctx.db.patch(sessionId, {
      currentStep: args.newStep as "awaiting_clarification",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update session plan
 */
export const updateSessionPlan = internalMutation({
  args: {
    sessionId: v.string(),
    plan: v.any(),
    newStep: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;
    await ctx.db.patch(sessionId, {
      plan: args.plan,
      currentStep: args.newStep as "awaiting_approval",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Complete session
 */
export const completeSession = internalMutation({
  args: {
    sessionId: v.string(),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;
    const session = await ctx.db.get(sessionId);
    invariant(session, "Session not found");

    await ctx.db.patch(sessionId, {
      currentStep: "completed",
      tokensUsed: args.tokensUsed,
      updatedAt: Date.now(),
    });

    // Update teacher's token usage
    if (args.tokensUsed) {
      const teacher = await ctx.db
        .query("teacher")
        .withIndex("by_userId", (q) => q.eq("userId", session.userId))
        .first();

      if (teacher) {
        const currentUsage = teacher.aiTokensUsed || 0;
        await ctx.db.patch(teacher._id, {
          aiTokensUsed: currentUsage + args.tokensUsed,
        });
      }
    }
  },
});

/**
 * Mark session as failed
 */
export const failSession = internalMutation({
  args: {
    sessionId: v.string(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId as Id<"exerciseGenerationSession">;
    await ctx.db.patch(sessionId, {
      currentStep: "failed",
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});
