import { Job } from "bullmq";
import {
    VideoGenerationPayload,
    VideoGenerationResult,
    GENERATION_STAGES,
    JobProgress,
} from "@repo/queue";
import { createStorageClient } from "@repo/storage";
import { generateVideo, pollVideoStatus, waitForVideoCompletion } from "@repo/ai";

const storage = createStorageClient();

/**
 * Process video generation job
 */
export async function processVideoGeneration(
    job: Job<VideoGenerationPayload>
): Promise<VideoGenerationResult> {
    const { projectId, sceneId, prompt, duration, provider, options } = job.data;
    const startTime = Date.now();

    try {
        // Stage: Starting
        await updateProgress(job, GENERATION_STAGES.STARTING);

        // Stage: Preparing
        await updateProgress(job, GENERATION_STAGES.PREPARING_PROMPT);

        const fullPrompt = buildPrompt(prompt, options);

        // Stage: Calling API
        await updateProgress(job, GENERATION_STAGES.CALLING_API);

        const generationResult = await generateVideo({
            prompt: fullPrompt,
            duration,
            provider,
            aspectRatio: options?.aspectRatio || "16:9",
        });

        if (!generationResult.id) {
            throw new Error("Failed to start video generation");
        }

        // Stage: Processing (AI is working)
        await updateProgress(job, GENERATION_STAGES.PROCESSING);

        // Stage: Waiting for result
        await updateProgress(job, GENERATION_STAGES.WAITING_RESULT);

        const completedVideo = await waitForVideoCompletion(provider, generationResult.id, {
            onProgress: async (status: string) => {
                await job.updateProgress({
                    ...GENERATION_STAGES.PROCESSING,
                    message: `AI processing: ${status}`,
                    timestamp: new Date(),
                });
            },
        });

        if (completedVideo.status !== "completed" || !completedVideo.url) {
            throw new Error(`Video generation failed: ${completedVideo.status}`);
        }

        // Stage: Downloading
        await updateProgress(job, GENERATION_STAGES.DOWNLOADING);

        const videoBuffer = await downloadVideo(completedVideo.url);

        // Stage: Uploading to storage
        await updateProgress(job, GENERATION_STAGES.UPLOADING);

        await storage.ensureBucket();
        const uploadResult = await storage.uploadVideo(videoBuffer, projectId, sceneId, "final");

        // Generate thumbnail (first frame)
        const thumbnailUrl = await generateThumbnail(uploadResult.key);

        // Stage: Finalizing
        await updateProgress(job, GENERATION_STAGES.FINALIZING);

        // Stage: Complete
        await updateProgress(job, GENERATION_STAGES.COMPLETED);

        return {
            success: true,
            videoUrl: uploadResult.url,
            videoKey: uploadResult.key,
            thumbnailUrl,
            duration,
            provider,
            processingTimeMs: Date.now() - startTime,
        };

    } catch (error) {
        await updateProgress(job, {
            ...GENERATION_STAGES.FAILED,
            message: error instanceof Error ? error.message : "Unknown error",
        });

        return {
            success: false,
            provider,
            error: error instanceof Error ? error.message : "Unknown error",
            processingTimeMs: Date.now() - startTime,
        };
    }
}

/**
 * Build full prompt with options
 */
function buildPrompt(basePrompt: string, options?: VideoGenerationPayload["options"]): string {
    let prompt = basePrompt;

    if (options?.style) {
        prompt = `${options.style} style: ${prompt}`;
    }

    if (options?.negativePrompt) {
        prompt += `. Avoid: ${options.negativePrompt}`;
    }

    return prompt;
}

/**
 * Download video from URL to buffer
 */
async function downloadVideo(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Generate thumbnail from video (placeholder - would use FFmpeg)
 */
async function generateThumbnail(videoKey: string): Promise<string> {
    // TODO: Implement actual thumbnail generation with FFmpeg
    // For now, return a placeholder
    return `${videoKey.replace(".mp4", "-thumb.jpg")}`;
}

/**
 * Update job progress
 */
async function updateProgress(job: Job, stage: typeof GENERATION_STAGES[keyof typeof GENERATION_STAGES]) {
    const progress: JobProgress = {
        ...stage,
        timestamp: new Date(),
    };
    await job.updateProgress(progress);
    console.log(`📊 [${job.id}] ${stage.message} (${stage.percent}%)`);
}
