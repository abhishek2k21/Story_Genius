"use client";

import { useState } from "react";
import {
    X,
    FileText,
    Link,
    Upload,
    Loader2,
    Check,
    AlertCircle,
} from "lucide-react";

interface ImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (content: string, source: string) => void;
}

type ImportTab = "paste" | "upload" | "url";

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
    const [activeTab, setActiveTab] = useState<ImportTab>("paste");
    const [pasteContent, setPasteContent] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    const handlePasteImport = () => {
        if (!pasteContent.trim()) {
            setError("Please paste some text content");
            return;
        }
        onImport(pasteContent, "paste");
        onClose();
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        const allowedTypes = [
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Only TXT and DOCX files are supported");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/import/file", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to parse file");
            }

            const { content } = await response.json();
            onImport(content, `file:${file.name}`);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to import file");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlImport = async () => {
        if (!urlInput.trim()) {
            setError("Please enter a URL");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/import/url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlInput }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch URL content");
            }

            const { content, title } = await response.json();
            onImport(content, `url:${title || urlInput}`);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to import from URL");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const tabs = [
        { id: "paste" as ImportTab, label: "Paste Text", icon: FileText },
        { id: "upload" as ImportTab, label: "Upload File", icon: Upload },
        { id: "url" as ImportTab, label: "From URL", icon: Link },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Import Story</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setError(null);
                            }}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {activeTab === "paste" && (
                        <div className="space-y-4">
                            <textarea
                                value={pasteContent}
                                onChange={(e) => setPasteContent(e.target.value)}
                                placeholder="Paste your story content here..."
                                className="w-full h-64 p-4 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    {pasteContent.split(/\s+/).filter(Boolean).length} words
                                </span>
                                <button
                                    onClick={handlePasteImport}
                                    disabled={!pasteContent.trim()}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Import Text
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "upload" && (
                        <div className="space-y-4">
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg transition-colors ${dragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-muted-foreground/50"
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground">
                                            Processing file...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Drag and drop your file here, or
                                        </p>
                                        <label className="cursor-pointer">
                                            <span className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">
                                                Browse Files
                                            </span>
                                            <input
                                                type="file"
                                                accept=".txt,.docx"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        handleFileUpload(e.target.files[0]);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Supported formats: TXT, DOCX
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "url" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Story URL</label>
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/story"
                                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <p className="text-xs text-muted-foreground">
                                    We'll extract the main content from the page
                                </p>
                            </div>
                            <button
                                onClick={handleUrlImport}
                                disabled={!urlInput.trim() || isLoading}
                                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Fetching content...
                                    </>
                                ) : (
                                    <>
                                        <Link className="w-4 h-4" />
                                        Import from URL
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
