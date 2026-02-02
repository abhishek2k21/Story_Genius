"use client";

import { useMemo } from "react";
import { Scene } from "@/hooks/use-scenes";

interface SceneTimelineProps {
    scenes: Scene[];
    onSelectScene: (scene: Scene) => void;
}

export function SceneTimeline({ scenes, onSelectScene }: SceneTimelineProps) {
    const totalDuration = useMemo(() => scenes.reduce((sum, s) => sum + parseFloat(s.duration), 0), [scenes]);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto">
            <h4 className="text-sm font-semibold mb-3 text-gray-400">Timeline ({totalDuration.toFixed(1)}s)</h4>

            <div className="flex relative h-24 min-w-full">
                {scenes.map((scene, index) => {
                    const widthPercent = (parseFloat(scene.duration) / totalDuration) * 100;
                    return (
                        <div
                            key={scene.id}
                            onClick={() => onSelectScene(scene)}
                            className="relative group cursor-pointer border-r border-gray-900 last:border-0 hover:brightness-110 transition-all"
                            style={{
                                width: `${widthPercent}%`,
                                minWidth: "60px",
                                backgroundColor: getColorOnMood(scene.mood)
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center p-1">
                                <span className="text-xs font-bold text-white shadow-sm truncate w-full text-center">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 p-2 rounded text-xs hidden group-hover:block z-10 pointer-events-none">
                                <div className="font-bold mb-1">{scene.title}</div>
                                <div className="text-gray-400">{scene.duration}s • {scene.timeOfDay}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Markers */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0s</span>
                <span>{totalDuration.toFixed(0)}s</span>
            </div>
        </div>
    );
}

function getColorOnMood(mood: string | null): string {
    const m = mood?.toLowerCase() || "";
    if (m.includes("happy") || m.includes("joy")) return "#F6E05E"; // Yellow
    if (m.includes("dark") || m.includes("sad")) return "#4A5568"; // Gray
    if (m.includes("tense") || m.includes("action")) return "#F56565"; // Red
    if (m.includes("calm") || m.includes("peace")) return "#48BB78"; // Green
    if (m.includes("romantic") || m.includes("love")) return "#ED64A6"; // Pink
    return "#4299E1"; // Blue default
}
