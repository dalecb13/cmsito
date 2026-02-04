# CMS SaaS – Architecture & Product Plan

Single-tenant wiki-style knowledge-base CMS. One deployment per customer; one knowledge base per deployment. Control panel for content management + Next.js SDK for displaying published content.

---

## 1. Deployment & tenant model

- **One deployment = one tenant = one knowledge base.** No multi-tenant data model; tenant boundary is the deployment (env/config).
- **Scale (v1):** ~10s of tenants (deployments), ~100s of articles per wiki, ~10 concurrent users per deployment.
- **Database:** Customer-supplied (Postgres recommended). App supports Docker for local/dev and optional containerized deployment.

---

## 2. Tech stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript |
| Frontend (control panel) | Next.js |
| Client (published content) | Next.js SDK/package (consumed in customer’s Next.js app) |
| Backend / API | Next.js API routes (or separate Node service if you split later) |
| ORM | Prisma |
| Database | User-provided (Postgres); connection via env (e.g. `DATABASE_URL`) |
| Auth | Email+password, SSO (e.g. NextAuth/Auth.js with adapters), invitation flow |
| Docker | Dockerfile + optional docker-compose for app + DB for dev |

---

## 3. Data model (core entities)

### 3.1 Users & org

- **User:** id, email, name, role (`CONTRIBUTOR` | `MAINTAINER` | `OWNER`), auth provider / SSO id, timestamps. One deployment = one “org”; no separate org table unless you add multi-KB later.
- **Invitation:** email, role, token, expiresAt, createdAt. Used for invite-only signup.

### 3.2 Content

- **Article:** id, slug (unique per KB), title, creatorId (ownership), status (`DRAFT` | `PUBLISHED`), timestamps.
- **ArticleVersion:** one table; `kind` (`DRAFT` | `PUBLISHED`), `articleId`, `contentId`, `updatedAt`, `updatedBy`. Current = latest row per (articleId, kind). Only two logical versions per article: last saved (draft) and last published.
- **Content:** id, body (TipTap/ProseMirror JSON; see §14), version metadata.

### 3.3 Publishing

- **PublishApproval (or flag on Article):** Maintainer or Owner approval for “ready to publish.”
  - If explicit approval record: `articleId`, `approvedBy` (maintainer or owner userId), `approvedAt`, optional note.
  - Or boolean on `Article`: `publishApprovedBy`, `publishApprovedAt`. Either way: “publish” action only allowed when this is set; publishing then copies “last saved” → “last published” and sets status to `PUBLISHED`.

### 3.4 Theme

- **Theme (or KnowledgeBaseSettings):** one row per deployment. Fields: preset (e.g. enum or key), overrides (JSON: colors, fonts, spacing, etc.). Only maintainers and owners can write; SDK reads.

### 3.5 Audit

- **AuditLog:** id, userId, action (e.g. `ARTICLE_CREATED`, `ARTICLE_UPDATED`, `ARTICLE_DELETED`, `ARTICLE_PUBLISHED`, `THEME_UPDATED`, `USER_INVITED`, `USER_ROLE_CHANGED`, `USER_REMOVED`), resourceType, resourceId, metadata (optional JSON), createdAt. High-level only.

### 3.6 Prisma schema (implementation)

- **Location:** `prisma/schema.prisma`. Optional `prisma.config.ts` for Prisma 7 (datasource URL).
- **Design choices:**
  - **Publish approval on Article:** `publishApprovedById`, `publishApprovedAt` on `Article` (no separate PublishApproval table). Simpler; add a table later if you need approval history.
  - **ArticleVersion:** Multiple rows per (articleId, kind) allowed; "current" = latest by `updatedAt`. Index on `(articleId, kind, updatedAt(sort: Desc))` for efficient lookup. Each row has `contentId` → one `Content` snapshot; `contentId` unique so each Content belongs to one version.
  - **Content:** `body` is `Json` (TipTap doc node). One row per snapshot; new row on each save/publish. Prune old Content/ArticleVersion in app or a job if you want to enforce "only last saved + last published."
  - **Theme:** Singleton per deployment; app ensures one row (e.g. `findFirst` / upsert by fixed id or create in seed).
  - **Invitation:** `invitedById` optional (who sent the invite); `token` unique for lookup.
  - **User:** `emailVerified`, `image` for NextAuth compatibility; no separate Account table in schema (NextAuth can use its own or extend).
- **Enums:** `Role`, `ArticleStatus`, `VersionKind`, `AuditAction`. Extend `AuditAction` as you add events.

---

## 4. Auth & authorization

- **Sign-up / sign-in:** Email+password (credentials), SSO (e.g. OAuth), and invitation (invite link sets role; sign-up/sign-in completes it).
- **Roles:**
  - **Contributor:** CRUD own articles only (creatorId = current user). Can request publish (e.g. set “ready for review” or trigger approval workflow).
  - **Maintainer:** Same content privileges as Owner (CRUD any article; set publish approval; change theme). Cannot add/remove other users.
  - **Owner:** All Maintainer privileges; additionally can add/remove Maintainers and Contributors (invite, change role, revoke access).
- **Ownership:** By creator (creatorId). Contributor can only edit/delete where `creatorId === currentUser.id`; maintainer and owner can edit/delete any.

---

## 5. Control panel (app)

- **Auth:** Login, signup, invite acceptance, SSO.
- **Dashboard:** List articles (filter by status, ownership; search by title/slug).
- **Article CRUD:** Create (slug, title, body), Edit (WYSIWYG), Delete (soft or hard per your choice). Body = block-based (paragraph, image, table, etc.).
- **Publish flow:** Contributor saves draft; when “ready,” maintainer or owner sees approval request (e.g. queue or flag). Maintainer or owner sets approval (DB boolean/record); then “Publish” action copies draft → published and sets article status to `PUBLISHED`.
- **Theme:** Maintainer- and owner-only UI: preset selector + simple options (colors, fonts). Saves to Theme / KnowledgeBaseSettings.
- **Audit log:** Read-only list (who, what, when) for maintainers and owners (and optionally contributors for their own actions).
- **User management:** Owner-only: invite Maintainers/Contributors, change user role, remove users.
- **Assets:** Image upload for WYSIWYG: store in DB or object storage (e.g. S3); URLs stored in block content. Tables: block structure only; no separate “table” entity beyond block JSON.

---

## 6. Client SDK (Next.js package)

- **Purpose:** Fetch and render published articles inside the customer’s Next.js app.
- **Public API:** e.g. `getArticle(slug)`, `getAllArticles()`, or `getArticles(query)`; returns title, slug, published content, maybe excerpt. All read-only; no auth to CMS from client (public published content).
- **Rendering:** SDK exports React components (or a single `<Article content={...} />`) that render the block-based content (paragraph, image, table, etc.) with the **theme** applied.
- **Theme:** SDK fetches theme (preset + overrides) from your API or from a config endpoint. Single global theme per KB (per deployment). Styling via presets + simple options (CSS variables or theme object).
- **Hosting:** Customer’s Next.js app calls your backend (same deployment) or a read-only API; SDK can take `baseUrl` or `apiKey` for tenant/deployment identification if you add API keys later.

---

## 7. Theme system

- **Storage:** One record per KB (e.g. `Theme` or `KnowledgeBaseSettings`). Fields: `preset` (string/enum), `overrides` (JSON: primaryColor, fontFamily, headingFont, spacing, etc.).
- **Control panel:** Maintainer or owner selects preset + overrides via form (no raw CSS/code).
- **SDK:** Loads theme; maps preset + overrides to CSS variables or component props; renders blocks accordingly. One global theme for entire KB.

---

## 8. Publishing workflow (summary)

1. Contributor creates/edits article → saves → “last saved” (draft) updated.
2. Contributor marks “ready for publish” (or maintainer/owner discovers draft).
3. Maintainer or owner sets approval (DB boolean/record).
4. Maintainer or owner (or system) runs “Publish” action: copy draft content → “last published,” set article status to `PUBLISHED`, clear or keep approval flag as needed.
5. SDK only ever reads “last published” content and only for articles with status `PUBLISHED`.

---

## 9. Audit log (high-level)

- **Events:** e.g. `ARTICLE_CREATED`, `ARTICLE_UPDATED`, `ARTICLE_DELETED`, `ARTICLE_PUBLISHED`, `THEME_UPDATED`, `USER_INVITED`. Optional: `APPROVAL_REQUESTED`, `APPROVAL_GRANTED`.
- **Payload:** userId, action, resourceType, resourceId, timestamp; optional metadata (e.g. slug). No field-level diff. No retention/compliance requirements.

---

## 10. Docker & deployment

- **Dockerfile:** Build Next.js app (control panel + API); run with `node .next/standalone` or similar; env for `DATABASE_URL`, auth secrets, SSO client id/secret.
- **docker-compose (optional):** App + Postgres for local dev; customer supplies DB in production.
- **Env:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, OAuth credentials, optional `NEXT_PUBLIC_*` for SDK base URL. No tenant id in env if single-tenant per deployment.

---

## 11. Out of scope (from answers)

- Multi-tenant in one deployment.
- Multiple knowledge bases per tenant.
- Field-level audit / long-term retention.
- Contributor-editable theme.
- Maintainers adding/removing other users (only owners can).
- Custom CSS / design tokens in UI.
- Approval workflows beyond “maintainer sets boolean/record then publish.”

---

## 12. Suggested implementation order

1. **Project + DB:** Next.js app, Prisma schema (User, Article, Content/versioning, Theme, AuditLog, Invitation), migrations.
2. **Auth:** Email+password, then invitations, then SSO.
3. **Articles (draft):** CRUD, ownership, WYSIWYG (block-based), image upload.
4. **Publish flow:** Approval record/flag, “Publish” action, “last saved” vs “last published” versioning.
5. **Audit log:** Write on key actions; read-only UI for maintainers and owners.
6. **Theme:** Model + maintainer/owner UI; preset + overrides.
7. **SDK package:** Next.js package; fetch published articles + theme; block renderer + theme application.
8. **Docker:** Dockerfile, optional docker-compose for dev.

This plan is ready to be turned into tasks and Prisma schema; no code written yet per your request.

---

## 13. Quick delivery: what to consider next

**Decide first (unblocks everything)**  
- **WYSIWYG / block format:** Pick one editor and one block schema early (e.g. TipTap, Plate, or Lexical + a small block set: paragraph, heading, image, table). Lock the JSON shape so Prisma `Content.body` and the SDK renderer stay in sync.  
- **Prisma schema:** Finalize and run migrations for User, Article, ArticleVersion, Content, Theme, AuditLog, Invitation (and PublishApproval or approval fields on Article). Do this right after choosing the block format.

**Scope for v1 to ship faster**  
- **Auth:** Ship email+password first; add invitations, then SSO in follow-up releases.  
- **Theme:** One preset + a few overrides (e.g. primary color, font) in the first release; expand later.  
- **Audit log:** Write events from day one; build the read-only UI only when you need it (or keep it API-only at first).  
- **Images:** Start with URL-in-block or a single upload bucket + URL; avoid complex media library in v1.

**Order of work for speed**  
1. Project + Prisma + migrations.  
2. Auth (email+password only).  
3. Article CRUD + WYSIWYG (minimal blocks) + “last saved” only (no publish yet).  
4. Publish flow (approval + “last published” + ArticleVersion).  
5. SDK: fetch published article + render blocks (no theme at first, or one hardcoded preset).  
6. Theme model + one preset + maintainer/owner UI, then wire theme into SDK.  
7. Audit log write + simple UI; invitations; SSO.  
8. Docker when you need to hand off or deploy.

**Risks to watch**  
- **WYSIWYG:** Biggest variable. Use a maintained editor with blocks/images/tables out of the box; avoid building a custom editor.  
- **SDK:** Keep the public API small (e.g. `getArticle(slug)`, `getArticles()`, `getTheme()`). Same block schema as control panel so one renderer can serve both (control panel preview + SDK).

---

## 14. TipTap JSON block format (Content.body)

TipTap uses **ProseMirror’s document model**. Content is stored and restored via `editor.getJSON()` and `editor.commands.setContent(json)`. The same JSON is what you store in `Content.body` (e.g. Prisma `Json` type) and what the SDK renderer consumes.

### 14.1 Root structure

- **Root node:** Always `doc`.
- **Shape:** `{ type: 'doc', content: [ ... ] }`.
- **`content`:** Array of **block-level nodes** only (paragraph, heading, blockquote, image, table, list, etc.). Order is document order.

### 14.2 Block nodes (top-level or nested)

| Node type       | Usage                    | Attributes (attrs)                    | Content |
|----------------|---------------------------|----------------------------------------|--------|
| `doc`          | Root only                 | —                                      | Block+ |
| `paragraph`    | Body text                 | —                                      | Inline* (text, hardBreak) |
| `heading`      | H1–H6                     | `level: 1..6`                          | Inline* |
| `blockquote`   | Quote                     | —                                      | Block+ |
| `codeBlock`    | Code                      | `language` (optional)                  | Text (raw) or inline* |
| `bulletList`   | Unordered list            | —                                      | listItem+ |
| `orderedList`  | Ordered list              | `start` (optional, number)             | listItem+ |
| `listItem`     | One list item             | —                                      | Block+ (often paragraph) |
| `horizontalRule` | Divider                 | —                                      | — (leaf) |
| `image`        | Image                     | `src`, `alt`, `title` (all optional)   | — (leaf) |
| `table`        | Table                     | —                                      | tableRow+ |
| `tableRow`     | Row                       | —                                      | (tableCell \| tableHeader)* |
| `tableCell`    | Cell                      | —                                      | Block+ (often paragraph) |
| `tableHeader`  | Header cell               | —                                      | Block+ (often paragraph) |
| `hardBreak`    | Line break (inline)       | —                                      | — (leaf) |

You enable only the extensions you need (e.g. StarterKit + Image + Table). The JSON will only contain node types you registered.

### 14.3 Inline content and marks

- **`text`:** Inline node for actual characters. Optional `marks` array for formatting.
- **Marks** (attach to a `text` node): `bold`, `italic`, `strike`, `code`, `link` (attr: `href`), etc. Each mark is `{ type: 'bold' }` or `{ type: 'link', attrs: { href: '...' } }`.

Example paragraph with bold and link:

```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "Hello ", "marks": [] },
    { "type": "text", "text": "world", "marks": [{ "type": "bold" }] },
    { "type": "text", "text": " and ", "marks": [] },
    { "type": "text", "text": "link", "marks": [{ "type": "link", "attrs": { "href": "https://example.com" } }] }
  ]
}
```

### 14.4 Image node

- **Type:** `image`.
- **Attrs:** `src` (required for display), `alt`, `title` (optional strings).
- **Storage:** Store image files yourself (e.g. S3 or local upload); put the public URL in `src`. No nested content.

Example:

```json
{ "type": "image", "attrs": { "src": "https://cdn.example.com/abc.png", "alt": "Diagram", "title": "Overview" } }
```

### 14.5 Table structure

Tables are nested: `table` → `tableRow` → `tableCell` or `tableHeader` → block content (usually `paragraph`).

Example (2×2 with header row):

```json
{
  "type": "table",
  "content": [
    {
      "type": "tableRow",
      "content": [
        { "type": "tableHeader", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "A" }] }] },
        { "type": "tableHeader", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "B" }] }] }
      ]
    },
    {
      "type": "tableRow",
      "content": [
        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "1" }] }] },
        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "2" }] }] }
      ]
    }
  ]
}
```

### 14.6 Full document example

```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Getting started" }] },
    { "type": "paragraph", "content": [{ "type": "text", "text": "Here is an intro." }] },
    { "type": "image", "attrs": { "src": "https://cdn.example.com/intro.png", "alt": "Intro" } },
    { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Steps" }] },
    {
      "type": "orderedList", "attrs": { "start": 1 },
      "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "First step." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Second step." }] }] }
      ]
    }
  ]
}
```

### 14.7 Implementation notes

- **Prisma:** Store the root object (e.g. the `doc` node) in `Content.body` as `Json`. Validate or sanitize on write if needed; TipTap’s schema already constrains what the editor produces.
- **Control panel:** Use `editor.commands.setContent(body)` to load; `onUpdate` → `editor.getJSON()` to save.
- **SDK / read-only:** Use TipTap’s **Static Renderer** (`@tiptap/static-renderer`) or `generateHTML()` from `@tiptap/html` to turn JSON into HTML or React nodes without an editor instance. Use the **same extensions** (or a subset) as in the editor so node types and attrs match.
- **Versioning:** Draft and published each point to a `Content` row; both use this same JSON shape. No separate “block format” for draft vs published.
