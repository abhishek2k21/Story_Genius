"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import { useCallback, useEffect, useState } from "react";
import { EditorToolbar } from "./editor-toolbar";

interface TipTapEditorProps {
    content?: string;
    onUpdate?: (content: string) => void;
    onWordCountChange?: (count: number) => void;
    placeholder?: string;
    editable?: boolean;
    autoSaveDelay?: number;
}

export function TipTapEditor({
    content = "",
    onUpdate,
    onWordCountChange,
    placeholder = "Start writing your story...",
    editable = true,
    autoSaveDelay = 2000,
}: TipTapEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            CharacterCount,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const wordCount = editor.storage.characterCount.words();

            onWordCountChange?.(wordCount);

            // Debounced auto-save
            setIsSaving(true);
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3",
            },
        },
    });

    // Auto-save effect with debounce
    useEffect(() => {
        if (!isSaving || !editor) return;

        const timer = setTimeout(() => {
            const html = editor.getHTML();
            onUpdate?.(html);
            setIsSaving(false);
            setLastSaved(new Date());
        }, autoSaveDelay);

        return () => clearTimeout(timer);
    }, [isSaving, editor, onUpdate, autoSaveDelay]);

    // Update content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const wordCount = editor?.storage.characterCount?.words() ?? 0;
    const charCount = editor?.storage.characterCount?.characters() ?? 0;

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
            <EditorToolbar
                editor={editor}
                isSaving={isSaving}
                lastSaved={lastSaved}
                wordCount={wordCount}
                charCount={charCount}
            />
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    );
}

export { Editor };
