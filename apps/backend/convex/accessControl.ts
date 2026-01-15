import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

/**
 * Check if user has access to a document.
 * Supports space-based access (new model) and owner/shared access (legacy).
 */
export async function hasDocumentAccess(
  ctx: Ctx,
  documentId: Id<"document">,
  userId: string,
): Promise<boolean> {
  const document = await ctx.db.get(documentId);
  if (!document) {
    return false;
  }

  // New model: space-based access
  if (document.spaceId) {
    const space = await ctx.db.get(document.spaceId);
    if (space && (space.teacherId === userId || space.studentId === userId)) {
      return true;
    }
  }

  // Legacy model: owner check
  if (document.owner === userId) {
    return true;
  }

  return false;
}

/**
 * Check if user has access to a space and return role info.
 */
export async function verifySpaceAccess(
  ctx: Ctx,
  spaceId: Id<"spaces">,
  userId: string,
): Promise<{ hasAccess: boolean; isTeacher: boolean; isStudent: boolean }> {
  const space = await ctx.db.get(spaceId);
  if (!space) {
    return { hasAccess: false, isTeacher: false, isStudent: false };
  }

  const isTeacher = space.teacherId === userId;
  const isStudent = space.studentId === userId;

  return {
    hasAccess: isTeacher || isStudent,
    isTeacher,
    isStudent,
  };
}
