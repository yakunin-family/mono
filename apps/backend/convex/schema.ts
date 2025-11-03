import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

const userRoles = v.union(v.literal("teacher"), v.literal("student"));
export type UserRole = Infer<typeof userRoles>;

const userProfiles = defineTable({
  userId: v.string(), // Better Auth user ID
  isTeacherActive: v.boolean(),
  isStudentActive: v.boolean(),
  activeRole: userRoles,
  teacherDisplayName: v.optional(v.string()),
}).index("by_userId", ["userId"]);
export type UserProfile = Infer<typeof schemas.tables.userProfiles.validator>;

const students = defineTable({
  teacherId: v.string(), // User ID of the teacher who created this
  inviteToken: v.string(), // Unique token for "join me" link
  linkedUserId: v.optional(v.string()), // Actual user ID after signup
  createdAt: v.number(),
})
  .index("by_teacherId", ["teacherId"])
  .index("by_inviteToken", ["inviteToken"])
  .index("by_linkedUserId", ["linkedUserId"]);
export type Student = Infer<typeof schemas.tables.students.validator>;

const documents = defineTable({
  teacherId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_teacherId", ["teacherId"]);
export type Document = Infer<typeof schemas.tables.documents.validator>;

const documentAccess = defineTable({
  documentId: v.id("documents"),
  studentRecordId: v.id("students"),
  sharedAt: v.number(),
})
  .index("by_documentId", ["documentId"])
  .index("by_studentRecordId", ["studentRecordId"]);
export type DocumentAccess = Infer<
  typeof schemas.tables.documentAccess.validator
>;

const schemas = defineSchema({
  userProfiles,
  students,
  documents,
  documentAccess,
});

export default schemas;
