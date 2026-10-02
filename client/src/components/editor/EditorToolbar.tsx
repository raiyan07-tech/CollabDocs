import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Undo2,
  Redo2,
  CodeXml,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, disabled = false }) => {
  if (!editor) return null;

  const ToolbarButton = ({
    isActive = false,
    onClick,
    icon,
    title,
  }: {
    isActive?: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg text-sm font-medium transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed text-gray-400'
          : isActive
          ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {/* History */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 dark:border-gray-800">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          icon={<Undo2 className="h-4 w-4" />}
          title="Undo (Ctrl+Z)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          icon={<Redo2 className="h-4 w-4" />}
          title="Redo (Ctrl+Y)"
        />
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200 dark:border-gray-800">
        <ToolbarButton
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={<Heading1 className="h-4 w-4" />}
          title="Heading 1"
        />
        <ToolbarButton
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 className="h-4 w-4" />}
          title="Heading 2"
        />
        <ToolbarButton
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 className="h-4 w-4" />}
          title="Heading 3"
        />
      </div>

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200 dark:border-gray-800">
        <ToolbarButton
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold className="h-4 w-4" />}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic className="h-4 w-4" />}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={<UnderlineIcon className="h-4 w-4" />}
          title="Underline (Ctrl+U)"
        />
        <ToolbarButton
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          icon={<Strikethrough className="h-4 w-4" />}
          title="Strikethrough"
        />
        <ToolbarButton
          isActive={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          icon={<Highlighter className="h-4 w-4" />}
          title="Highlight"
        />
        <ToolbarButton
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          icon={<Code className="h-4 w-4" />}
          title="Inline Code"
        />
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200 dark:border-gray-800">
        <ToolbarButton
          isActive={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          icon={<AlignLeft className="h-4 w-4" />}
          title="Align Left"
        />
        <ToolbarButton
          isActive={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          icon={<AlignCenter className="h-4 w-4" />}
          title="Align Center"
        />
        <ToolbarButton
          isActive={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          icon={<AlignRight className="h-4 w-4" />}
          title="Align Right"
        />
      </div>

      {/* Blocks & Lists */}
      <div className="flex items-center gap-0.5 pl-2">
        <ToolbarButton
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List className="h-4 w-4" />}
          title="Bullet List"
        />
        <ToolbarButton
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered className="h-4 w-4" />}
          title="Numbered List"
        />
        <ToolbarButton
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Quote className="h-4 w-4" />}
          title="Blockquote"
        />
        <ToolbarButton
          isActive={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          icon={<CodeXml className="h-4 w-4" />}
          title="Code Block"
        />
      </div>

      {disabled && (
        <span className="ml-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
          Read-only mode (Viewer)
        </span>
      )}
    </div>
  );
};
