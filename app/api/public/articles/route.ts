import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Public: list published articles only. For SDK. */
export async function GET() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      title: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(articles);
}
