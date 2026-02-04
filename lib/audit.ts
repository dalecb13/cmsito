import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      metadata: params.metadata ? (params.metadata as object) : undefined,
    },
  });
}
