"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { useAI, WritingMode, ToneType } from "@/hooks/use-ai";

interface AIToolbarProps {
    editor: Editor | null;
    onInsert?: (text: string) => void;
}

const AI_MODES: { mode: WritingMode; label: string; icon: string }[] = [
    { mode: "improve", label: "Improve", icon: "✨" },
    { mode: "expand", label: "Expand", icon: "📝" },
    { mode: "shorten", label: "Shorten", icon: "✂️" },
    { mode: "fix", label: "Fix Grammar", icon: "🔧" },
    { mode: "continue", label: "Continue", icon: "➡️" },
];

const TONE_OPTIONS: { tone: ToneType; label: string }[] = [
    { tone: "professional", label: "Professional" },
    { tone: "dramatic", label: "Dramatic" },
    { tone: "funny", label: "Funny" },
    { tone: "dark", label: "Dark" },
    { tone: "romantic", label: "Romantic" },
    { tone: "mysterious", label: "Mysterious" },
];

export function AIToolbar({ editor, onInsert }: AIToolbarProps) {
    const { processText, streamContinue, cancelStream, isLoading, isStreaming, streamedText, error } = useAI();
    const [showToneMenu, setShowToneMenu] = useState(false);
    const [selectedTone, setSelectedTone] = useState<ToneType>("professional");

    const getSelectedText = (): string => {
        if (!editor) return "";
        const { from, to } = editor.state.selection;
        return editor.state.doc.textBetween(from, to, " ");
    };

    const getContextText = (): string => {
        if (!editor) return "";
        // Get ~500 characters before selection as context
        const { from } = editor.state.selection;
        const start = Math.max(0, from - 500);
        return editor.state.doc.textBetween(start, from, " ");
    };

    const handleAIAction = async (mode: WritingMode) => {
        const selectedText = getSelectedText();
        const context = getContextText();

        if (!selectedText && mode !== "continue") {
            alert("Please select some text first");
            return;
        }

        if (mode === "continue") {
            // Use streaming for continuation
            const textToUse = selectedText || editor?.state.doc.textBetween(0, editor.state.doc.content.size, " ") || "";
            streamContinue(textToUse.slice(-1000), context); // Last 1000 chars + context
            return;
        }

        try {
            const result = await processText({
                text: selectedText,
                mode,
                context,
                tone: mode === "tone" ? selectedTone : undefined,
            });

            if (onInsert) {
                onInsert(result);
            } else if (editor) {
                // Replace selection with result
                editor.chain().focus().deleteSelection().insertContent(result).run();
            }
        } catch (err) {
            console.error("AI processing failed:", err);
        }
    };

    const handleToneChange = async () => {
        await handleAIAction("tone");
        setShowToneMenu(false);
    };

    const handleInsertStreamed = () => {
        if (editor && streamedText) {
            editor.chain().focus().insertContent(streamedText).run();
        }
    };

    return (
        <div className="ai-toolbar">
            <div className="ai-toolbar-buttons">
                {AI_MODES.map(({ mode, label, icon }) => (
                    <button
                        key={mode}
                        onClick={() => handleAIAction(mode)}
                        disabled={isLoading || isStreaming}
                        className="ai-btn"
                        title={label}
                    >
                        <span>{icon}</span>
                        <span className="ai-btn-label">{label}</span>
                    </button>
                ))}

                {/* Tone dropdown */}
                <div className="ai-tone-wrapper">
                    <button
                        onClick={() => setShowToneMenu(!showToneMenu)}
                        disabled={isLoading || isStreaming}
                        className="ai-btn"
                        title="Change Tone"
                    >
                        <span>🎭</span>
                        <span className="ai-btn-label">Tone</span>
                    </button>

                    {showToneMenu && (
                        <div className="ai-tone-menu">
                            {TONE_OPTIONS.map(({ tone, label }) => (
                                <button
                                    key={tone}
                                    onClick={() => {
                                        setSelectedTone(tone);
                                        handleToneChange();
                                    }}
                                    className={`ai-tone-option ${selectedTone === tone ? "active" : ""}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading/Streaming indicator */}
            {(isLoading || isStreaming) && (
                <div className="ai-status">
                    <span className="ai-spinner" />
                    <span>{isStreaming ? "Writing..." : "Processing..."}</span>
                    {isStreaming && (
                        <button onClick={cancelStream} className="ai-cancel-btn">
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {/* Streamed text preview */}
            {streamedText && !isStreaming && (
                <div className="ai-preview">
                    <div className="ai-preview-text">{streamedText}</div>
                    <div className="ai-preview-actions">
                        <button onClick={handleInsertStreamed} className="ai-insert-btn">
                            Insert
                        </button>
                        <button onClick={() => { }} className="ai-discard-btn">
                            Discard
                        </button>
                    </div>
                </div>
            )}

            {/* Error display */}
            {error && <div className="ai-error">{error}</div>}

            <style jsx>{`
                .ai-toolbar {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 8px;
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 8px;
                    border: 1px solid var(--border, #2a2a4e);
                }
                .ai-toolbar-buttons {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                .ai-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    background: var(--bg-tertiary, #252547);
                    border: 1px solid var(--border, #3a3a6e);
                    border-radius: 6px;
                    color: var(--text, #fff);
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s;
                }
                .ai-btn:hover:not(:disabled) {
                    background: var(--accent, #6366f1);
                }
                .ai-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .ai-btn-label {
                    display: none;
                }
                @media (min-width: 640px) {
                    .ai-btn-label {
                        display: inline;
                    }
                }
                .ai-tone-wrapper {
                    position: relative;
                }
                .ai-tone-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    z-index: 10;
                    background: var(--bg-secondary, #1a1a2e);
                    border: 1px solid var(--border, #3a3a6e);
                    border-radius: 6px;
                    padding: 4px;
                    min-width: 120px;
                }
                .ai-tone-option {
                    display: block;
                    width: 100%;
                    padding: 6px 10px;
                    background: transparent;
                    border: none;
                    color: var(--text, #fff);
                    text-align: left;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .ai-tone-option:hover,
                .ai-tone-option.active {
                    background: var(--accent, #6366f1);
                }
                .ai-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: var(--text-secondary, #a0a0c0);
                }
                .ai-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid var(--border, #3a3a6e);
                    border-top-color: var(--accent, #6366f1);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                .ai-cancel-btn {
                    padding: 4px 8px;
                    background: #ef4444;
                    border: none;
                    border-radius: 4px;
                    color: #fff;
                    cursor: pointer;
                    font-size: 12px;
                }
                .ai-preview {
                    background: var(--bg-tertiary, #252547);
                    border-radius: 6px;
                    padding: 10px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .ai-preview-text {
                    font-size: 14px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                }
                .ai-preview-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }
                .ai-insert-btn {
                    padding: 6px 12px;
                    background: var(--accent, #6366f1);
                    border: none;
                    border-radius: 4px;
                    color: #fff;
                    cursor: pointer;
                }
                .ai-discard-btn {
                    padding: 6px 12px;
                    background: transparent;
                    border: 1px solid var(--border, #3a3a6e);
                    border-radius: 4px;
                    color: var(--text, #fff);
                    cursor: pointer;
                }
                .ai-error {
                    padding: 8px;
                    background: #7f1d1d;
                    border-radius: 4px;
                    color: #fca5a5;
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
}
