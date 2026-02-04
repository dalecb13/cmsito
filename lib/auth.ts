import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export async function getSession() {
  return auth();
}

/** Contributor: only own (creatorId). Maintainer/Owner: any. */
export function canEditArticle(
  userRole: Role,
  userId: string,
  creatorId: string
): boolean {
  if (userRole === "MAINTAINER" || userRole === "OWNER") return true;
  return creatorId === userId;
}
