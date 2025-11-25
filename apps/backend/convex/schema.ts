import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const userRolesValidator = v.union(
  v.literal("teacher"),
  v.literal("student"),
);
export type UserRole = Infer<typeof userRolesValidator>;

const userProfile = defineTable({
  userId: v.string(), // Better Auth user ID
  roles: v.array(userRolesValidator),
  activeRole: userRolesValidator,
}).index("by_userId", ["userId"]);
export type UserProfile = Infer<typeof schemas.tables.userProfile.validator>;

const teacher = defineTable({
  userId: v.string(), // Better Auth user ID
  createdAt: v.number(),
  aiTokensUsed: v.optional(v.number()), // Total AI tokens consumed
  aiQuotaLimit: v.optional(v.number()), // Monthly quota (not enforced yet)
}).index("by_userId", ["userId"]);
export type Teacher = Infer<typeof schemas.tables.teacher.validator>;

const invite = defineTable({
  teacherId: v.id("teacher"),
  token: v.string(),
  createdAt: v.number(),
}).index("by_token", ["token"]);
export type Invite = Infer<typeof schemas.tables.invite.validator>;

const student = defineTable({
  userId: v.string(), // Better Auth user ID
  createdAt: v.number(),
});
export type Student = Infer<typeof schemas.tables.student.validator>;

const teacherStudents = defineTable({
  teacherId: v.string(), // Better Auth user ID
  studentId: v.string(), // Better Auth user ID
  joinedAt: v.number(),
})
  .index("by_teacherId", ["teacherId"])
  .index("by_studentId", ["studentId"])
  .index("by_teacher_and_student", ["teacherId", "studentId"]);
export type TeacherStudent = Infer<typeof schemas.tables.teacherStudents.validator>;

const document = defineTable({
  owner: v.string(), // Better Auth user ID
  title: v.string(),
  content: v.optional(v.bytes()), // Serialized Yjs document state
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_owner", ["owner"]);
export type Document = Infer<typeof schemas.tables.document.validator>;

const sharedDocuments = defineTable({
  documentId: v.id("document"),
  teacherId: v.string(), // Document owner (Better Auth user ID)
  studentId: v.string(), // Student with access (Better Auth user ID)
  sharedAt: v.number(),
})
  .index("by_document", ["documentId"])
  .index("by_student", ["studentId"])
  .index("by_document_and_student", ["documentId", "studentId"]);
export type SharedDocument = Infer<typeof schemas.tables.sharedDocuments.validator>;

const aiGeneration = defineTable({
  documentId: v.id("document"),
  userId: v.string(), // Better Auth user ID (who requested)
  promptText: v.string(), // User's prompt
  streamId: v.string(), // From persistent-text-streaming component
  generatedContent: v.string(), // AI response (updated progressively)
  model: v.string(), // e.g., "openai/gpt-4"
  tokensUsed: v.optional(v.number()), // Token count for billing
  status: v.union(
    v.literal("pending"),
    v.literal("streaming"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  errorMessage: v.optional(v.string()),
  acceptedBy: v.optional(v.string()), // User ID who accepted (prevents duplicates)
  acceptedAt: v.optional(v.number()), // When accepted
  createdAt: v.number(),
})
  .index("by_document", ["documentId"])
  .index("by_user_date", ["userId", "createdAt"])
  .index("by_streamId", ["streamId"]);
export type AIGeneration = Infer<typeof schemas.tables.aiGeneration.validator>;

const exerciseGenerationSession = defineTable({
  documentId: v.id("document"),
  userId: v.string(), // Better Auth user ID (who requested)
  initialPrompt: v.string(), // User's original prompt
  model: v.string(), // AI model to use
  currentStep: v.union(
    v.literal("validating"),
    v.literal("awaiting_clarification"),
    v.literal("planning"),
    v.literal("awaiting_approval"),
    v.literal("generating"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  // Extracted requirements (populated after validation)
  requirements: v.optional(
    v.object({
      targetLanguage: v.string(),
      level: v.string(), // CEFR level
      nativeLanguage: v.optional(v.string()),
      topic: v.optional(v.string()),
      duration: v.optional(v.number()),
      exerciseTypes: v.array(v.string()),
      additionalContext: v.optional(v.string()),
    }),
  ),
  // Exercise plan (populated after planning step)
  plan: v.optional(
    v.object({
      exercises: v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          title: v.string(),
          description: v.string(),
          estimatedDuration: v.optional(v.number()),
          parameters: v.optional(v.any()), // Exercise-specific parameters
          dependencies: v.optional(v.array(v.string())), // IDs of prerequisite exercises
        }),
      ),
      totalDuration: v.optional(v.number()),
      sequenceRationale: v.optional(v.string()),
      learningObjectives: v.optional(v.array(v.string())),
      metadata: v.optional(v.any()), // Additional metadata
    }),
  ),
  tokensUsed: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_document", ["documentId"])
  .index("by_user_date", ["userId", "createdAt"]);
export type ExerciseGenerationSession = Infer<
  typeof schemas.tables.exerciseGenerationSession.validator
>;

const exerciseGenerationStep = defineTable({
  sessionId: v.id("exerciseGenerationSession"),
  stepType: v.union(
    v.literal("validation"),
    v.literal("planning"),
    v.literal("generation"),
  ),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  // Input to the step
  input: v.string(), // JSON string of input data
  // Output from the step
  output: v.optional(v.string()), // JSON string of structured output
  tokensUsed: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_session", ["sessionId"])
  .index("by_session_and_type", ["sessionId", "stepType"]);
export type ExerciseGenerationStep = Infer<
  typeof schemas.tables.exerciseGenerationStep.validator
>;

const schemas = defineSchema({
  userProfile,
  teacher,
  student,
  teacherStudents,
  invite,
  document,
  sharedDocuments,
  aiGeneration,
  exerciseGenerationSession,
  exerciseGenerationStep,
});

export default schemas;
