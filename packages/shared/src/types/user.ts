import { z } from "zod";

export const UserPlanTier = z.enum(["free", "creator", "professional", "enterprise"]);
export type UserPlanTier = z.infer<typeof UserPlanTier>;

export const UserSchema = z.object({
    id: z.string().uuid(),
    clerkId: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    planTier: UserPlanTier.default("free"),
    creditsRemaining: z.number().int().default(0),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const PlanLimits: Record<UserPlanTier, { videos: number; duration: number; quality: string[] }> = {
    free: { videos: 3, duration: 60, quality: ["draft"] },
    creator: { videos: 30, duration: 300, quality: ["draft", "standard", "high"] },
    professional: { videos: 100, duration: 600, quality: ["draft", "standard", "high", "ultra"] },
    enterprise: { videos: -1, duration: -1, quality: ["draft", "standard", "high", "ultra", "cinema"] },
};
