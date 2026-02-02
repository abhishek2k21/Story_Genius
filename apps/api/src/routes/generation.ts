/**
 * Generation API Routes
 * Video and image generation endpoints
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import {
    generateVideo,
    pollVideoStatus,
    waitForVideoCompletion,
    VideoProvider,
    QualityTier,
} from "@repo/ai";
import {
    generateImage,
    generateCharacterImage,
    generateSceneImage,
    generateThumbnail,
} from "@repo/ai";

const generationRouter = new Hono();

generationRouter.use("*", authMiddleware);

// In-memory job tracking (would use Redis in production)
const jobStorage = new Map<string, { provider: string; type: "video" | "image" }>();

/**
 * POST /api/generation/video
 * Generate video with unified provider selection
 */
generationRouter.post(
    "/video",
    zValidator("json", z.object({
        prompt: z.string().min(1),
        negativePrompt: z.string().optional(),
        provider: z.enum(["runway", "pika", "kling", "auto"]).optional(),
        qualityTier: z.enum(["preview", "draft", "production"]).optional(),
        duration: z.number().min(3).max(15).optional(),
        aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
        style: z.string().optional(),
        imageUrl: z.string().url().optional(),
        seed: z.number().optional(),
    })),
    async (c) => {
        const body = c.req.valid("json");

        try {
            const result = await generateVideo({
                prompt: body.prompt,
                negativePrompt: body.negativePrompt,
                provider: body.provider as VideoProvider,
                qualityTier: body.qualityTier as QualityTier,
                duration: body.duration,
                aspectRatio: body.aspectRatio,
                style: body.style,
                imageUrl: body.imageUrl,
                seed: body.seed,
            });

            // Store job info for status polling
            jobStorage.set(result.id, {
                provider: result.provider,
                type: "video"
            });

            return c.json({
                id: result.id,
                provider: result.provider,
                status: result.status,
                estimatedCost: result.estimatedCost,
                message: "Video generation started",
            });
        } catch (error) {
            console.error("[Video Generation Error]", error);
            return c.json({ error: "Failed to start video generation" }, 500);
        }
    }
);

/**
 * POST /api/generation/image
 * Generate image with Imagen 3
 */
generationRouter.post(
    "/image",
    zValidator("json", z.object({
        prompt: z.string().min(1),
        type: z.enum(["generic", "character", "scene", "thumbnail"]).optional(),
        negativePrompt: z.string().optional(),
        aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
        style: z.string().optional(),
        title: z.string().optional(), // For thumbnails
    })),
    async (c) => {
        const { prompt, type, negativePrompt, aspectRatio, style, title } = c.req.valid("json");

        try {
            let result;

            switch (type) {
                case "character":
                    result = await generateCharacterImage(prompt, style);
                    break;
                case "scene":
                    result = await generateSceneImage(prompt, style);
                    break;
                case "thumbnail":
                    result = await generateThumbnail(prompt, title);
                    break;
                default:
                    const images = await generateImage({
                        prompt,
                        negativePrompt,
                        aspectRatio,
                        style,
                        numberOfImages: 1,
                    });
                    result = images[0];
            }

            return c.json({
                success: true,
                image: {
                    base64: result.base64Data,
                    mimeType: result.mimeType,
                },
            });
        } catch (error) {
            console.error("[Image Generation Error]", error);
            return c.json({ error: "Failed to generate image" }, 500);
        }
    }
);

/**
 * GET /api/generation/status/:id
 * Poll generation status
 */
generationRouter.get("/status/:id", async (c) => {
    const id = c.req.param("id");
    const job = jobStorage.get(id);

    if (!job) {
        return c.json({ error: "Job not found" }, 404);
    }

    try {
        if (job.type === "video") {
            const status = await pollVideoStatus(id, job.provider as any);
            return c.json(status);
        }

        // Images are generated synchronously, so they're always complete
        return c.json({ id, status: "completed" });
    } catch (error) {
        console.error("[Status Poll Error]", error);
        return c.json({ error: "Failed to get status" }, 500);
    }
});

/**
 * POST /api/generation/wait/:id
 * Wait for generation completion (long-polling)
 */
generationRouter.post(
    "/wait/:id",
    zValidator("json", z.object({
        timeoutMs: z.number().min(10000).max(600000).optional(),
    })),
    async (c) => {
        const id = c.req.param("id");
        const { timeoutMs } = c.req.valid("json");
        const job = jobStorage.get(id);

        if (!job) {
            return c.json({ error: "Job not found" }, 404);
        }

        try {
            if (job.type === "video") {
                const result = await waitForVideoCompletion(id, job.provider as any, timeoutMs);
                return c.json(result);
            }

            return c.json({ id, status: "completed" });
        } catch (error) {
            console.error("[Wait Error]", error);
            return c.json({ error: "Generation failed or timed out" }, 500);
        }
    }
);

/**
 * GET /api/generation/providers
 * List available providers and their capabilities
 */
generationRouter.get("/providers", async (c) => {
    return c.json({
        video: [
            {
                id: "runway",
                name: "Runway Gen-3 Alpha",
                maxDuration: 10,
                qualityTiers: ["draft", "production"],
                costPerSecond: 0.05,
            },
            {
                id: "pika",
                name: "Pika Labs",
                maxDuration: 5,
                qualityTiers: ["preview", "draft", "production"],
                costPerSecond: 0.02,
            },
            {
                id: "kling",
                name: "Kling AI",
                maxDuration: 15,
                qualityTiers: ["draft", "production"],
                costPerSecond: 0.03,
            },
        ],
        image: [
            {
                id: "imagen",
                name: "Google Imagen 3",
                types: ["generic", "character", "scene", "thumbnail"],
            },
        ],
    });
});

export default generationRouter;
