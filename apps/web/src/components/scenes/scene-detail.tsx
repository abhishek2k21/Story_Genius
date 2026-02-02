"use client";

import { useState, useEffect } from "react";
import { Scene } from "@/hooks/use-scenes";

interface SceneDetailProps {
    scene: Scene;
    onSplit: () => void;
    onDelete: () => void;
    onGenerateVisual: () => void;
    onUpdate: (updates: Partial<Scene>) => void;
}

export function SceneDetail({ scene, onSplit, onDelete, onGenerateVisual, onUpdate }: SceneDetailProps) {
    const [subtitleText, setSubtitleText] = useState(scene.subtitleText || "");

    useEffect(() => {
        setSubtitleText(scene.subtitleText || "");
    }, [scene.id, scene.subtitleText]);

    const handleAudioUpdate = (key: string, value: any) => {
        onUpdate({
            audioSettings: {
                ...scene.audioSettings,
                [key]: value
            }
        });
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold">{scene.title || "Untitled Scene"}</h3>
                    <p className="text-indigo-400 text-sm">{scene.duration}s • {scene.location || "Unknown"}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onSplit} className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
                        ✂️ Split
                    </button>
                    <button onClick={onDelete} className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-900 rounded text-red-200">
                        🗑️ Delete
                    </button>
                </div>
            </div>

            {/* Content */}
            <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Scene Description</h4>
                <p className="text-sm leading-relaxed bg-gray-800 p-4 rounded text-gray-200">{scene.content}</p>
            </div>

            {/* Subtitles */}
            <div className="border-t border-gray-800 pt-6">
                <h4 className="font-semibold mb-3">💬 Subtitles</h4>
                <textarea
                    value={subtitleText}
                    onChange={(e) => setSubtitleText(e.target.value)}
                    onBlur={() => onUpdate({ subtitleText })}
                    placeholder="Add subtitles for this scene..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:border-indigo-500 transition-colors"
                />
            </div>

            {/* Audio Settings */}
            <div className="border-t border-gray-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">🔊 Audio Settings</h4>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Mute Scene</span>
                        <div className="relative inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={scene.audioSettings?.mute || false}
                                onChange={(e) => handleAudioUpdate("mute", e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-400">Narration Volume</label>
                            <span className="text-xs text-indigo-400 font-mono">{Math.round((scene.audioSettings?.narrationVolume ?? 1.0) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={scene.audioSettings?.narrationVolume ?? 1.0}
                            onChange={(e) => handleAudioUpdate("narrationVolume", parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-400">Music Volume</label>
                            <span className="text-xs text-indigo-400 font-mono">{Math.round((scene.audioSettings?.musicVolume ?? 0.3) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={scene.audioSettings?.musicVolume ?? 0.3}
                            onChange={(e) => handleAudioUpdate("musicVolume", parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Time of Day</h4>
                    <p className="text-sm capitalize">{scene.timeOfDay || "—"}</p>
                </div>
                <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Mood</h4>
                    <p className="text-sm capitalize">{scene.mood || "—"}</p>
                </div>
                <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Characters</h4>
                    <p className="text-sm">{scene.characters?.join(", ") || "—"}</p>
                </div>
            </div>

            {/* Visual Plan */}
            <div className="border-t border-gray-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">🎥 Visual Plan</h4>
                    <button
                        onClick={onGenerateVisual}
                        className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded"
                    >
                        Generate
                    </button>
                </div>

                {scene.cameraMovement || scene.lighting ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h5 className="text-xs text-gray-400">Camera</h5>
                            <p className="text-sm">{scene.cameraMovement} / {scene.cameraAngle}</p>
                        </div>
                        <div>
                            <h5 className="text-xs text-gray-400">Lighting</h5>
                            <p className="text-sm">{scene.lighting}</p>
                        </div>
                        <div>
                            <h5 className="text-xs text-gray-400">Transitions</h5>
                            <p className="text-sm">{scene.transitionIn} → {scene.transitionOut}</p>
                        </div>
                        <div>
                            <h5 className="text-xs text-gray-400">Color Palette</h5>
                            <div className="flex gap-1 mt-1">
                                {scene.colorPalette?.map((color: string, i: number) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No visual plan yet. Click Generate to create one.</p>
                )}
            </div>
        </div>
    );
}
