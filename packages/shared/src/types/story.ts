import { z } from "zod";

export const StorySchema = z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    title: z.string().min(1).max(255),
    content: z.string(),
    wordCount: z.number().int().default(0),
    analysis: z.object({
        genre: z.string().optional(),
        tone: z.string().optional(),
        pacing: z.string().optional(),
        emotionalArc: z.array(z.object({
            position: z.number(),
            emotion: z.string(),
            intensity: z.number(),
        })).optional(),
        keyMoments: z.array(z.object({
            position: z.number(),
            description: z.string(),
            importance: z.number(),
        })).optional(),
    }).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Story = z.infer<typeof StorySchema>;

export const CharacterSchema = z.object({
    id: z.string().uuid(),
    storyId: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    traits: z.array(z.string()).default([]),
    relationships: z.array(z.object({
        characterId: z.string().uuid(),
        relationship: z.string(),
    })).default([]),
    referenceImageUrl: z.string().url().optional(),
    embedding: z.array(z.number()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Character = z.infer<typeof CharacterSchema>;

export const SceneSchema = z.object({
    id: z.string().uuid(),
    storyId: z.string().uuid(),
    order: z.number().int(),
    title: z.string().optional(),
    content: z.string(),
    duration: z.number().default(5),
    location: z.string().optional(),
    timeOfDay: z.string().optional(),
    mood: z.string().optional(),
    characters: z.array(z.string().uuid()).default([]),
    visualPlan: z.object({
        cameraMovement: z.string().optional(),
        lighting: z.string().optional(),
        colorPalette: z.array(z.string()).optional(),
        transition: z.string().optional(),
    }).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Scene = z.infer<typeof SceneSchema>;
