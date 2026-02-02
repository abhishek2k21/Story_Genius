"use client";

import { useState, useEffect } from "react";
import {
    X,
    BookOpen,
    Sparkles,
    Check,
    ChevronRight,
} from "lucide-react";

interface Template {
    id: string;
    name: string;
    genre: string;
    description: string | null;
    structure: {
        acts?: { name: string; description: string }[];
        suggestedChapters?: string[];
    };
    exampleContent: string | null;
}

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: Template) => void;
}

const genreIcons: Record<string, string> = {
    fantasy: "🏰",
    "sci-fi": "🚀",
    romance: "💕",
    horror: "👻",
    mystery: "🔍",
    thriller: "⚡",
    drama: "🎭",
    comedy: "😂",
    adventure: "🗺️",
    historical: "📜",
    other: "📖",
};

const genreColors: Record<string, string> = {
    fantasy: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
    "sci-fi": "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
    romance: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
    horror: "from-red-500/20 to-orange-800/20 border-red-500/30",
    mystery: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    thriller: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    drama: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
    comedy: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    adventure: "from-teal-500/20 to-cyan-500/20 border-teal-500/30",
    historical: "from-amber-600/20 to-yellow-700/20 border-amber-600/30",
    other: "from-gray-500/20 to-slate-500/20 border-gray-500/30",
};

export function TemplateSelector({ isOpen, onClose, onSelect }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const response = await fetch("/api/templates");
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex">
                {/* Template Grid */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold">Choose a Template</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-muted rounded-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-32 bg-muted animate-pulse rounded-lg"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Blank Project Option */}
                                <button
                                    onClick={() =>
                                        onSelect({
                                            id: "",
                                            name: "Blank Project",
                                            genre: "other",
                                            description: "Start with a clean slate",
                                            structure: {},
                                            exampleContent: null,
                                        })
                                    }
                                    className={`group relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all hover:scale-[1.02] ${selectedTemplate === null
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-muted-foreground/50"
                                        }`}
                                >
                                    <BookOpen className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="font-medium">Blank Project</span>
                                    <span className="text-xs text-muted-foreground">
                                        Start from scratch
                                    </span>
                                </button>

                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template)}
                                        className={`group relative flex flex-col p-4 rounded-lg border transition-all hover:scale-[1.02] bg-gradient-to-br ${genreColors[template.genre] || genreColors.other
                                            } ${selectedTemplate?.id === template.id
                                                ? "ring-2 ring-primary"
                                                : ""
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">
                                            {genreIcons[template.genre] || genreIcons.other}
                                        </div>
                                        <span className="font-medium text-left">
                                            {template.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {template.genre}
                                        </span>
                                        {selectedTemplate?.id === template.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Panel */}
                {selectedTemplate && (
                    <div className="w-80 border-l border-border flex flex-col bg-muted/20">
                        <div className="px-6 py-4 border-b border-border">
                            <h3 className="font-semibold">{selectedTemplate.name}</h3>
                            <span className="text-xs text-muted-foreground capitalize">
                                {selectedTemplate.genre} template
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedTemplate.description && (
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedTemplate.description}
                                    </p>
                                </div>
                            )}

                            {selectedTemplate.structure?.acts && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Story Structure</h4>
                                    <div className="space-y-2">
                                        {selectedTemplate.structure.acts.map((act, i) => (
                                            <div key={i} className="text-sm">
                                                <span className="font-medium">{act.name}</span>
                                                <p className="text-muted-foreground text-xs">
                                                    {act.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedTemplate.structure?.suggestedChapters && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Suggested Chapters</h4>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        {selectedTemplate.structure.suggestedChapters.map(
                                            (chapter, i) => (
                                                <li key={i} className="flex items-center gap-1">
                                                    <ChevronRight className="w-3 h-3" />
                                                    {chapter}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border">
                            <button
                                onClick={() => onSelect(selectedTemplate)}
                                className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Use This Template
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
