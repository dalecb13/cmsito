export interface TinyCmsConfig {
  baseUrl: string;
}

export interface PublishedArticle {
  slug: string;
  title: string;
  body: DocJSON;
  updatedAt: string;
}

export interface PublishedArticleListItem {
  slug: string;
  title: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  preset: string;
  overrides: Record<string, unknown>;
  updatedAt: string;
}

export type DocJSON = { type: "doc"; content?: unknown[] };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tiny CMS: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch a published article by slug. */
export async function getArticle(
  config: TinyCmsConfig,
  slug: string
): Promise<PublishedArticle> {
  const base = config.baseUrl.replace(/\/$/, "");
  return fetchJson<PublishedArticle>(`${base}/api/public/articles/${encodeURIComponent(slug)}`);
}

/** Fetch all published articles (slug, title, updatedAt). */
export async function getArticles(
  config: TinyCmsConfig
): Promise<PublishedArticleListItem[]> {
  const base = config.baseUrl.replace(/\/$/, "");
  return fetchJson<PublishedArticleListItem[]>(`${base}/api/public/articles`);
}

/** Fetch the global theme (preset + overrides). */
export async function getTheme(config: TinyCmsConfig): Promise<Theme> {
  const base = config.baseUrl.replace(/\/$/, "");
  return fetchJson<Theme>(`${base}/api/theme`);
}
