import { z } from "zod";

export const StoryAnalysis = z.object({
    genre: z.string(),
    subGenre: z.string().optional(),
    tone: z.string(),
    mood: z.string(),
    pacing: z.enum(["slow", "moderate", "fast", "variable"]),
    themes: z.array(z.string()),
    targetAudience: z.string().optional(),
    emotionalArc: z.array(z.object({
        position: z.number().min(0).max(1),
        emotion: z.string(),
        intensity: z.number().min(0).max(1),
        description: z.string(),
    })),
    keyMoments: z.array(z.object({
        position: z.number().min(0).max(1),
        description: z.string(),
        importance: z.number().min(1).max(10),
        sceneType: z.string(),
    })),
});

export type StoryAnalysis = z.infer<typeof StoryAnalysis>;

export const CharacterProfile = z.object({
    name: z.string(),
    physicalDescription: z.string(),
    personality: z.array(z.string()),
    role: z.enum(["protagonist", "antagonist", "supporting", "minor"]),
    emotionalState: z.string(),
    age: z.string().optional(),
    clothing: z.string().optional(),
    distinctiveFeatures: z.array(z.string()).optional(),
});

export type CharacterProfile = z.infer<typeof CharacterProfile>;

export const SceneBreakdown = z.object({
    sceneNumber: z.number(),
    title: z.string(),
    summary: z.string(),
    content: z.string(),
    duration: z.number(),
    location: z.string(),
    timeOfDay: z.enum(["dawn", "morning", "afternoon", "evening", "night", "unknown"]),
    weather: z.string().optional(),
    mood: z.string(),
    characters: z.array(z.string()),
    visualStyle: z.object({
        cameraAngle: z.string(),
        cameraMovement: z.string(),
        lighting: z.string(),
        colorPalette: z.array(z.string()),
    }),
    transition: z.object({
        type: z.enum(["cut", "fade", "dissolve", "wipe", "none"]),
        duration: z.number(),
    }),
});

export type SceneBreakdown = z.infer<typeof SceneBreakdown>;

export const VideoPrompt = z.object({
    prompt: z.string(),
    negativePrompt: z.string().optional(),
    style: z.string(),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]),
    duration: z.number(),
    motionStrength: z.number().min(0).max(1).optional(),
});

export type VideoPrompt = z.infer<typeof VideoPrompt>;
