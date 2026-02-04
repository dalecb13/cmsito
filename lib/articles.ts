import { prisma } from "@/lib/prisma";
import { VersionKind } from "@prisma/client";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph", content: [] }] } as const;

/** Get current draft version for an article (latest DRAFT by updatedAt). */
export async function getDraftVersion(articleId: string) {
  return prisma.articleVersion.findFirst({
    where: { articleId, kind: VersionKind.DRAFT },
    orderBy: { updatedAt: "desc" },
    include: { content: true },
  });
}

/** Create article with initial draft content. */
export async function createArticle(params: {
  slug: string;
  title: string;
  creatorId: string;
  body?: unknown;
}) {
  const body = (params.body ?? EMPTY_DOC) as object;
  const content = await prisma.content.create({ data: { body } });
  const article = await prisma.article.create({
    data: {
      slug: params.slug,
      title: params.title,
      creatorId: params.creatorId,
      status: "DRAFT",
    },
  });
  await prisma.articleVersion.create({
    data: {
      articleId: article.id,
      kind: VersionKind.DRAFT,
      contentId: content.id,
      updatedById: params.creatorId,
    },
  });
  return article;
}

/** Update draft: create new Content + ArticleVersion (DRAFT). */
export async function updateDraft(params: {
  articleId: string;
  body: unknown;
  updatedById: string;
}) {
  const content = await prisma.content.create({
    data: { body: params.body as object },
  });
  await prisma.articleVersion.create({
    data: {
      articleId: params.articleId,
      kind: VersionKind.DRAFT,
      contentId: content.id,
      updatedById: params.updatedById,
    },
  });
}
