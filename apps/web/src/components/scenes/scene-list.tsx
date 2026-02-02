"use client";

import { useEffect, useState } from "react";
import { useScenes, Scene } from "@/hooks/use-scenes";
import { SceneTimeline } from "./scene-timeline";
import { SceneDetail } from "./scene-detail";

interface SceneListProps {
    projectId: string;
    storyContent?: string;
}

export function SceneList({ projectId, storyContent }: SceneListProps) {
    const {
        scenes,
        isLoading,
        error,
        fetchScenes,
        generateScenes,
        deleteScene,
        splitScene,
        generateVisualPlan,
        checkConsistency,
        updateScene
    } = useScenes(projectId);
    const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
    const [consistencyIssues, setConsistencyIssues] = useState<any[]>([]);

    useEffect(() => {
        fetchScenes();
    }, [fetchScenes]);

    const handleGenerate = async () => {
        if (storyContent) {
            await generateScenes(storyContent, 60);
        }
    };

    const handleCheckConsistency = async () => {
        const issues = await checkConsistency(scenes);
        setConsistencyIssues(issues || []);
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Processing scenes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-200">
                <p>Error: {error}</p>
            </div>
        );
    }

    if (scenes.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-gray-700 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-gray-200">No Scenes Yet</h3>
                <p className="text-gray-400 mb-6">Generate scenes from your story to start planning.</p>
                <button
                    onClick={handleGenerate}
                    disabled={!storyContent}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md text-white font-medium transition-colors"
                >
                    🎬 Generate Scenes
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Timeline View */}
            <SceneTimeline scenes={scenes} onSelectScene={setSelectedScene} />

            {/* Consistency Issues */}
            {consistencyIssues.length > 0 && (
                <div className="bg-orange-900/20 border border-orange-800 p-4 rounded-lg">
                    <h4 className="flex items-center gap-2 font-semibold text-orange-200 mb-2">
                        <span>⚠️</span> Consistency Issues Found
                    </h4>
                    <div className="space-y-2">
                        {consistencyIssues.map((issue, i) => (
                            <div key={i} className="text-sm text-orange-300 bg-orange-900/30 p-2 rounded">
                                <span className="font-bold uppercase text-xs opacity-75">{issue.type}:</span> {issue.description}
                                <div className="text-xs mt-1 opacity-75">Suggestion: {issue.suggestion}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-6">
                {/* Scene List */}
                <div className="w-1/3 space-y-3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Scenes ({scenes.length})</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCheckConsistency}
                                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                            >
                                ✅ Check
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>

                    {scenes.map((scene: Scene, index: number) => (
                        <div
                            key={scene.id}
                            onClick={() => setSelectedScene(scene)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${selectedScene?.id === scene.id
                                ? "bg-indigo-900/50 border-indigo-500 border"
                                : "bg-gray-800 hover:bg-gray-750 border border-transparent"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Scene {index + 1}</span>
                                <span className="text-xs text-indigo-400">{scene.duration}s</span>
                            </div>
                            <h4 className="font-medium truncate">{scene.title || `Scene ${index + 1}`}</h4>
                            <p className="text-xs text-gray-400 truncate mt-1">{scene.location || "No location"}</p>
                        </div>
                    ))}

                    <div className="pt-4 text-center text-sm text-gray-500">
                        Total: {scenes.reduce((sum: number, s: Scene) => sum + parseFloat(s.duration), 0).toFixed(1)}s
                    </div>
                </div>

                {/* Scene Detail */}
                <div className="flex-1">
                    {selectedScene ? (
                        <SceneDetail
                            scene={selectedScene}
                            onSplit={() => splitScene(selectedScene.id)}
                            onDelete={() => {
                                deleteScene(selectedScene.id);
                                setSelectedScene(null);
                            }}
                            onGenerateVisual={() => generateVisualPlan(selectedScene.id)}
                            onUpdate={(updates) => updateScene(selectedScene.id, updates)}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg">
                            Select a scene to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
