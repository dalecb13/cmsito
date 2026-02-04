// src/client.ts
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tiny CMS: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  return res.json();
}
async function getArticle(config, slug) {
  const base = config.baseUrl.replace(/\/$/, "");
  return fetchJson(`${base}/api/public/articles/${encodeURIComponent(slug)}`);
}
async function getArticles(config) {
  const base = config.baseUrl.replace(/\/$/, "");
  return fetchJson(`${base}/api/public/articles`);
}
async function getTheme(config) {
  const base = config.baseUrl.replace(/\/$/, "");
  return fetchJson(`${base}/api/theme`);
}

// src/render.tsx
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { jsx } from "react/jsx-runtime";
var EXTENSIONS = [
  StarterKit,
  Image.configure({ inline: false }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell
];
function ArticleContent({
  content,
  theme,
  className = ""
}) {
  const html = generateHTML(content, EXTENSIONS);
  const style = {};
  if (theme?.primaryColor) style.color = theme.primaryColor;
  if (theme?.fontFamily) style.fontFamily = theme.fontFamily;
  const headingFont = theme?.headingFont ?? theme?.fontFamily;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `tiny-cms-content ${className}`.trim(),
      style: headingFont ? { ...style, ["--tiny-cms-heading-font"]: headingFont } : style,
      dangerouslySetInnerHTML: { __html: html }
    }
  );
}
export {
  ArticleContent,
  getArticle,
  getArticles,
  getTheme
};
