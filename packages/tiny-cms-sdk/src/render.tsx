import * as React from "react";
import { generateHTML, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import type { DocJSON } from "./client";

const EXTENSIONS = [
  StarterKit,
  Image.configure({ inline: false }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

export interface ThemeOverrides {
  primaryColor?: string;
  fontFamily?: string;
  headingFont?: string;
  [key: string]: unknown;
}

export interface ArticleContentProps {
  content: DocJSON;
  theme?: ThemeOverrides | null;
  className?: string;
}

/** Renders TipTap/ProseMirror JSON as HTML with optional theme CSS variables. */
export function ArticleContent({
  content,
  theme,
  className = "",
}: ArticleContentProps) {
  const html = generateHTML(content as JSONContent, EXTENSIONS);
  const style: React.CSSProperties = {};
  if (theme?.primaryColor) style.color = theme.primaryColor;
  if (theme?.fontFamily) style.fontFamily = theme.fontFamily;
  const headingFont = theme?.headingFont ?? theme?.fontFamily;
  return (
    <div
      className={`tiny-cms-content ${className}`.trim()}
      style={
        headingFont
          ? { ...style, ["--tiny-cms-heading-font" as string]: headingFont }
          : style
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
