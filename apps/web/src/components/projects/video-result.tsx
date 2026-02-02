"use client";

import { useState } from "react";
import {
    Play,
    Pause,
    Download,
    Share2,
    Edit,
    Music,
    Type,
    Scissors,
    ThumbsUp,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Instagram,
    Youtube,
    Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoAnalysis {
    engagementScore: number;
    engagementLabel: "High" | "Medium" | "Low";
    bestMoments: string[];
    socialPotential: string;
    suggestions: string[];
}

interface VideoResultProps {
    videoUrl?: string; // Optional for now
    analysis: VideoAnalysis;
    onEditScenes: () => void;
    onAddSubtitles: () => void;
    onChangeMusic: () => void;
    onExport: (format: string) => void;
    onClose: () => void;
}

export function VideoResult({
    videoUrl,
    analysis,
    onEditScenes,
    onAddSubtitles,
    onChangeMusic,
    onExport,
    onClose
}: VideoResultProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        🎬 Your Video is Ready!
                    </h2>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>Duration: 4:32</span>
                        <span>•</span>
                        <span>Resolution: 1080p</span>
                        <span>•</span>
                        <span>Size: 423 MB</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                    >
                        Close
                    </button>
                    <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-lg hover:shadow-primary/20 transition-all">
                        Save Project
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
                    {/* Left Column: Player & Analysis */}
                    <div className="col-span-8 space-y-8">
                        {/* Video Player Placeholder */}
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group border border-gray-800">
                            {videoUrl ? (
                                <video src={videoUrl} className="w-full h-full object-cover" controls />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-gray-900/50">
                                    <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                                        <Play className="w-8 h-8 text-white ml-1" />
                                    </div>
                                    <p className="text-gray-400 text-sm">Preview Unavailable</p>
                                </div>
                            )}
                        </div>

                        {/* AI Analysis Card */}
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 font-semibold mb-6 text-lg">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                AI Performance Prediction
                            </h3>

                            <div className="grid grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Engagement Score</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-green-500">{analysis.engagementScore}%</span>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                                            {analysis.engagementLabel}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${analysis.engagementScore}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Best Moments</div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {analysis.bestMoments.map((moment, i) => (
                                            <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded font-mono border border-indigo-500/20">
                                                {moment}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Social Potential</div>
                                    <p className="font-medium text-sm leading-relaxed">{analysis.socialPotential}</p>
                                </div>
                            </div>
                        </div>

                        {/* Improvement Suggestions */}
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="flex items-center gap-2 font-semibold mb-4 text-amber-500">
                                <AlertCircle className="w-5 h-5" />
                                Improvement Suggestions
                            </h3>
                            <ul className="space-y-3">
                                {analysis.suggestions.map((suggestion, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Key Actions */}
                    <div className="col-span-4 space-y-6">
                        {/* Export Options */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export Options
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => onExport('mp4')}
                                    className="p-3 bg-muted/50 hover:bg-muted border border-border rounded-lg text-center transition-colors group"
                                >
                                    <Download className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <div className="text-xs font-medium">Download MP4</div>
                                </button>
                                <button
                                    onClick={() => onExport('youtube')}
                                    className="p-3 bg-muted/50 hover:bg-muted border border-border rounded-lg text-center transition-colors group"
                                >
                                    <Youtube className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-red-500 transition-colors" />
                                    <div className="text-xs font-medium">YouTube</div>
                                </button>
                                <button
                                    onClick={() => onExport('tiktok')}
                                    className="p-3 bg-muted/50 hover:bg-muted border border-border rounded-lg text-center transition-colors group"
                                >
                                    <Smartphone className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                                    <div className="text-xs font-medium">TikTok</div>
                                </button>
                                <button
                                    onClick={() => onExport('instagram')}
                                    className="p-3 bg-muted/50 hover:bg-muted border border-border rounded-lg text-center transition-colors group"
                                >
                                    <Instagram className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                                    <div className="text-xs font-medium">Instagram</div>
                                </button>
                            </div>
                            <button className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-lg hover:bg-muted/50">
                                Export All Formats (ZIP)
                            </button>
                        </div>

                        {/* Continue Editing */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Continue Editing
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={onEditScenes}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors group"
                                >
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Scissors className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">Edit Scenes</div>
                                        <div className="text-xs text-muted-foreground">Adjust clips, trim, or reorder</div>
                                    </div>
                                </button>

                                <button
                                    onClick={onAddSubtitles}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors group"
                                >
                                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-md group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        <Type className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">Add Subtitles</div>
                                        <div className="text-xs text-muted-foreground">Auto-generate captions</div>
                                    </div>
                                </button>

                                <button
                                    onClick={onChangeMusic}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors group"
                                >
                                    <div className="p-2 bg-pink-500/10 text-pink-500 rounded-md group-hover:bg-pink-500 group-hover:text-white transition-colors">
                                        <Music className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">Change Music</div>
                                        <div className="text-xs text-muted-foreground">Update soundtrack</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Share */}
                        <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-full shadow-sm">
                                    <Share2 className="w-4 h-4" />
                                </div>
                                <div className="text-sm font-medium">Share Review Link</div>
                            </div>
                            <button className="text-xs font-semibold text-primary hover:underline">
                                Copy Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
