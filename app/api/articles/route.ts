import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createArticle } from "@/lib/articles";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const where =
    session.user.role === "CONTRIBUTOR"
      ? { creatorId: session.user.id }
      : {};
  const articles = await prisma.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      creator: { select: { id: true, email: true, name: true } },
    },
  });
  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase().replace(/\s+/g, "-") : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!slug || !title) {
    return NextResponse.json(
      { error: "Slug and title are required" },
      { status: 400 }
    );
  }
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "An article with this slug already exists" },
      { status: 409 }
    );
  }
  const article = await createArticle({
    slug,
    title,
    creatorId: session.user.id,
    body: body.body ?? undefined,
  });
  return NextResponse.json(article, { status: 201 });
}
