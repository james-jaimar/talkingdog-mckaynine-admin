
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StyledTable, StyledTableRow, StyledTableCell, StyledTableHeader } from "@/lib/tiptap/styled-table-extensions";
import { StyledParagraph } from "@/lib/tiptap/styled-block-extensions";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Palette,
  Highlighter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfigurableField } from "@/hooks/usePlatformTemplates";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  configurableFields?: ConfigurableField[];
}

const MERGE_FIELDS = [
  { key: "handler_name", label: "Handler Name" },
  { key: "handler_email", label: "Handler Email" },
  { key: "handler_phone", label: "Handler Phone" },
  { key: "dog_name", label: "Dog Name" },
  { key: "dog_breed", label: "Dog Breed" },
  { key: "branch_name", label: "Branch Name" },
  { key: "branch_email", label: "Branch Email" },
  { key: "branch_phone", label: "Branch Phone" },
  { key: "custom_message", label: "Personal Note" },
];

const TEXT_COLORS = [
  { color: "#000000", label: "Black" },
  { color: "#374151", label: "Gray" },
  { color: "#DC2626", label: "Red" },
  { color: "#EA580C", label: "Orange" },
  { color: "#CA8A04", label: "Yellow" },
  { color: "#16A34A", label: "Green" },
  { color: "#2563EB", label: "Blue" },
  { color: "#7C3AED", label: "Purple" },
];

const HIGHLIGHT_COLORS = [
  { color: "#FEF08A", label: "Yellow" },
  { color: "#BBF7D0", label: "Green" },
  { color: "#BFDBFE", label: "Blue" },
  { color: "#FECACA", label: "Red" },
  { color: "#E9D5FF", label: "Purple" },
  { color: "#FED7AA", label: "Orange" },
];

export function RichTextEditor({ content, onChange, configurableFields = [] }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      StyledParagraph,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your email content... You can paste from Word!",
      }),
      StyledTable.configure({
        resizable: true,
      }),
      StyledTableRow,
      StyledTableCell,
      StyledTableHeader,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const insertMergeField = (key: string) => {
    editor.chain().focus().insertContent(`{{${key}}}`).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-muted border-b p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-accent" : ""}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-accent" : ""}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-accent" : ""}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        {/* Text color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Text Color">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.color}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.color }}
                  onClick={() => editor.chain().focus().setColor(c.color).run()}
                  title={c.label}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Remove color
            </Button>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Highlight">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-3 gap-1">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.color}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.color }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: c.color }).run()}
                  title={c.label}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              Remove highlight
            </Button>
          </PopoverContent>
        </Popover>
        
        <div className="w-px bg-border mx-1" />
        
        {/* Headings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        {/* Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? "bg-accent" : ""}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? "bg-accent" : ""}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? "bg-accent" : ""}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-accent" : ""}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-accent" : ""}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        {/* Table */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Table">
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={insertTable}>
              Insert Table (3x3)
            </DropdownMenuItem>
            {editor.isActive('table') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                  Add Column Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  Add Column After
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                  Delete Column
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                  Add Row Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                  Add Row After
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                  Delete Row
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>
                  Delete Table
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={editor.isActive("link") ? "bg-accent" : ""}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <div className="flex-1" />
        
        {/* Merge Fields */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Code className="h-4 w-4 mr-1" />
              Insert Field
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              System Fields
            </div>
            {MERGE_FIELDS.map((field) => (
              <DropdownMenuItem
                key={field.key}
                onClick={() => insertMergeField(field.key)}
              >
                <Code className="h-3 w-3 mr-2 text-muted-foreground" />
                {field.label}
                <span className="ml-auto text-xs text-muted-foreground">
                  {`{{${field.key}}}`}
                </span>
              </DropdownMenuItem>
            ))}
            {configurableFields.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                  Configurable Fields
                </div>
                {configurableFields.map((field) => (
                  <DropdownMenuItem
                    key={field.key}
                    onClick={() => insertMergeField(field.key)}
                  >
                    <Code className="h-3 w-3 mr-2 text-blue-500" />
                    {field.label}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {`{{${field.key}}}`}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Editor - keep styles from Word by avoiding opinionated prose/table overrides */}
      <EditorContent
        editor={editor}
        className="max-w-none p-4 min-h-[350px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]"
      />
    </div>
  );
}
