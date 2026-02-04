"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { useCallback, useEffect } from "react";

const DEFAULT_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph", content: [] }] };

export type DocJSON = { type: "doc"; content?: unknown[] };

interface EditorProps {
  content?: DocJSON | null;
  onChange?: (json: DocJSON) => void;
  placeholder?: string;
  editable?: boolean;
}

export function Editor({
  content,
  onChange,
  placeholder = "Write something…",
  editable = true,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: (content ?? DEFAULT_DOC) as JSONContent,
    editable,
    editorProps: {
      attributes: {
        class: "focus:outline-none",
        style: "min-height: 200px; padding: 0.75rem;",
      },
    },
  });

  const stableOnChange = useCallback(
    (json: DocJSON) => {
      onChange?.(json);
    },
    [onChange]
  );

  useEffect(() => {
    if (!editor || !onChange) return;
    const handleUpdate = () => {
      stableOnChange(editor.getJSON() as DocJSON);
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, stableOnChange, onChange]);

  useEffect(() => {
    if (!editor || content === undefined) return;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(content)) {
      editor.commands.setContent((content ?? DEFAULT_DOC) as JSONContent);
    }
  }, [editor, content]);

  if (!editor) return <div className="min-h-[200px] p-3 border rounded">{placeholder}</div>;

  return (
    <div className="border rounded overflow-hidden bg-white">
      <EditorContent editor={editor} />
    </div>
  );
}
