import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canEditArticle } from "@/lib/auth";
import { getDraftVersion, updateDraft } from "@/lib/articles";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { creator: { select: { id: true, email: true, name: true } } },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditArticle(session.user.role, session.user.id, article.creatorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const draft = await getDraftVersion(article.id);
  return NextResponse.json({
    ...article,
    body: draft?.content.body ?? { type: "doc", content: [{ type: "paragraph", content: [] }] },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditArticle(session.user.role, session.user.id, article.creatorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  if (typeof body.title === "string" && body.title.trim()) {
    await prisma.article.update({
      where: { id: article.id },
      data: { title: body.title.trim() },
    });
  }
  if (body.body !== undefined) {
    await updateDraft({
      articleId: article.id,
      body: body.body,
      updatedById: session.user.id,
    });
  }
  const updated = await prisma.article.findUnique({
    where: { id: article.id },
    include: { creator: { select: { id: true, email: true, name: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canEditArticle(session.user.role, session.user.id, article.creatorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.article.delete({ where: { id: article.id } });
  return new NextResponse(null, { status: 204 });
}
