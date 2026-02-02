"use client";

import { useEffect, useState, useRef } from "react";
import { Brain, CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogStep {
    id: string;
    message: string;
    status: "pending" | "processing" | "completed";
}

interface AnalysisThinkingProps {
    onComplete: () => void;
}

export function AnalysisThinking({ onComplete }: AnalysisThinkingProps) {
    const [progress, setProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [logs, setLogs] = useState<LogStep[]>([
        { id: "1", message: "Reading story content...", status: "pending" },
        { id: "2", message: "Detecting genre and tone...", status: "pending" },
        { id: "3", message: "Identifying main characters...", status: "pending" },
        { id: "4", message: "Mapping character relationships...", status: "pending" },
        { id: "5", message: "Identifying key locations...", status: "pending" },
        { id: "6", message: "Detecting emotional arcs...", status: "pending" },
        { id: "7", message: "Structuring narrative flow...", status: "pending" },
    ]);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Simulate progress and logs
        const runSimulation = async () => {
            // Processing loop
            for (let i = 0; i < logs.length; i++) {
                setCurrentStepIndex(i);

                // Mark current as processing
                setLogs(prev => prev.map((log, idx) =>
                    idx === i ? { ...log, status: "processing" } : log
                ));

                // Simulate work time (random between 800ms and 2000ms)
                await new Promise(r => setTimeout(r, Math.random() * 1200 + 800));

                // Mark as completed
                setLogs(prev => prev.map((log, idx) =>
                    idx === i ? { ...log, status: "completed" } : log
                ));

                // Update progress bar
                const newProgress = Math.round(((i + 1) / logs.length) * 100);
                setProgress(newProgress);

                // Auto-scroll
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
            }

            // Wait a moment then finish
            setTimeout(onComplete, 1000);
        };

        runSimulation();

        return () => clearTimeout(interval as any);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-6 animate-in fade-in zoom-in duration-500">
            <div className="w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto relative">
                        <Brain className="w-10 h-10 text-indigo-500 animate-pulse" />
                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full border-t-indigo-500 animate-spin transition-all duration-1000"
                            style={{ animationDuration: '3s' }} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">AI is analyzing your story...</h2>
                        <p className="text-muted-foreground">Currently: {logs[currentStepIndex]?.message || "Finalizing..."}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Analysis Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Terminal Log */}
                <div className="bg-black/80 rounded-xl border border-gray-800 p-6 font-mono text-sm shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
                        <span className="text-gray-400 text-xs uppercase tracking-wider">AI Thinking Log (Live)</span>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                        </div>
                    </div>

                    <div ref={containerRef} className="space-y-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {logs.map((log, index) => (
                            <div key={log.id} className={cn(
                                "flex items-start gap-3 transition-opacity duration-300",
                                log.status === "pending" ? "opacity-30" : "opacity-100"
                            )}>
                                <div className="mt-0.5 shrink-0">
                                    {log.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    {log.status === "processing" && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                                    {log.status === "pending" && <Circle className="w-4 h-4 text-gray-600" />}
                                </div>
                                <span className={cn(
                                    log.status === "processing" ? "text-indigo-300" :
                                        log.status === "completed" ? "text-green-100" : "text-gray-500"
                                )}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
