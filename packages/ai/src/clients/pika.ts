/**
 * Pika Labs API Client
 * Quick preview and draft quality video generation
 */

const PIKA_API_URL = "https://api.pika.art/v1";
const PIKA_API_KEY = process.env.PIKA_API_KEY;

export type PikaStyle = "realistic" | "anime" | "3d" | "cinematic" | "watercolor";
export type PikaQuality = "preview" | "draft" | "production";

export interface PikaVideoRequest {
    prompt: string;
    negativePrompt?: string;
    style?: PikaStyle;
    quality?: PikaQuality;
    duration?: number; // 3-5 seconds
    aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3";
    seed?: number;
    imageUrl?: string; // Image-to-video
}

export interface PikaVideoResponse {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    videoUrl?: string;
    thumbnailUrl?: string;
    error?: string;
}

/**
 * Parse API key (format: client_id:client_secret)
 */
function getCredentials(): { clientId: string; clientSecret: string } {
    if (!PIKA_API_KEY) throw new Error("PIKA_API_KEY not configured");
    const [clientId, clientSecret] = PIKA_API_KEY.split(":");
    return { clientId, clientSecret };
}

/**
 * Generate video with Pika Labs
 */
export async function generatePikaVideo(request: PikaVideoRequest): Promise<PikaVideoResponse> {
    const { clientId, clientSecret } = getCredentials();

    // Quality presets
    const qualitySettings = {
        preview: { resolution: 480, fps: 24 },
        draft: { resolution: 720, fps: 24 },
        production: { resolution: 1080, fps: 30 },
    };

    const settings = qualitySettings[request.quality || "draft"];

    const response = await fetch(`${PIKA_API_URL}/generate`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: request.prompt,
            negative_prompt: request.negativePrompt,
            style: request.style || "cinematic",
            duration: request.duration || 3,
            aspect_ratio: request.aspectRatio || "16:9",
            seed: request.seed,
            resolution: settings.resolution,
            fps: settings.fps,
            image_url: request.imageUrl,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pika API error: ${error}`);
    }

    const data = await response.json();
    return {
        id: data.id,
        status: "pending",
    };
}

/**
 * Get generation status
 */
export async function getPikaStatus(generationId: string): Promise<PikaVideoResponse> {
    const { clientId, clientSecret } = getCredentials();

    const response = await fetch(`${PIKA_API_URL}/generation/${generationId}`, {
        headers: {
            "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Pika status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        status: data.status === "success" ? "completed"
            : data.status === "error" ? "failed"
                : "processing",
        videoUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
        error: data.error_message,
    };
}

/**
 * Wait for completion
 */
export async function waitForPikaCompletion(
    generationId: string,
    timeoutMs: number = 180000, // 3 min for quick previews
    pollIntervalMs: number = 3000
): Promise<PikaVideoResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const status = await getPikaStatus(generationId);

        if (status.status === "completed" || status.status === "failed") {
            return status;
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Pika generation timed out");
}
