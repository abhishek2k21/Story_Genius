"use client";

import { useState } from "react";
import {
    Check,
    Edit2,
    ArrowRight,
    RotateCcw,
    Users,
    MapPin,
    Activity,
    AlertTriangle
} from "lucide-react";

interface CharacterMock {
    name: string;
    role: "Protagonist" | "Antagonist" | "Support" | "Minor";
}

interface AnalysisResultsProps {
    onConfirm: () => void;
    onReanalyze: () => void;
}

export function AnalysisResults({ onConfirm, onReanalyze }: AnalysisResultsProps) {
    // Mock data based on user ASCII art
    const [genre, setGenre] = useState("Dark Fantasy");
    const [tone, setTone] = useState("Mysterious, slightly ominous");

    const characters: CharacterMock[] = [
        { name: "Elena", role: "Protagonist" },
        { name: "Kael", role: "Antagonist" },
        { name: "Mira", role: "Support" },
        { name: "The Elder", role: "Minor" },
    ];

    const locations = [
        "The Ancient Forest (4 scenes)",
        "Castle of Shadows (6 scenes)",
        "The Village (2 scenes)",
        "Crystal Caverns (3 scenes)"
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    📋 Story Analysis Results
                </h2>
                <p className="text-muted-foreground">Review the AI's understanding of your story before proceeding.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Core Attributes */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Core Attributes
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Genre</div>
                                <div className="font-medium">{genre}</div>
                            </div>
                            <button className="p-2 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-primary">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Tone</div>
                                <div className="font-medium">{tone}</div>
                            </div>
                            <button className="p-2 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-primary">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Observations & Alerts */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-amber-500">
                        <AlertTriangle className="w-5 h-5" />
                        AI Observations
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            Scene 7-8 may need visual transition (time skip detected)
                        </li>
                        <li className="flex gap-3 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            Character "The Elder" mentioned but not fully described
                        </li>
                        <li className="flex gap-3 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            Climax at Scene 15 could benefit from extended duration
                        </li>
                    </ul>
                </div>
            </div>

            {/* Characters Grid */}
            <div className="mb-8">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Characters Found
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {characters.map((char) => (
                        <div key={char.name} className="p-4 bg-muted/30 border border-border rounded-lg text-center group hover:border-indigo-500/50 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3 font-semibold text-indigo-400">
                                {char.name[0]}
                            </div>
                            <div className="font-medium">{char.name}</div>
                            <div className="text-xs text-muted-foreground mb-2">{char.role}</div>
                            <button className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                Edit Details
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Locations */}
            <div className="mb-8">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                    Key Locations
                </h3>
                <div className="flex flex-wrap gap-3">
                    {locations.map((loc) => (
                        <div key={loc} className="px-3 py-1.5 bg-muted rounded-full text-sm border border-border">
                            {loc}
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                <button
                    onClick={onReanalyze}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Re-analyze Story
                </button>

                <button
                    onClick={onConfirm}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-lg hover:shadow-primary/20 transition-all"
                >
                    <Check className="w-4 h-4" />
                    Looks Good, Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
