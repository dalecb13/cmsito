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

/** Get current published version (latest PUBLISHED by updatedAt). */
export async function getPublishedVersion(articleId: string) {
  return prisma.articleVersion.findFirst({
    where: { articleId, kind: VersionKind.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    include: { content: true },
  });
}

/** Publish article: copy current draft to new Content + ArticleVersion (PUBLISHED), set status. */
export async function publishArticle(params: {
  articleId: string;
  publishedById: string;
}) {
  const draft = await getDraftVersion(params.articleId);
  if (!draft?.content?.body) {
    throw new Error("No draft content to publish");
  }
  const body = draft.content.body as object;
  const content = await prisma.content.create({ data: { body } });
  await prisma.articleVersion.create({
    data: {
      articleId: params.articleId,
      kind: VersionKind.PUBLISHED,
      contentId: content.id,
      updatedById: params.publishedById,
    },
  });
  await prisma.article.update({
    where: { id: params.articleId },
    data: { status: "PUBLISHED" },
  });
}
