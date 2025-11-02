import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const userProfiles = defineTable({
  userId: v.string(), // Better Auth user ID
  isTeacherActive: v.boolean(),
  isStudentActive: v.boolean(),
  activeRole: v.optional(v.union(v.literal("teacher"), v.literal("student"))),
  teacherDisplayName: v.optional(v.string()),
}).index("by_userId", ["userId"]);

const students = defineTable({
  teacherId: v.string(), // User ID of the teacher who created this
  nickname: v.string(),
  inviteToken: v.string(), // Unique token for "join me" link
  linkedUserId: v.optional(v.string()), // Actual user ID after signup
  createdAt: v.number(),
})
  .index("by_teacherId", ["teacherId"])
  .index("by_inviteToken", ["inviteToken"])
  .index("by_linkedUserId", ["linkedUserId"]);

const lessons = defineTable({
  teacherId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_teacherId", ["teacherId"]);

const lessonAccess = defineTable({
  lessonId: v.id("lessons"),
  studentRecordId: v.id("students"),
  sharedAt: v.number(),
})
  .index("by_lessonId", ["lessonId"])
  .index("by_studentRecordId", ["studentRecordId"]);

export default defineSchema({
  userProfiles,
  students,
  lessons,
  lessonAccess,
});
