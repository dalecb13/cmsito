import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Maintainer or owner only. List audit logs, newest first. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "MAINTAINER" && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden: maintainer or owner only" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit")) || 50), 100);
  const cursor = searchParams.get("cursor") ?? undefined;
  const logs = await prisma.auditLog.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });
  const nextCursor = logs.length > limit ? logs[limit - 1]?.id : null;
  const items = logs.slice(0, limit);
  return NextResponse.json({
    items,
    nextCursor,
  });
}
