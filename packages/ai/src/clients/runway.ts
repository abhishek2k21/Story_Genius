/**
 * Runway Gen-3 Alpha API Client
 * Video generation with status polling and download
 */

const RUNWAY_API_URL = "https://api.runwayml.com/v1";
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

export interface RunwayVideoRequest {
    prompt: string;
    duration?: number; // 5-10 seconds
    aspectRatio?: "16:9" | "9:16" | "1:1";
    seed?: number;
    imageUrl?: string; // Optional image-to-video
}

export interface RunwayVideoResponse {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    videoUrl?: string;
    error?: string;
    progress?: number;
}

/**
 * Start video generation with Runway Gen-3 Alpha
 */
export async function generateRunwayVideo(request: RunwayVideoRequest): Promise<RunwayVideoResponse> {
    if (!RUNWAY_API_KEY) throw new Error("RUNWAY_API_KEY not configured");

    const response = await fetch(`${RUNWAY_API_URL}/generations`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${RUNWAY_API_KEY}`,
            "Content-Type": "application/json",
            "X-Runway-Version": "2024-11-06",
        },
        body: JSON.stringify({
            promptText: request.prompt,
            model: "gen3a_turbo",
            duration: request.duration || 5,
            ratio: request.aspectRatio || "16:9",
            seed: request.seed,
            ...(request.imageUrl && { promptImage: request.imageUrl }),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway API error: ${error}`);
    }

    const data = await response.json();
    return {
        id: data.id,
        status: "pending",
    };
}

/**
 * Poll for video generation status
 */
export async function getRunwayStatus(generationId: string): Promise<RunwayVideoResponse> {
    if (!RUNWAY_API_KEY) throw new Error("RUNWAY_API_KEY not configured");

    const response = await fetch(`${RUNWAY_API_URL}/generations/${generationId}`, {
        headers: {
            "Authorization": `Bearer ${RUNWAY_API_KEY}`,
            "X-Runway-Version": "2024-11-06",
        },
    });

    if (!response.ok) {
        throw new Error(`Runway status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        status: data.status === "SUCCEEDED" ? "completed"
            : data.status === "FAILED" ? "failed"
                : "processing",
        videoUrl: data.output?.[0],
        progress: data.progress,
        error: data.failure,
    };
}

/**
 * Poll until completion with timeout
 */
export async function waitForRunwayCompletion(
    generationId: string,
    timeoutMs: number = 300000, // 5 min default
    pollIntervalMs: number = 5000
): Promise<RunwayVideoResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const status = await getRunwayStatus(generationId);

        if (status.status === "completed" || status.status === "failed") {
            return status;
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Runway generation timed out");
}

/**
 * Download video to buffer
 */
export async function downloadRunwayVideo(videoUrl: string): Promise<Buffer> {
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error("Failed to download video");
    return Buffer.from(await response.arrayBuffer());
}
