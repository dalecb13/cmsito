"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Editor } from "@/components/editor";
import type { Role } from "@prisma/client";

type DocJSON = { type: "doc"; content?: unknown[] };

interface ArticleEditFormProps {
  slug: string;
  initialTitle: string;
  initialBody: DocJSON;
  status: "DRAFT" | "PUBLISHED";
  publishApprovedAt: string | null;
  userRole: Role;
}

export function ArticleEditForm({
  slug,
  initialTitle,
  initialBody,
  status,
  publishApprovedAt,
  userRole,
}: ArticleEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState<DocJSON>(initialBody);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvalState, setApprovalState] = useState(publishApprovedAt);
  const canApproveOrPublish = userRole === "MAINTAINER" || userRole === "OWNER";

  const handleBodyChange = useCallback((json: DocJSON) => setBody(json), []);

  async function handleApprove() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/approve`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setApprovalState(new Date().toISOString());
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to approve");
    }
  }

  async function handlePublish() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/publish`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to publish");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard/articles");
      router.refresh();
    } else {
      setError("Failed to delete");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 720 }}>
      <p style={{ color: "#666" }}>Slug: /{slug}</p>
      <p style={{ color: "#666", margin: 0 }}>
        Status: <strong>{status}</strong>
        {approvalState && (
          <> · Approved for publish {new Date(approvalState).toLocaleString()}</>
        )}
      </p>
      {canApproveOrPublish && status === "DRAFT" && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {!approvalState && (
            <button type="button" onClick={handleApprove} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
              Approve for publish
            </button>
          )}
          {approvalState && (
            <button type="button" onClick={handlePublish} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
              Publish
            </button>
          )}
        </div>
      )}
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      <label>
        Body
        <div style={{ marginTop: "0.25rem" }}>
          <Editor content={body} onChange={handleBodyChange} />
        </div>
      </label>
      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Saving…" : "Save draft"}
        </button>
        <Link href="/dashboard/articles" style={{ padding: "0.5rem 1rem" }}>
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          style={{ padding: "0.5rem 1rem", marginLeft: "auto", color: "crimson" }}
        >
          Delete article
        </button>
      </div>
    </form>
  );
}
