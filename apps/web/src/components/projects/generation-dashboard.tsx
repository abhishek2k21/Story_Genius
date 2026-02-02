"use client";

import { useEffect, useState } from "react";
import { Loader2, Pause, FastForward, CheckCircle2, Circle } from "lucide-react";

interface GenerationDashboardProps {
    onComplete: () => void;
}

export function GenerationDashboard({ onComplete }: GenerationDashboardProps) {
    const [progress, setProgress] = useState(0);
    const [currentScene, setCurrentScene] = useState(1);
    const totalScenes = 18;
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 1000); // Wait 1s before showing result
                    return 100;
                }

                // Simulate scene completion
                const next = prev + 0.5;
                if (Math.floor(next / (100 / totalScenes)) > Math.floor(prev / (100 / totalScenes))) {
                    setCurrentScene(s => Math.min(s + 1, totalScenes));
                    setLogs(l => [`Scene ${Math.min(currentScene + 1, totalScenes)}: Rendering character expressions...`, ...l].slice(0, 3));
                }
                return next;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [currentScene, onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-6 animate-in fade-in duration-500">
            <div className="w-full space-y-8">
                {/* Status Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 text-sm font-medium animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        LIVE GENERATION
                    </div>
                    <h2 className="text-3xl font-bold">Bringing your story to life...</h2>
                    <p className="text-muted-foreground w-64 mx-auto truncate">
                        Currently working on: Scene {currentScene} "The Revelation"
                    </p>
                </div>

                {/* Main Progress */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-xl space-y-6">
                    {/* Time stats */}
                    <div className="flex justify-between text-sm text-muted-foreground font-mono">
                        <span>Elapsed: 08:32</span>
                        <span>Remaining: ~06:15</span>
                    </div>

                    {/* Big Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                {Math.floor(progress)}%
                            </span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-linear relative overflow-hidden"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"
                                    style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Scene Grid */}
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scene Queue</div>
                        <div className="flex gap-1 flex-wrap">
                            {Array.from({ length: totalScenes }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`
                                        w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all duration-300
                                        ${i + 1 < currentScene ? "bg-green-500/20 text-green-500" :
                                            i + 1 === currentScene ? "bg-indigo-500 text-white animate-pulse" :
                                                "bg-muted text-muted-foreground"}
                                    `}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Logs */}
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-xs space-y-1.5 h-24 overflow-hidden border border-border/50">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-2 text-indigo-300/80 animate-in slide-in-from-left-2 fade-in duration-300">
                                <span className="opacity-50">&gt;</span>
                                {log}
                            </div>
                        ))}
                        <div className="flex gap-2 text-indigo-400 animate-pulse">
                            <span className="opacity-50">&gt;</span>
                            Applying particle effects...
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    <button className="px-6 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors flex items-center gap-2">
                        <Pause className="w-4 h-4" />
                        Pause Generation
                    </button>
                    <button
                        onClick={onComplete} // Debug skip
                        className="px-6 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <FastForward className="w-4 h-4" />
                        Preview Completed
                    </button>
                </div>
            </div>
        </div>
    );
}
