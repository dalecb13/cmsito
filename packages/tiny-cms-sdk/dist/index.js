"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ArticleContent: () => ArticleContent,
  getArticle: () => getArticle,
  getArticles: () => getArticles,
  getTheme: () => getTheme
});
module.exports = __toCommonJS(index_exports);

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
var import_core = require("@tiptap/core");
var import_starter_kit = __toESM(require("@tiptap/starter-kit"));
var import_extension_image = __toESM(require("@tiptap/extension-image"));
var import_extension_table = require("@tiptap/extension-table");
var import_jsx_runtime = require("react/jsx-runtime");
var EXTENSIONS = [
  import_starter_kit.default,
  import_extension_image.default.configure({ inline: false }),
  import_extension_table.Table.configure({ resizable: true }),
  import_extension_table.TableRow,
  import_extension_table.TableHeader,
  import_extension_table.TableCell
];
function ArticleContent({
  content,
  theme,
  className = ""
}) {
  const html = (0, import_core.generateHTML)(content, EXTENSIONS);
  const style = {};
  if (theme?.primaryColor) style.color = theme.primaryColor;
  if (theme?.fontFamily) style.fontFamily = theme.fontFamily;
  const headingFont = theme?.headingFont ?? theme?.fontFamily;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      className: `tiny-cms-content ${className}`.trim(),
      style: headingFont ? { ...style, ["--tiny-cms-heading-font"]: headingFont } : style,
      dangerouslySetInnerHTML: { __html: html }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArticleContent,
  getArticle,
  getArticles,
  getTheme
});
