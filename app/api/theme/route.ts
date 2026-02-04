import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrCreateTheme } from "@/lib/theme";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/** Public read: for SDK and control panel. Returns singleton theme. */
export async function GET() {
  const theme = await getOrCreateTheme();
  return NextResponse.json({
    id: theme.id,
    preset: theme.preset,
    overrides: theme.overrides as Record<string, unknown>,
    updatedAt: theme.updatedAt.toISOString(),
  });
}

/** Maintainer or owner only. Update preset and/or overrides. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "MAINTAINER" && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden: maintainer or owner only" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const preset = typeof body.preset === "string" ? body.preset.trim() : undefined;
  const overrides = body.overrides !== undefined && typeof body.overrides === "object" ? (body.overrides as object) : undefined;
  const theme = await getOrCreateTheme();
  const updateData: { preset?: string; overrides?: object } = {};
  if (preset !== undefined) updateData.preset = preset;
  if (overrides !== undefined) updateData.overrides = overrides;
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({
      id: theme.id,
      preset: theme.preset,
      overrides: theme.overrides as Record<string, unknown>,
      updatedAt: theme.updatedAt.toISOString(),
    });
  }
  const updated = await prisma.theme.update({
    where: { id: theme.id },
    data: updateData,
  });
  await createAuditLog({
    userId: session.user.id,
    action: "THEME_UPDATED",
    resourceType: "Theme",
    resourceId: theme.id,
    metadata: { preset: updated.preset },
  });
  return NextResponse.json({
    id: updated.id,
    preset: updated.preset,
    overrides: updated.overrides as Record<string, unknown>,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
