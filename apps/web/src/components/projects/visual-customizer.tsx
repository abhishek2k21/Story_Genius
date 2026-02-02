"use client";

import { useState } from "react";
import { Video, Music, Palette, Monitor, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualCustomizerProps {
    onBack: () => void;
    onNext: () => void;
}

export function VisualCustomizer({ onBack, onNext }: VisualCustomizerProps) {
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [style, setStyle] = useState("cinematic");
    const [pacing, setPacing] = useState("dynamic");

    const styles = [
        { id: "cinematic", name: "Cinematic", description: "Movie-like lighting and composition" },
        { id: "anime", name: "Anime", description: "Vibrant colors, cel-shaded look" },
        { id: "digital-art", name: "Digital Art", description: "Stylized, painterly aesthetic" },
        { id: "photorealistic", name: "Photorealistic", description: "Hyper-realistic visuals" }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    🎨 Visual Style Customization
                </h2>
                <p className="text-muted-foreground">Define the look and feel of your masterpiece.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Visual Style */}
                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-500" />
                        Visual Style
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {styles.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStyle(s.id)}
                                className={cn(
                                    "p-3 rounded-xl border text-left transition-all",
                                    style === s.id
                                        ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50"
                                        : "bg-card border-border hover:border-indigo-500/30"
                                )}
                            >
                                <div className="font-medium text-sm mb-1">{s.name}</div>
                                <div className="text-xs text-muted-foreground">{s.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Technical Settings */}
                <div className="space-y-6">
                    {/* Aspect Ratio */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-indigo-500" />
                            Aspect Ratio
                        </h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAspectRatio("16:9")}
                                className={cn(
                                    "flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all",
                                    aspectRatio === "16:9" ? "bg-indigo-500/10 border-indigo-500" : "bg-card border-border"
                                )}
                            >
                                <div className="w-8 h-5 border-2 border-current rounded-sm opacity-50" />
                                <span className="text-xs font-medium">16:9 Landscape</span>
                            </button>
                            <button
                                onClick={() => setAspectRatio("9:16")}
                                className={cn(
                                    "flex-1 p-3 rounded-lg border flex flex-col items-center gap-2 transition-all",
                                    aspectRatio === "9:16" ? "bg-indigo-500/10 border-indigo-500" : "bg-card border-border"
                                )}
                            >
                                <div className="w-5 h-8 border-2 border-current rounded-sm opacity-50" />
                                <span className="text-xs font-medium">9:16 Portrait</span>
                            </button>
                        </div>
                    </div>

                    {/* Audio & Pacing */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Music className="w-5 h-5 text-indigo-500" />
                            Pacing & Audio
                        </h3>
                        <div className="flex gap-2">
                            {["Slow", "Dynamic", "Fast"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPacing(p.toLowerCase())}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-lg text-sm border transition-all",
                                        pacing === p.toLowerCase()
                                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                            : "bg-card border-border hover:bg-muted"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-lg hover:shadow-primary/20 transition-all"
                >
                    <Video className="w-4 h-4" />
                    Preview & Generate
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
