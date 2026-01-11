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
}).index("by_userId", ["userId"]);
export type Student = Infer<typeof schemas.tables.student.validator>;

// Spaces - Core entity representing a 1:1 teaching relationship for a specific language
const spaces = defineTable({
  teacherId: v.string(), // Better Auth user ID of the teacher
  studentId: v.string(), // Better Auth user ID of the student
  language: v.string(), // Free text language name (e.g., "German", "Business English")
  createdAt: v.number(),
})
  .index("by_teacher", ["teacherId"])
  .index("by_student", ["studentId"])
  .index("by_teacher_and_student", ["teacherId", "studentId"]);
export type Space = Infer<typeof schemas.tables.spaces.validator>;

// Space invites - Invite tokens that create spaces when accepted
const spaceInvites = defineTable({
  teacherId: v.string(), // Teacher who created the invite
  language: v.string(), // Language for the space to be created
  token: v.string(), // Unique URL-safe invite token
  createdAt: v.number(),
  expiresAt: v.optional(v.number()), // Optional expiration timestamp
  usedAt: v.optional(v.number()), // When the invite was used
  usedBy: v.optional(v.string()), // Student who used the invite
  resultingSpaceId: v.optional(v.id("spaces")), // Space that was created
})
  .index("by_token", ["token"])
  .index("by_teacher", ["teacherId"]);
export type SpaceInvite = Infer<typeof schemas.tables.spaceInvites.validator>;

// Homework items - Exercises marked as homework for a student
const homeworkItems = defineTable({
  spaceId: v.id("spaces"), // Which space this belongs to
  documentId: v.id("document"), // Which lesson contains the exercise
  exerciseInstanceId: v.string(), // The instanceId of the Exercise node in Tiptap
  markedAt: v.number(), // When teacher marked it as homework
  completedAt: v.optional(v.number()), // When student marked it complete
})
  .index("by_space", ["spaceId"])
  .index("by_space_incomplete", ["spaceId", "completedAt"])
  .index("by_document", ["documentId"]);
export type HomeworkItem = Infer<typeof schemas.tables.homeworkItems.validator>;

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
  // Space-related fields (new)
  spaceId: v.optional(v.id("spaces")), // Which space this lesson belongs to
  lessonNumber: v.optional(v.number()), // Order within space (1, 2, 3...)
  // Existing fields (owner becomes optional for backward compatibility)
  owner: v.optional(v.string()), // Better Auth user ID (deprecated - use spaceId)
  title: v.string(),
  content: v.optional(v.bytes()), // Serialized Yjs document state
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["owner"])
  .index("by_space", ["spaceId"])
  .index("by_space_lesson", ["spaceId", "lessonNumber"]);
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

export const libraryItemTypeValidator = v.union(
  v.literal("exercise"),
  v.literal("template"),
  v.literal("group")
);
export type LibraryItemType = Infer<typeof libraryItemTypeValidator>;

export const cefrLevelValidator = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
  v.literal("C1"),
  v.literal("C2")
);
export type CEFRLevel = Infer<typeof cefrLevelValidator>;

export const libraryMetadataValidator = v.object({
  language: v.optional(v.string()), // e.g., "German", "Spanish"
  levels: v.optional(v.array(cefrLevelValidator)), // Multiple CEFR levels [A1, A2]
  exerciseTypes: v.optional(v.array(v.string())), // e.g., ["fill-blanks", "multiple-choice"]
  topic: v.optional(v.string()), // e.g., "food", "travel"
  tags: v.optional(v.array(v.string())), // Custom tags (grammar focus, vocab themes, skills)
  autoTagged: v.optional(v.boolean()), // Whether AI auto-tagging was used
});
export type LibraryMetadata = Infer<typeof libraryMetadataValidator>;

const library = defineTable({
  ownerId: v.string(), // Better Auth user ID (teacher)
  title: v.string(),
  type: libraryItemTypeValidator,
  content: v.string(), // JSON-stringified Tiptap content array
  description: v.optional(v.string()), // Useful for templates
  metadata: v.optional(libraryMetadataValidator), // Rich metadata for search/filter
  searchText: v.optional(v.string()), // Concatenated searchable text (title + description + tags)
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["ownerId"])
  .index("by_owner_type", ["ownerId", "type"])
  .index("by_owner_date", ["ownerId", "createdAt"]);
export type LibraryItem = Infer<typeof schemas.tables.library.validator>;

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
  library,
  // New tables for spaces and homework
  spaces,
  spaceInvites,
  homeworkItems,
});

export default schemas;
