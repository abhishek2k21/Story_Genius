/**
 * Kling AI Client via Replicate
 * Extended duration video generation with style presets
 */

const REPLICATE_API_URL = "https://api.replicate.com/v1";
const REPLICATE_ACCESS_KEY = process.env.REPLICATE_ACCESS_KEY;

// Kling model on Replicate
const KLING_MODEL = "klingai/kling-v1-5";

export type KlingStyle = "realistic" | "anime" | "fantasy" | "cinematic" | "documentary";
export type KlingDuration = "short" | "medium" | "extended"; // 5s, 10s, 15s

export interface KlingVideoRequest {
    prompt: string;
    negativePrompt?: string;
    style?: KlingStyle;
    duration?: KlingDuration;
    aspectRatio?: "16:9" | "9:16" | "1:1";
    seed?: number;
    imageUrl?: string;
}

export interface KlingVideoResponse {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    videoUrl?: string;
    error?: string;
}

/**
 * Map duration to seconds
 */
function getDurationSeconds(duration: KlingDuration): number {
    switch (duration) {
        case "short": return 5;
        case "medium": return 10;
        case "extended": return 15;
        default: return 5;
    }
}

/**
 * Generate video with Kling via Replicate
 */
export async function generateKlingVideo(request: KlingVideoRequest): Promise<KlingVideoResponse> {
    if (!REPLICATE_ACCESS_KEY) throw new Error("REPLICATE_ACCESS_KEY not configured");

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
        method: "POST",
        headers: {
            "Authorization": `Token ${REPLICATE_ACCESS_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: KLING_MODEL,
            input: {
                prompt: request.prompt,
                negative_prompt: request.negativePrompt || "blurry, low quality, distorted",
                style: request.style || "cinematic",
                duration: getDurationSeconds(request.duration || "short"),
                aspect_ratio: request.aspectRatio || "16:9",
                seed: request.seed,
                image: request.imageUrl,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kling/Replicate API error: ${error}`);
    }

    const data = await response.json();
    return {
        id: data.id,
        status: "pending",
    };
}

/**
 * Get Replicate prediction status
 */
export async function getKlingStatus(predictionId: string): Promise<KlingVideoResponse> {
    if (!REPLICATE_ACCESS_KEY) throw new Error("REPLICATE_ACCESS_KEY not configured");

    const response = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, {
        headers: {
            "Authorization": `Token ${REPLICATE_ACCESS_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Kling status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        status: data.status === "succeeded" ? "completed"
            : data.status === "failed" ? "failed"
                : "processing",
        videoUrl: data.output,
        error: data.error,
    };
}

/**
 * Wait for completion (extended timeout for longer videos)
 */
export async function waitForKlingCompletion(
    predictionId: string,
    timeoutMs: number = 600000, // 10 min for extended duration
    pollIntervalMs: number = 5000
): Promise<KlingVideoResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const status = await getKlingStatus(predictionId);

        if (status.status === "completed" || status.status === "failed") {
            return status;
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Kling generation timed out");
}
