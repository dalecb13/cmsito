"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Editor } from "@/components/editor";

type DocJSON = { type: "doc"; content?: unknown[] };

export function ArticleForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState<DocJSON>({ type: "doc", content: [{ type: "paragraph", content: [] }] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug.trim(), title: title.trim(), body }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/dashboard/articles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 720 }}>
      <label>
        Slug (URL path)
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          placeholder="getting-started"
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Getting started"
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      <label>
        Body
        <div style={{ marginTop: "0.25rem" }}>
          <Editor content={body} onChange={setBody} />
        </div>
      </label>
      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Creating…" : "Create article"}
        </button>
        <Link href="/dashboard/articles" style={{ padding: "0.5rem 1rem" }}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
