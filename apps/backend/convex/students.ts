import { v } from "convex/values";
import invariant from "tiny-invariant";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Generate a unique invite token
function generateInviteToken(): string {
  return crypto.randomUUID().slice(0, 8);
}

export const createStudentInviteLinkToken = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    invariant(teacher, "Only teachers can create student invite links");

    const token = generateInviteToken();
    await ctx.db.insert("invite", {
      teacherId: teacher._id,
      token,
      createdAt: Date.now(),
    });

    return token;
  },
});

// // Get all students created by the current teacher (with user profile names)
// export const getMyStudents = query({
//   args: {},
//   handler: async (ctx) => {
//     const user = await authComponent.getAuthUser(ctx);
//     if (!user) {
//       return [];
//     }

//     const students = await ctx.db
//       .query("students")
//       .withIndex("by_teacherId", (q) => q.eq("teacherId", user._id))
//       .collect();

//     // Fetch user profiles for linked students
//     const studentsWithNames = await Promise.all(
//       students.map(async (student) => {
//         if (student.linkedUserId) {
//           const profile = await ctx.db
//             .query("userProfiles")
//             .withIndex("by_userId", (q) =>
//               q.eq("userId", student.linkedUserId!),
//             )
//             .first();

//           return {
//             ...student,
//             studentName: profile?.teacherDisplayName || "Unknown",
//           };
//         }
//         return {
//           ...student,
//           studentName: null, // Not signed up yet
//         };
//       }),
//     );

//     return studentsWithNames;
//   },
// });

// // Get student by invite token (for invite link flow)
// export const getStudentByInviteToken = query({
//   args: {
//     token: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const student = await ctx.db
//       .query("students")
//       .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.token))
//       .first();

//     return student;
//   },
// });

// // Link a student record to a user account (after signup via invite link)
// export const linkStudentToUser = mutation({
//   args: {
//     inviteToken: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const user = await authComponent.getAuthUser(ctx);
//     if (!user) {
//       throw new Error("Not authenticated");
//     }

//     // Find the student record by invite token
//     const student = await ctx.db
//       .query("students")
//       .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
//       .first();

//     if (!student) {
//       throw new Error("Invalid invite token");
//     }

//     if (student.linkedUserId) {
//       throw new Error("This invite has already been used");
//     }

//     // Link the student to the user
//     await ctx.db.patch(student._id, {
//       linkedUserId: user._id,
//     });

//     // Activate student role for this user
//     const profile = await ctx.db
//       .query("userProfiles")
//       .withIndex("by_userId", (q) => q.eq("userId", user._id))
//       .first();

//     if (profile) {
//       await ctx.db.patch(profile._id, {
//         isStudentActive: true,
//         activeRole: "student",
//       });
//     }

//     return {
//       success: true,
//       studentId: student._id,
//     };
//   },
// });

// // Get all student records linked to the current user
// export const getMyStudentRecords = query({
//   args: {},
//   handler: async (ctx) => {
//     const user = await authComponent.getAuthUser(ctx);
//     if (!user) {
//       return [];
//     }

//     const studentRecords = await ctx.db
//       .query("students")
//       .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", user._id))
//       .collect();

//     return studentRecords;
//   },
// });

// Join a teacher immediately (no approval needed)
export const joinTeacher = mutation({
  args: {
    teacherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const userId = user._id;

    // Check if teacher exists
    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", args.teacherUserId))
      .first();

    invariant(teacher, "Teacher not found");

    // Check if already enrolled
    const existing = await ctx.db
      .query("teacherStudents")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", args.teacherUserId).eq("studentId", userId),
      )
      .first();

    if (existing) {
      return { success: true, alreadyEnrolled: true };
    }

    // Create enrollment
    await ctx.db.insert("teacherStudents", {
      teacherId: args.teacherUserId,
      studentId: userId,
      joinedAt: Date.now(),
    });

    // Ensure student record exists
    const studentRecord = await ctx.db
      .query("student")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!studentRecord) {
      await ctx.db.insert("student", {
        userId,
        createdAt: Date.now(),
      });
    }

    // Ensure user has student role
    const userProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (userProfile && !userProfile.roles.includes("student")) {
      await ctx.db.patch(userProfile._id, {
        roles: [...userProfile.roles, "student"],
      });
    }

    return { success: true, alreadyEnrolled: false };
  },
});

// Get all teachers the current user is enrolled with
export const getMyTeachers = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const userId = user._id;

    // Get all enrollments
    const enrollments = await ctx.db
      .query("teacherStudents")
      .withIndex("by_studentId", (q) => q.eq("studentId", userId))
      .collect();

    // Get teacher profiles
    const teachersWithProfiles = await Promise.all(
      enrollments.map(async (enrollment) => {
        const teacher = await ctx.db
          .query("teacher")
          .withIndex("by_userId", (q) => q.eq("userId", enrollment.teacherId))
          .first();

        const userProfile = await ctx.db
          .query("userProfile")
          .withIndex("by_userId", (q) => q.eq("userId", enrollment.teacherId))
          .first();

        return {
          teacherId: enrollment.teacherId,
          displayName: userProfile?.userId || enrollment.teacherId,
          joinedAt: enrollment.joinedAt,
          teacher,
        };
      }),
    );

    return teachersWithProfiles;
  },
});

// Check if the current user is enrolled with a specific teacher
export const isEnrolledWithTeacher = query({
  args: {
    teacherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return false;
    }

    const userId = user._id;

    const enrollment = await ctx.db
      .query("teacherStudents")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", args.teacherUserId).eq("studentId", userId),
      )
      .first();

    return !!enrollment;
  },
});
