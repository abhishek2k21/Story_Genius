import { z } from "zod";

export const ProjectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    coverImageUrl: z.string().url().optional(),
    isPublic: z.boolean().default(false),
    settings: z.object({
        aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3"]).default("16:9"),
        defaultDuration: z.number().default(60),
        visualStyle: z.string().optional(),
    }).default({}),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectInput = ProjectSchema.pick({
    title: true,
    description: true,
}).extend({
    settings: ProjectSchema.shape.settings.optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectInput>;
