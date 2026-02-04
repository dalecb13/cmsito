import Link from "next/link";
import { ArticleForm } from "./article-form";

export default function NewArticlePage() {
  return (
    <main>
      <h1>New article</h1>
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/dashboard/articles">← Articles</Link>
      </p>
      <ArticleForm />
    </main>
  );
}
