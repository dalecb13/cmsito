import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { publishArticle } from "@/lib/articles";

/** Maintainer or owner only. Requires approval. Copies draft → published, sets status PUBLISHED. */
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
  if (!article.publishApprovedById || !article.publishApprovedAt) {
    return NextResponse.json(
      { error: "Article must be approved before publishing" },
      { status: 400 }
    );
  }
  try {
    await publishArticle({
      articleId: article.id,
      publishedById: session.user.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const updated = await prisma.article.findUnique({
    where: { id: article.id },
    include: { creator: { select: { id: true, email: true, name: true } } },
  });
  return NextResponse.json(updated);
}
