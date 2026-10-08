"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TipTap editor whose HTML is mirrored into a hidden input named `name`, so it
 * posts with the surrounding form's native FormData. The output is sanitized
 * server-side (lib/admin/rich-text.ts); keep the two in step when adding tools.
 */
export default function RichTextEditor({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  error,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  hint?: string;
  error?: string[];
  required?: boolean;
}) {
  const [html, setHtml] = useState(defaultValue ?? "");
  const invalid = Boolean(error?.length);
  const labelId = `${name}-label`;
  const messageId = invalid ? `${name}-error` : hint ? `${name}-hint` : undefined;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue ?? "",
    // Rendered on the server too; let the client create the editor after hydration.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        ...(messageId ? { "aria-describedby": messageId } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(required ? { "aria-required": "true" } : {}),
        class: "rich-text min-h-40 px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="flex flex-col gap-1.5">
      <span
        id={labelId}
        className="text-sm font-semibold text-ink"
        onClick={() => editor?.commands.focus()}
      >
        {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
      </span>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-transparent bg-gray-3 transition-[border-color,box-shadow,background-color] hover:border-ink/10 focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/15",
          invalid && "border-red-500 bg-red-50/40"
        )}
      >
        <Toolbar editor={editor} label={label} />
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          // Same height as the editor, so the page doesn't jump on hydration.
          <div className="min-h-40" aria-hidden="true" />
        )}
      </div>

      <input type="hidden" name={name} value={html} />

      {invalid ? (
        <p id={`${name}-error`} role="alert" className="text-xs text-red-600">
          {error![0]}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-gray-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Toolbar({ editor, label }: { editor: Editor | null; label: string }) {
  // TipTap doesn't re-render on every keystroke; subscribe to just what the buttons show.
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor && {
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        h2: editor.isActive("heading", { level: 2 }),
        h3: editor.isActive("heading", { level: 3 }),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        blockquote: editor.isActive("blockquote"),
        link: editor.isActive("link"),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
      },
  });

  const chain = () => editor!.chain().focus();

  function toggleLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      chain().extendMarkRange("link").unsetLink().run();
      return;
    }
    const url = window.prompt("Link URL", "https://");
    if (!url || url === "https://") return;
    chain().extendMarkRange("link").setLink({ href: url }).run();
  }

  const disabled = !editor;

  return (
    <div
      role="toolbar"
      aria-label={`${label} formatting`}
      className="flex flex-wrap items-center gap-0.5 border-b border-line bg-white/60 px-2 py-1.5"
    >
      <ToolButton icon={Bold} label="Bold" active={state?.bold} disabled={disabled} onClick={() => chain().toggleBold().run()} />
      <ToolButton icon={Italic} label="Italic" active={state?.italic} disabled={disabled} onClick={() => chain().toggleItalic().run()} />
      <Divider />
      <ToolButton icon={Heading2} label="Heading" active={state?.h2} disabled={disabled} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolButton icon={Heading3} label="Subheading" active={state?.h3} disabled={disabled} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolButton icon={List} label="Bulleted list" active={state?.bulletList} disabled={disabled} onClick={() => chain().toggleBulletList().run()} />
      <ToolButton icon={ListOrdered} label="Numbered list" active={state?.orderedList} disabled={disabled} onClick={() => chain().toggleOrderedList().run()} />
      <ToolButton icon={Quote} label="Quote" active={state?.blockquote} disabled={disabled} onClick={() => chain().toggleBlockquote().run()} />
      <ToolButton icon={Link2} label={state?.link ? "Remove link" : "Link"} active={state?.link} disabled={disabled} onClick={toggleLink} />
      <span className="ml-auto flex gap-0.5">
        <ToolButton icon={Undo2} label="Undo" disabled={disabled || !state?.canUndo} onClick={() => chain().undo().run()} />
        <ToolButton icon={Redo2} label="Redo" disabled={disabled || !state?.canRedo} onClick={() => chain().redo().run()} />
      </span>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active ?? undefined}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-gray-2 transition-colors outline-none hover:bg-gray-3 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        active && "bg-ink text-white hover:bg-ink hover:text-white"
      )}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;
}
