"use client";

import { useState, useCallback, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type WritingMode = "improve" | "expand" | "shorten" | "fix" | "tone" | "continue";
export type ToneType = "professional" | "dramatic" | "funny" | "dark" | "romantic" | "mysterious";

export interface ProcessTextParams {
    text: string;
    mode: WritingMode;
    context?: string;
    tone?: ToneType;
    instruction?: string;
}

export interface UseAIReturn {
    processText: (params: ProcessTextParams) => Promise<string>;
    streamContinue: (text: string, context?: string) => void;
    cancelStream: () => void;
    isLoading: boolean;
    isStreaming: boolean;
    streamedText: string;
    error: string | null;
}

/**
 * Hook to interact with AI Writing Assistant API
 */
export function useAI(): UseAIReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Process text with AI (non-streaming)
     */
    const processText = useCallback(async (params: ProcessTextParams): Promise<string> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/ai/process`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.result;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Stream story continuation
     */
    const streamContinue = useCallback((text: string, context?: string) => {
        // Cancel any existing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsStreaming(true);
        setStreamedText("");
        setError(null);

        (async () => {
            try {
                const response = await fetch(`${API_BASE}/api/ai/continue/stream`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ text, context }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Stream error: ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response body");

                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    setStreamedText((prev) => prev + chunk);
                }
            } catch (err) {
                if ((err as Error).name === "AbortError") {
                    // Cancelled by user
                    return;
                }
                const message = err instanceof Error ? err.message : "Stream failed";
                setError(message);
            } finally {
                setIsStreaming(false);
                abortControllerRef.current = null;
            }
        })();
    }, []);

    /**
     * Cancel ongoing stream
     */
    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsStreaming(false);
        }
    }, []);

    return {
        processText,
        streamContinue,
        cancelStream,
        isLoading,
        isStreaming,
        streamedText,
        error,
    };
}
