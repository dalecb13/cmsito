import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ArticlesListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
      updatedAt: true,
      creator: { select: { email: true } },
    },
  });

  return (
    <main>
      <h1>Articles</h1>
      <p>
        <Link href="/dashboard/articles/new">New article</Link>
      </p>
      {articles.length === 0 ? (
        <p>No articles yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {articles.map((a) => (
            <li
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <Link href={`/dashboard/articles/${a.slug}/edit`} style={{ flex: 1 }}>
                <strong>{a.title}</strong> — /{a.slug} ({a.status})
              </Link>
              <span style={{ color: "#666", fontSize: "0.9rem" }}>
                {new Date(a.updatedAt).toLocaleDateString()}
              </span>
              {session.user.role !== "CONTRIBUTOR" && (
                <span style={{ color: "#666" }}>{a.creator.email}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
