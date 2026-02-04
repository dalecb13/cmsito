import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Maintainer or owner only. Sets publish approval on the article. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "MAINTAINER" && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden: maintainer or owner only" }, { status: 403 });
  }
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.article.update({
    where: { id: article.id },
    data: {
      publishApprovedById: session.user.id,
      publishApprovedAt: new Date(),
    },
  });
  const updated = await prisma.article.findUnique({
    where: { id: article.id },
    include: { publishApprovedBy: { select: { id: true, email: true } } },
  });
  return NextResponse.json(updated);
}
