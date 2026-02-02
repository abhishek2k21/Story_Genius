"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Scene {
    id: string;
    projectId: string;
    order: number;
    title: string | null;
    content: string;
    summary: string | null;
    duration: string;
    location: string | null;
    timeOfDay: string | null;
    mood: string | null;
    characters: string[];
    cameraMovement: string | null;
    cameraAngle: string | null;
    lighting: string | null;
    colorPalette: string[];
    transitionIn: string | null;
    transitionOut: string | null;
    audioSettings?: {
        volume?: number;
        musicVolume?: number;
        narrationVolume?: number;
        mute?: boolean;
    };
    subtitleText?: string;
}

export function useScenes(projectId: string) {
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchScenes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/scenes/projects/${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch scenes");
            const data = await res.json();
            setScenes(data.scenes);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    const generateScenes = useCallback(async (storyContent: string, targetDuration = 60) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/scenes/generate/${projectId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyContent, targetDuration }),
            });
            if (!res.ok) throw new Error("Failed to generate scenes");
            const data = await res.json();
            setScenes(data.scenes);
            return data.scenes;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    const updateScene = useCallback(async (sceneId: string, updates: Partial<Scene>) => {
        try {
            await fetch(`${API_BASE}/api/scenes/${sceneId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updates } : s));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        }
    }, []);

    const reorderScenes = useCallback(async (sceneOrders: { id: string; order: number }[]) => {
        try {
            await fetch(`${API_BASE}/api/scenes/reorder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sceneOrders }),
            });
            fetchScenes();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        }
    }, [fetchScenes]);

    const splitScene = useCallback(async (sceneId: string, splitPoint = 0.5) => {
        try {
            await fetch(`${API_BASE}/api/scenes/${sceneId}/split`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ splitPoint }),
            });
            fetchScenes();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        }
    }, [fetchScenes]);

    const generateVisualPlan = useCallback(async (sceneId: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/scenes/${sceneId}/visual-plan`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to generate visual plan");
            const data = await res.json();
            fetchScenes();
            return data.visualPlan;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        }
    }, [fetchScenes]);

    const checkConsistency = useCallback(async (currentScenes: Scene[]) => {
        try {
            const res = await fetch(`${API_BASE}/api/scenes/check-consistency`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scenes: currentScenes }),
            });
            if (!res.ok) throw new Error("Failed to check consistency");
            const data = await res.json();
            return data.issues;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
            return [];
        }
    }, []);

    const deleteScene = useCallback(async (sceneId: string) => {
        try {
            await fetch(`${API_BASE}/api/scenes/${sceneId}`, { method: "DELETE" });
            setScenes(prev => prev.filter(s => s.id !== sceneId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        }
    }, []);

    return {
        scenes,
        isLoading,
        error,
        fetchScenes,
        generateScenes,
        updateScene,
        reorderScenes,
        splitScene,
        generateVisualPlan,
        checkConsistency,
        deleteScene,
    };
}
