import React, { forwardRef, useImperativeHandle } from "react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Italic from "@tiptap/extension-italic";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Blockquote from "@tiptap/extension-blockquote";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { CommandProps, Mark, mergeAttributes } from "@tiptap/core";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  List as ListIcon,
  ListOrdered,
  Quote,
  Highlighter,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Eraser,
  Plus,
} from "lucide-react";

export type RichTextEditorHandle = {
  getHTML: () => string;
  setHTML: (html: string) => void;
};

type Props = {
  value: string;                   // HTML
  onChange: (html: string) => void;
  placeholder?: string;
};

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RTE(
  { value, onChange, placeholder }: Props,
  ref
) {
  const [fontSize, setFontSize] = React.useState<number>(16);
  const clamp = (n: number, min = 10, max = 48) => Math.min(max, Math.max(min, n));
  const readFontSize = (ed: Editor | null) => {
    if (!ed) return 16;
  // Prefer span-level textStyle; otherwise check heading node attribute; else fallback to defaults
  const ts = ed.getAttributes('textStyle')?.fontSize as string | number | undefined;
  const fs = ed.getAttributes('fontSize')?.size as string | number | undefined;
  const h = ed.getAttributes('heading')?.fontSize as string | number | undefined;
  const attr = ts ?? fs ?? h;
    if (!attr) {
      // Fallback to heading defaults when no explicit textStyle is set
      if (ed.isActive('heading', { level: 1 })) return 28;
      if (ed.isActive('heading', { level: 2 })) return 24;
      if (ed.isActive('heading', { level: 3 })) return 20;
      if (ed.isActive('heading', { level: 4 })) return 18;
      return 16;
    }
    if (typeof attr === 'number') return clamp(attr);
    const m = String(attr).match(/(\d+)(px)?/);
    return clamp(m ? parseInt(m[1], 10) : 16);
  };
  // Extend heading to support fontSize per node
  const HeadingWithSize = React.useMemo(() => Heading.extend({
    addAttributes() {
      return {
        fontSize: {
          default: null,
          parseHTML: element => (element as HTMLElement).style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      };
    },
  }), []);

  const FontSizeMark = React.useMemo(() => Mark.create({
    name: 'fontSize',
    inclusive: true,
    addAttributes() {
      return {
        size: {
          default: null,
          parseHTML: element => (element as HTMLElement).style.fontSize || null,
          renderHTML: attrs => attrs.size ? { style: `font-size: ${attrs.size}` } : {},
        },
      };
    },
    parseHTML() {
      return [
        { tag: 'span[style*="font-size"]' },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ['span', mergeAttributes(HTMLAttributes), 0];
    },
    addCommands() {
      return {
        setFontSize:
          (size: string) => ({ chain }: CommandProps) => chain().setMark('fontSize', { size }).run(),
        unsetFontSize:
          () => ({ chain }: CommandProps) => chain().unsetMark('fontSize').run(),
      };
    },
  }), []);

  // Consistent font stacks and key mapping for the font family Select
  const FONT_STACKS: Record<'system'|'sans'|'serif'|'mono', string> = React.useMemo(() => ({
    system: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    sans: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  }), []);
  const getFontKeyFromAttr = React.useCallback((attr?: string): 'default'|'system'|'sans'|'serif'|'mono' => {
    if (!attr) return 'default';
    for (const [k, v] of Object.entries(FONT_STACKS) as Array<["system"|"sans"|"serif"|"mono", string]>) {
      if (attr === v) return k as 'system'|'sans'|'serif'|'mono';
    }
    return 'default';
  }, [FONT_STACKS]);

  const editor = useEditor({
    content: value || "",
    extensions: [
      StarterKit.configure({
        heading: false, // use explicit Heading extension
        italic: false,  // use explicit Italic extension
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
  HeadingWithSize.configure({ levels: [1,2,3,4] }),
      FontSizeMark,
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
  Italic,
      Underline,
      Link.configure({ openOnClick: true }),
      Placeholder.configure({ placeholder: placeholder || "Write notes..." }),
  Highlight.configure({ multicolor: false }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
      // Custom FontSize mark for reliable inline sizing
  FontFamily,
    ],
    editorProps: {
      attributes: {
        class:
          "tiptap prose dark:prose-invert max-w-none min-h-[280px] outline-none px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: ({ editor }) => {
      setFontSize(readFontSize(editor));
    },
    onCreate: ({ editor }) => {
      setFontSize(readFontSize(editor));
    }
  });

  const toggle = (cmd: () => void) => () => { cmd(); };

  // Keep editor content in sync when parent value changes (e.g., switching modules)
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (typeof value === "string" && value !== current) {
  // Do not emit update or create a new history step on external sync
  editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() ?? "",
    setHTML: (html: string) => {
      if (editor) editor.commands.setContent(html, { emitUpdate: true });
    },
  }), [editor]);

  if (!editor) return null;

  // Light, unobtrusive icon button base for toolbar (avoids dark initial look in light mode)
  const iconBtnBase = "h-8 w-8 rounded-xl bg-transparent text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/10";
  const activeCls = "ring-1 ring-black/10 dark:ring-white/15 bg-black/5 dark:bg-white/10";

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-black/10 dark:border-white/10">
        {/* Font family chooser */}
        <Select
          value={getFontKeyFromAttr(editor.getAttributes('textStyle')?.fontFamily as string | undefined)}
          onValueChange={(v: 'default'|'system'|'sans'|'serif'|'mono') => {
            const chain = editor.chain().focus();
            if (v === 'default') {
              chain.unsetFontFamily().run();
              return;
            }
            const css = FONT_STACKS[v];
            chain.setFontFamily(css).run();
          }}
        >
          <SelectTrigger className="h-8 rounded-xl w-[180px] bg-white/70 dark:bg-neutral-900/60">
            <SelectValue placeholder="Font family" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="system">System UI</SelectItem>
            <SelectItem value="sans">Sans-serif</SelectItem>
            <SelectItem value="serif">Serif</SelectItem>
            <SelectItem value="mono">Monospace</SelectItem>
          </SelectContent>
        </Select>

        {/* Inline marks */}
        <div className="flex gap-1 pl-1 border-l border-black/10 dark:border-white/10">
          <Button aria-label="Bold" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleBold().run())} className={`${iconBtnBase} ${editor.isActive('bold') ? activeCls : ''}`}>
            <BoldIcon className="h-4 w-4" />
          </Button>
          <Button aria-label="Italic" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleItalic().run())} className={`${iconBtnBase} ${editor.isActive('italic') ? activeCls : ''}`}>
            <ItalicIcon className="h-4 w-4" />
          </Button>
          <Button aria-label="Underline" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleUnderline().run())} className={`${iconBtnBase} ${editor.isActive('underline') ? activeCls : ''}`}>
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button aria-label="Strikethrough" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleStrike().run())} className={`${iconBtnBase} ${editor.isActive('strike') ? activeCls : ''}`}>
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button aria-label="Code" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleCode().run())} className={`${iconBtnBase} ${editor.isActive('code') ? activeCls : ''}`}>
            <CodeIcon className="h-4 w-4" />
          </Button>
          <Button aria-label="Highlight" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleHighlight().run())} className={`${iconBtnBase} ${editor.isActive('highlight') ? activeCls : ''}`}>
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        {/* Blocks */}
        <div className="flex gap-1 pl-1 border-l border-black/10 dark:border-white/10">
          <Button aria-label="Bullet list" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleBulletList().run())} className={`${iconBtnBase} ${editor.isActive('bulletList') ? activeCls : ''}`}>
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button aria-label="Ordered list" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleOrderedList().run())} className={`${iconBtnBase} ${editor.isActive('orderedList') ? activeCls : ''}`}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button aria-label="Blockquote" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleBlockquote().run())} className={`${iconBtnBase} ${editor.isActive('blockquote') ? activeCls : ''}`}>
            <Quote className="h-4 w-4" />
          </Button>
          <Button aria-label="Divider" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().setHorizontalRule().run())} className={`${iconBtnBase}`}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button aria-label="Code block" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().toggleCodeBlock().run())} className={`${iconBtnBase} ${editor.isActive('codeBlock') ? activeCls : ''}`}>
            <CodeIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 pl-1 border-l border-black/10 dark:border-white/10">
          <Button aria-label="Align left" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().setTextAlign('left').run())} className={`${iconBtnBase} ${editor.isActive({ textAlign: 'left' }) ? activeCls : ''}`}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button aria-label="Align center" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().setTextAlign('center').run())} className={`${iconBtnBase} ${editor.isActive({ textAlign: 'center' }) ? activeCls : ''}`}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button aria-label="Align right" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().setTextAlign('right').run())} className={`${iconBtnBase} ${editor.isActive({ textAlign: 'right' }) ? activeCls : ''}`}>
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button aria-label="Justify" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().setTextAlign('justify').run())} className={`${iconBtnBase} ${editor.isActive({ textAlign: 'justify' }) ? activeCls : ''}`}>
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        {/* Font size: numeric with +/- controls */}
        <div className="flex items-center gap-1 pl-1 border-l border-black/10 dark:border-white/10">
      <Button
            aria-label="Decrease font size"
            size="icon"
            variant="ghost"
            className={`${iconBtnBase}`}
            onClick={() => {
              const next = clamp(fontSize - 1);
              setFontSize(next);
              editor.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).setMark('fontSize', { size: `${next}px` }).run();
            }}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => {
              const n = clamp(parseInt(e.target.value || '0', 10));
              setFontSize(n);
              editor.chain().focus().setMark('textStyle', { fontSize: `${n}px` }).setMark('fontSize', { size: `${n}px` }).run();
            }}
            className="h-8 w-16 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 text-center text-sm"
          />
          <Button
            aria-label="Increase font size"
            size="icon"
            variant="ghost"
            className={`${iconBtnBase}`}
            onClick={() => {
              const next = clamp(fontSize + 1);
              setFontSize(next);
              editor.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).setMark('fontSize', { size: `${next}px` }).run();
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* History / Clear */}
        <div className="ml-auto flex gap-1">
          <Button aria-label="Undo" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().undo().run())} className={`${iconBtnBase}`}>
            <UndoIcon className="h-4 w-4" />
          </Button>
          <Button aria-label="Redo" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().redo().run())} className={`${iconBtnBase}`}>
            <RedoIcon className="h-4 w-4" />
          </Button>
          <Button aria-label="Clear formatting" size="icon" variant="ghost" onClick={toggle(() => editor.chain().focus().unsetAllMarks().clearNodes().run())} className={`${iconBtnBase}`}>
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextEditor;
