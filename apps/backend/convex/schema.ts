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
  students: v.array(v.string()), // Array of Better Auth user IDs
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

const document = defineTable({
  owner: v.string(), // Better Auth user ID
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_owner", ["owner"]);
export type Document = Infer<typeof schemas.tables.document.validator>;

const schemas = defineSchema({
  userProfile,
  teacher,
  student,
  invite,
  document,
});

export default schemas;
