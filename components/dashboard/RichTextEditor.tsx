"use client";

import { useEffect, useRef, useState } from "react";
import { uploadImage, UploadError } from "@/lib/upload";

const TOOLBAR_ACTIONS: { label: string; command: string; arg?: string; title: string }[] = [
  { label: "B", command: "bold", title: "Bold" },
  { label: "I", command: "italic", title: "Italic" },
  { label: "U", command: "underline", title: "Underline" },
  { label: "H2", command: "formatBlock", arg: "H2", title: "Section heading" },
  { label: "H3", command: "formatBlock", arg: "H3", title: "Subheading" },
  { label: "❝", command: "formatBlock", arg: "BLOCKQUOTE", title: "Quote" },
  { label: "¶", command: "formatBlock", arg: "P", title: "Paragraph" },
  { label: "•", command: "insertUnorderedList", title: "Bulleted list" },
  { label: "1.", command: "insertOrderedList", title: "Numbered list" }
];

export function RichTextEditor({
  value,
  onChange
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedValueRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Only push `value` into the DOM when it changes from *outside* this
  // component (e.g. switching which draft is loaded) — never on every
  // keystroke, or the cursor would jump to the start on each render.
  useEffect(() => {
    if (editorRef.current && loadedValueRef.current !== value) {
      editorRef.current.innerHTML = value || "";
      loadedValueRef.current = value;
    }
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    loadedValueRef.current = html;
    onChange(html);
  };

  const runCommand = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt("Link URL");
    if (!url) return;
    runCommand("createLink", url);
  };

  const insertImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file, "inline");
      editorRef.current?.focus();
      document.execCommand("insertImage", false, url);
      emitChange();
    } catch (err) {
      setError(err instanceof UploadError ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar" role="toolbar" aria-label="Formatting">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.label + action.command}
            type="button"
            title={action.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(action.command, action.arg)}
          >
            {action.label}
          </button>
        ))}
        <button type="button" title="Insert link" onMouseDown={(event) => event.preventDefault()} onClick={insertLink}>
          🔗
        </button>
        <button
          type="button"
          title="Insert image"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "…" : "🖼"}
        </button>
        <span className="rich-editor-toolbar-divider" aria-hidden="true" />
        <button type="button" title="Undo" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("undo")}>
          ↺
        </button>
        <button type="button" title="Redo" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("redo")}>
          ↻
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(event) => insertImage(event.target.files?.[0])}
        />
      </div>
      <div
        ref={editorRef}
        className="rich-editor-surface"
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder="Write your story…"
      />
      {error && <span className="upload-error">{error}</span>}
    </div>
  );
}
