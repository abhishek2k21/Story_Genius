/**
 * Unified Video Generation Service
 * Provider abstraction with automatic failover and quality routing
 */

import * as runway from "../clients/runway";
import * as pika from "../clients/pika";
import * as kling from "../clients/kling";

export type VideoProvider = "runway" | "pika" | "kling" | "auto";
export type QualityTier = "preview" | "draft" | "production";

export interface VideoGenerationRequest {
    prompt: string;
    negativePrompt?: string;
    provider?: VideoProvider;
    qualityTier?: QualityTier;
    duration?: number;
    aspectRatio?: "16:9" | "9:16" | "1:1";
    style?: string;
    imageUrl?: string; // Image-to-video
    seed?: number;
}

export interface VideoGenerationResult {
    id: string;
    provider: VideoProvider;
    status: "pending" | "processing" | "completed" | "failed";
    videoUrl?: string;
    thumbnailUrl?: string;
    error?: string;
    estimatedCost?: number;
}

/**
 * Provider cost estimates per second (in USD)
 */
const COST_PER_SECOND: Record<Exclude<VideoProvider, "auto">, number> = {
    runway: 0.05,   // ~$0.25 for 5s
    pika: 0.02,     // ~$0.10 for 5s (cheaper drafts)
    kling: 0.03,    // ~$0.15 for 5s via Replicate
};

/**
 * Quality tier to provider mapping
 */
const QUALITY_PROVIDER_MAP: Record<QualityTier, VideoProvider[]> = {
    preview: ["pika", "kling"],           // Fast, cheaper
    draft: ["pika", "runway", "kling"],   // Balanced
    production: ["runway", "kling"],      // Best quality
};

/**
 * Select best provider based on quality tier and availability
 */
function selectProvider(qualityTier: QualityTier, preferredProvider?: VideoProvider): Exclude<VideoProvider, "auto"> {
    if (preferredProvider && preferredProvider !== "auto") {
        return preferredProvider;
    }

    const providers = QUALITY_PROVIDER_MAP[qualityTier];
    return providers[0] as Exclude<VideoProvider, "auto">;
}

/**
 * Get fallback providers for failover
 */
function getFallbackProviders(currentProvider: Exclude<VideoProvider, "auto">, qualityTier: QualityTier): Exclude<VideoProvider, "auto">[] {
    const all = QUALITY_PROVIDER_MAP[qualityTier] as Exclude<VideoProvider, "auto">[];
    return all.filter(p => p !== currentProvider);
}

/**
 * Generate video with automatic provider selection and failover
 */
export async function generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const qualityTier = request.qualityTier || "draft";
    let provider = selectProvider(qualityTier, request.provider);
    const fallbacks = getFallbackProviders(provider, qualityTier);

    const providers = [provider, ...fallbacks];
    let lastError: Error | null = null;

    for (const currentProvider of providers) {
        try {
            console.log(`🎬 Attempting video generation with ${currentProvider}...`);
            const result = await generateWithProvider(currentProvider, request);

            return {
                ...result,
                provider: currentProvider,
                estimatedCost: (request.duration || 5) * COST_PER_SECOND[currentProvider],
            };
        } catch (error) {
            console.warn(`⚠️ ${currentProvider} failed:`, error);
            lastError = error as Error;
            // Continue to next provider
        }
    }

    throw lastError || new Error("All video providers failed");
}

/**
 * Generate with specific provider
 */
async function generateWithProvider(
    provider: Exclude<VideoProvider, "auto">,
    request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
    switch (provider) {
        case "runway":
            const runwayResult = await runway.generateRunwayVideo({
                prompt: request.prompt,
                duration: request.duration || 5,
                aspectRatio: request.aspectRatio as any,
                seed: request.seed,
                imageUrl: request.imageUrl,
            });
            return {
                id: runwayResult.id,
                provider: "runway",
                status: runwayResult.status,
                videoUrl: runwayResult.videoUrl,
            };

        case "pika":
            const pikaResult = await pika.generatePikaVideo({
                prompt: request.prompt,
                negativePrompt: request.negativePrompt,
                style: request.style as pika.PikaStyle,
                quality: request.qualityTier as pika.PikaQuality,
                duration: request.duration || 3,
                aspectRatio: request.aspectRatio as any,
                seed: request.seed,
                imageUrl: request.imageUrl,
            });
            return {
                id: pikaResult.id,
                provider: "pika",
                status: pikaResult.status,
                videoUrl: pikaResult.videoUrl,
                thumbnailUrl: pikaResult.thumbnailUrl,
            };

        case "kling":
            const klingDuration: kling.KlingDuration =
                (request.duration || 5) <= 5 ? "short" :
                    (request.duration || 5) <= 10 ? "medium" : "extended";

            const klingResult = await kling.generateKlingVideo({
                prompt: request.prompt,
                negativePrompt: request.negativePrompt,
                style: request.style as kling.KlingStyle,
                duration: klingDuration,
                aspectRatio: request.aspectRatio as any,
                seed: request.seed,
                imageUrl: request.imageUrl,
            });
            return {
                id: klingResult.id,
                provider: "kling",
                status: klingResult.status,
                videoUrl: klingResult.videoUrl,
            };

        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

/**
 * Poll for video completion
 */
export async function pollVideoStatus(
    id: string,
    provider: Exclude<VideoProvider, "auto">
): Promise<VideoGenerationResult> {
    switch (provider) {
        case "runway":
            const runwayStatus = await runway.getRunwayStatus(id);
            return { provider, ...runwayStatus };
        case "pika":
            const pikaStatus = await pika.getPikaStatus(id);
            return { provider, ...pikaStatus };
        case "kling":
            const klingStatus = await kling.getKlingStatus(id);
            return { provider, ...klingStatus };
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

/**
 * Wait for video completion with any provider
 */
export async function waitForVideoCompletion(
    id: string,
    provider: Exclude<VideoProvider, "auto">,
    timeoutMs?: number
): Promise<VideoGenerationResult> {
    switch (provider) {
        case "runway":
            const runwayResult = await runway.waitForRunwayCompletion(id, timeoutMs);
            return { provider, ...runwayResult };
        case "pika":
            const pikaResult = await pika.waitForPikaCompletion(id, timeoutMs);
            return { provider, ...pikaResult };
        case "kling":
            const klingResult = await kling.waitForKlingCompletion(id, timeoutMs);
            return { provider, ...klingResult };
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

/**
 * Estimate generation cost
 */
export function estimateCost(duration: number, provider: Exclude<VideoProvider, "auto">): number {
    return duration * COST_PER_SECOND[provider];
}

/**
 * Get recommended provider for use case
 */
export function recommendProvider(useCase: "quick-preview" | "social-media" | "cinematic"): VideoProvider {
    switch (useCase) {
        case "quick-preview": return "pika";
        case "social-media": return "kling";
        case "cinematic": return "runway";
    }
}
