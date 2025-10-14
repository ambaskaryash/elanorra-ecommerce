'use client';

import React, { useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

type RichTextEditorProps = {
  value?: string;
  onChange: (html: string) => void;
  className?: string;
};

export default function RichTextEditor({ value = '', onChange, className = '' }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Write your post content here…' }),
    ],
    content: value || '<p></p>',
    autofocus: true,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  const uploadImageAndInsert = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      const url: string = data.url;
      editor?.chain().focus().setImage({ src: url, alt: 'image' }).run();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const triggerImageUpload = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>I</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>U</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('strike') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>S</button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>H1</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>H2</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>H3</button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>• List</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>1. List</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('blockquote') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>❝</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('codeBlock') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>{'</>'}</button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>⟸</button>
        <button type="button" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>⟷</button>
        <button type="button" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>⟹</button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" onClick={() => {
          const url = prompt('Enter URL');
          if (!url) return;
          editor?.chain().focus().setLink({ href: url, target: '_blank' }).run();
        }} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Link</button>
        <button type="button" onClick={() => editor?.chain().focus().unsetLink().run()} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Unlink</button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" onClick={triggerImageUpload} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Image</button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImageAndInsert(file);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }} />

        <span className="ml-auto flex gap-2">
          <button type="button" onClick={() => editor?.chain().focus().undo().run()} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Undo</button>
          <button type="button" onClick={() => editor?.chain().focus().redo().run()} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Redo</button>
        </span>
      </div>

      {/* Editor */}
      <div className="p-3 min-h-[240px] bg-white">
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
    </div>
  );
}