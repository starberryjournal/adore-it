import React, { useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Toolbar from "./Toolbar";

type Props = {
  content: string;
  setContent: (html: string) => void;
  onOpenImageSelector: (insertImage: (url: string) => void) => void;
};

const TiptapEditor: React.FC<Props> = ({
  content,
  setContent,
  onOpenImageSelector,
}) => {
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit, // no extra config needed here
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        placeholder: "Write here...",
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className="">
      <Toolbar editor={editor} onOpenImageSelector={onOpenImageSelector} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
