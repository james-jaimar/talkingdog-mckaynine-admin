
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
];

export function RichTextEditor({ content, onChange, configurableFields = [] }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your email content...",
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

  const allMergeFields = [
    ...MERGE_FIELDS,
    ...configurableFields.map(f => ({ key: f.key, label: f.label }))
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-muted border-b p-2 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-accent" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-accent" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-accent" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-accent" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={editor.isActive("link") ? "bg-accent" : ""}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <div className="flex-1" />
        
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
      
      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[350px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]"
      />
    </div>
  );
}
