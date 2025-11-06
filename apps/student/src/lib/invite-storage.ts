const PENDING_INVITE_KEY = "pendingTeacherInvite";

export function storePendingInvite(teacherUserId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PENDING_INVITE_KEY, teacherUserId);
  }
}

export function getPendingInvite(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(PENDING_INVITE_KEY);
  }
  return null;
}

export function clearPendingInvite(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PENDING_INVITE_KEY);
  }
}
