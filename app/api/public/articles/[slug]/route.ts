import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublishedVersion } from "@/lib/articles";

/** Public: get published article by slug. For SDK. Returns 404 if not published. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug, status: "PUBLISHED" },
  });
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const published = await getPublishedVersion(article.id);
  const body =
    published?.content?.body && typeof published.content.body === "object"
      ? published.content.body
      : { type: "doc", content: [{ type: "paragraph", content: [] }] };
  return NextResponse.json({
    slug: article.slug,
    title: article.title,
    body,
    updatedAt: article.updatedAt.toISOString(),
  });
}
