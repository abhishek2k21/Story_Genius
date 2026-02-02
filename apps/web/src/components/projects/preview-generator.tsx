"use client";

import { useState } from "react";
import { ArrowLeft, Play, RefreshCw, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewGeneratorProps {
    onBack: () => void;
    onGenerate: () => void;
}

export function PreviewGenerator({ onBack, onGenerate }: PreviewGeneratorProps) {
    // Mock data for 2 key scenes
    const [selections, setSelections] = useState<Record<number, string>>({ 1: "A", 2: "B" });

    const scenes = [
        {
            id: 1,
            title: "Scene 1: The Call",
            variations: [
                { id: "A", name: "Cinematic", color: "bg-indigo-900" },
                { id: "B", name: "Stylized", color: "bg-purple-900" },
                { id: "C", name: "Anime", color: "bg-pink-900" },
                { id: "D", name: "Artistic", color: "bg-orange-900" }
            ]
        },
        {
            id: 2,
            title: "Scene 5: The Encounter",
            variations: [
                { id: "A", name: "Cinematic", color: "bg-indigo-900" },
                { id: "B", name: "Stylized", color: "bg-purple-900" },
                { id: "C", name: "Anime", color: "bg-pink-900" },
                { id: "D", name: "Artistic", color: "bg-orange-900" }
            ]
        }
    ];

    return (
        <div className="max-w-5xl mx-auto p-6 h-full flex flex-col animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    👁️ Contextual Style Preview
                </h2>
                <p className="text-muted-foreground">Select the best visual interpretation for key moments.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-12 pr-2">
                {scenes.map((scene) => (
                    <div key={scene.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{scene.title}</h3>
                            <button className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                                <RefreshCw className="w-3 h-3" />
                                Regenerate Options
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {scene.variations.map((v) => (
                                <div
                                    key={v.id}
                                    onClick={() => setSelections(prev => ({ ...prev, [scene.id]: v.id }))}
                                    className={cn(
                                        "group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300",
                                        selections[scene.id] === v.id
                                            ? "border-primary ring-2 ring-primary/30 shadow-lg scale-105"
                                            : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                                    )}
                                >
                                    {/* Mock Image Placeholder */}
                                    <div className={`aspect-square ${v.color} flex items-center justify-center`}>
                                        <span className="text-2xl font-bold opacity-20">{v.id}</span>
                                    </div>

                                    {/* Label */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                                        <span className="text-xs font-medium text-white">{v.name}</span>
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border border-white flex items-center justify-center transition-colors",
                                            selections[scene.id] === v.id ? "bg-primary border-primary" : "bg-transparent"
                                        )}>
                                            {selections[scene.id] === v.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border mt-auto bg-background/95 backdrop-blur z-10 sticky bottom-0">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="flex items-center gap-4">
                    <button className="text-sm text-muted-foreground hover:text-foreground underline decoration-dotted">
                        Request Custom Prompt
                    </button>
                    <button
                        onClick={onGenerate}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:scale-105"
                    >
                        <Wand2 className="w-4 h-4" />
                        Generate Final Video
                    </button>
                </div>
            </div>
        </div>
    );
}
