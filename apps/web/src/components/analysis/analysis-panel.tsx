"use client";

import { useEffect } from "react";
import { useAnalysis } from "@/hooks/use-analysis";

interface AnalysisPanelProps {
    projectId: string;
}

export function AnalysisPanel({ projectId }: AnalysisPanelProps) {
    const { analysis, characters, locations, isLoading, error, fetchAnalysis, runAnalysis } = useAnalysis(projectId);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    if (isLoading) {
        return (
            <div className="p-8 text-center bg-gray-900 border border-gray-800 rounded-lg">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">Analyzing story elements...</p>
                <p className="text-xs text-gray-500 mt-2">Extracting characters, world building, and themes</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-200">
                <p>Error: {error}</p>
                <button
                    onClick={fetchAnalysis}
                    className="mt-2 text-sm underline hover:text-white"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="p-8 text-center border border-dashed border-gray-800 rounded-lg bg-gray-900/50">
                <h3 className="text-xl font-semibold mb-2 text-gray-200">No Analysis Yet</h3>
                <p className="text-gray-400 mb-6">Run AI analysis to extract insights from your story.</p>
                <button
                    onClick={runAnalysis}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition-colors"
                >
                    ✨ Run Smart Analysis
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent capitalize">
                            {analysis.genre}
                        </h3>
                        <p className="text-indigo-200 capitalize">{analysis.tone} • {analysis.pacing}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400">Mood</div>
                        <div className="font-medium text-white capitalize">{analysis.mood}</div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {analysis.themes?.map((theme: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-indigo-900/40 text-indigo-300 text-xs rounded-full border border-indigo-800/50">
                            {theme}
                        </span>
                    ))}
                </div>
            </div>

            {/* Tabs content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Character Snapshot */}
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-200">
                        <span>👥</span> Characters ({characters.length})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {characters.map((char: any) => (
                            <div key={char.id} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded hover:bg-gray-800 transition">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    {char.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-gray-200">{char.name}</div>
                                    <div className="text-xs text-gray-400 truncate capitalize">{char.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* World Snapshot */}
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-200">
                        <span>🌍</span> World ({locations.length})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {locations.slice(0, 10).map((loc: any) => (
                            <div key={loc.id} className="p-2 bg-gray-800/50 rounded hover:bg-gray-800 transition">
                                <div className="font-medium text-sm text-gray-200">{loc.name}</div>
                                <div className="text-xs text-gray-400 capitalize">{loc.type}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-center pt-4">
                <button className="text-sm text-gray-400 hover:text-white transition">
                    View full details not implemented yet →
                </button>
            </div>
        </div>
    );
}
