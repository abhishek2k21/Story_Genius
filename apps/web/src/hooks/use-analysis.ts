"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AnalysisState {
    analysis: any | null;
    characters: any[];
    locations: any[];
    isLoading: boolean;
    error: string | null;
}

export function useAnalysis(projectId: string) {
    const [state, setState] = useState<AnalysisState>({
        analysis: null,
        characters: [],
        locations: [],
        isLoading: false,
        error: null,
    });

    const fetchAnalysis = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const res = await fetch(`${API_BASE}/api/analysis/projects/${projectId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setState(prev => ({ ...prev, isLoading: false, analysis: null }));
                    return;
                }
                throw new Error("Failed to fetch analysis");
            }
            const data = await res.json();
            setState({
                analysis: data.analysis,
                characters: data.characters,
                locations: data.locations,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : "Error fetching analysis"
            }));
        }
    }, [projectId]);

    const runAnalysis = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const res = await fetch(`${API_BASE}/api/analysis/projects/${projectId}/analyze`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Analysis failed");

            // Re-fetch after analysis
            await fetchAnalysis();
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : "Error running analysis"
            }));
        }
    }, [projectId, fetchAnalysis]);

    return {
        ...state,
        fetchAnalysis,
        runAnalysis,
    };
}
