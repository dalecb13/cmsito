# tiny-cms-sdk

SDK for rendering published Tiny CMS articles in a Next.js (or React) app.

## Install

From the monorepo root or link locally:

```bash
npm install tiny-cms-sdk
# or from packages/tiny-cms-sdk: npm link
```

## Usage

Configure the SDK with your CMS base URL (same deployment or read-only API).

```tsx
import { getArticle, getArticles, getTheme, ArticleContent } from "tiny-cms-sdk";

const config = { baseUrl: process.env.NEXT_PUBLIC_CMS_URL ?? "" };

// In a server component or getServerSideProps:
const article = await getArticle(config, "getting-started");
const theme = await getTheme(config);

// Render
<ArticleContent content={article.body} theme={theme?.overrides} />
```

## API

- **`getArticle(config, slug)`** – Fetch a published article by slug (title, body, updatedAt).
- **`getArticles(config)`** – Fetch all published articles (slug, title, updatedAt).
- **`getTheme(config)`** – Fetch the global theme (preset, overrides).
- **`<ArticleContent content={doc} theme={overrides} />`** – Renders TipTap JSON as HTML. Optional `theme` applies CSS variables (e.g. `primaryColor`, `fontFamily`, `headingFont`). Use `--tiny-cms-heading-font` in your CSS for headings.

## Public API requirements

The CMS app must expose:

- `GET /api/public/articles` – list published articles
- `GET /api/public/articles/[slug]` – get published article by slug
- `GET /api/theme` – get theme (already public)
