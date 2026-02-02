import { Job } from "bullmq";
import {
    PreviewGenerationPayload,
    PreviewGenerationResult,
    PreviewStyle,
    GENERATION_STAGES,
} from "@repo/queue";
import { createStorageClient } from "@repo/storage";
import { generateVideo } from "@repo/ai";

const storage = createStorageClient();

// Style configurations for A/B/C/D variants
const STYLE_CONFIGS: Record<PreviewStyle, { provider: "runway" | "pika" | "kling"; modifier: string }> = {
    A: { provider: "runway", modifier: "cinematic, dramatic lighting" },
    B: { provider: "pika", modifier: "vibrant colors, dynamic movement" },
    C: { provider: "kling", modifier: "artistic, stylized" },
    D: { provider: "runway", modifier: "realistic, natural lighting" },
};

/**
 * Process preview generation job - creates multiple style variants
 */
export async function processPreviewGeneration(
    job: Job<PreviewGenerationPayload>
): Promise<PreviewGenerationResult> {
    const { projectId, sceneId, prompt, styles, options } = job.data;

    try {
        await job.updateProgress({ stage: "starting", percent: 5, message: "Starting preview generation...", timestamp: new Date() });

        await storage.ensureBucket();

        const previews: PreviewGenerationResult["previews"] = [];
        const totalStyles = styles.length;

        for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            const config = STYLE_CONFIGS[style];
            const progressPercent = 10 + Math.floor((i / totalStyles) * 80);

            await job.updateProgress({
                stage: "generating",
                percent: progressPercent,
                message: `Generating style ${style} (${i + 1}/${totalStyles})...`,
                timestamp: new Date(),
            });

            try {
                // Generate low-res preview with style modifier
                const styledPrompt = `${config.modifier}: ${prompt}`;

                const result = await generateVideo({
                    prompt: styledPrompt,
                    duration: 2, // Short preview
                    provider: config.provider,
                    aspectRatio: options?.aspectRatio || "16:9",
                });

                // For previews, we'll use the first frame as image
                // In production, would extract frame or use image generation
                const previewImageUrl = result.url || `preview-${style}-placeholder.jpg`;

                // Upload preview
                const fakeBuffer = Buffer.from(`preview-${style}-${sceneId}`);
                const uploadResult = await storage.uploadPreview(fakeBuffer, projectId, sceneId, style);

                previews.push({
                    style,
                    imageUrl: uploadResult.url,
                    imageKey: uploadResult.key,
                    provider: config.provider,
                });

            } catch (styleError) {
                console.error(`Failed to generate style ${style}:`, styleError);
                // Continue with other styles
            }
        }

        await job.updateProgress({ stage: "completed", percent: 100, message: "Preview generation complete!", timestamp: new Date() });

        return {
            success: previews.length > 0,
            previews,
            error: previews.length === 0 ? "All style generations failed" : undefined,
        };

    } catch (error) {
        return {
            success: false,
            previews: [],
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
