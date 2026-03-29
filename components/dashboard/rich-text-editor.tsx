"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        editorProps: {
            attributes: {
                class: "wysiwyg-editor",
            },
        },
        onUpdate({ editor: updatedEditor }) {
            onChange(updatedEditor.getHTML());
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        if (editor.getHTML() !== value) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [editor, value]);

    return <EditorContent editor={editor} />;
}
