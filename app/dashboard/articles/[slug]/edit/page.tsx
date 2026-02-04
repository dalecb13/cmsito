import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDraftVersion } from "@/lib/articles";
import { canEditArticle } from "@/lib/auth";
import { ArticleEditForm } from "./article-edit-form";

const DEFAULT_BODY = { type: "doc", content: [{ type: "paragraph", content: [] }] } as const;

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
  });
  if (!article) notFound();

  if (!canEditArticle(session.user.role, session.user.id, article.creatorId)) {
    notFound();
  }

  const draft = await getDraftVersion(article.id);
  const body =
    draft?.content?.body && typeof draft.content.body === "object" && "type" in draft.content.body
      ? (draft.content.body as { type: "doc"; content?: unknown[] })
      : DEFAULT_BODY;

  return (
    <main>
      <h1>Edit article</h1>
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/dashboard/articles">← Articles</Link>
      </p>
      <ArticleEditForm
        slug={slug}
        initialTitle={article.title}
        initialBody={JSON.parse(JSON.stringify(body))}
      />
    </main>
  );
}
