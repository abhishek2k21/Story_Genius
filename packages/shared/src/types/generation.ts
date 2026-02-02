import { z } from "zod";

export const GenerationStatus = z.enum([
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled",
]);
export type GenerationStatus = z.infer<typeof GenerationStatus>;

export const AssetType = z.enum(["image", "video", "audio", "thumbnail", "subtitle"]);
export type AssetType = z.infer<typeof AssetType>;

export const VideoQuality = z.enum(["draft", "standard", "high", "ultra", "cinema"]);
export type VideoQuality = z.infer<typeof VideoQuality>;

export const GenerationJobSchema = z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    storyId: z.string().uuid(),
    sceneId: z.string().uuid().optional(),
    type: z.enum(["scene", "audio", "full_video"]),
    status: GenerationStatus,
    progress: z.number().min(0).max(100).default(0),
    provider: z.string().optional(),
    quality: VideoQuality.default("standard"),
    result: z.object({
        assetUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        duration: z.number().optional(),
        metadata: z.record(z.unknown()).optional(),
    }).optional(),
    error: z.string().optional(),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type GenerationJob = z.infer<typeof GenerationJobSchema>;

export const VideoGenerationInput = z.object({
    sceneId: z.string().uuid(),
    prompt: z.string(),
    style: z.string().optional(),
    quality: VideoQuality.default("standard"),
    duration: z.number().min(1).max(30).default(5),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
});

export type VideoGenerationInput = z.infer<typeof VideoGenerationInput>;
