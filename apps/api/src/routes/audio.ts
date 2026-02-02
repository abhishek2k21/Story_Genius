import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { audioGenerator } from "@repo/ai";

const audioRouter = new Hono();
audioRouter.use("*", authMiddleware);

/**
 * GET /available-voices
 * List available voices from providers
 */
audioRouter.get(
    "/voices",
    async (c) => {
        const provider = c.req.query("provider") as "google" | "elevenlabs" || "google";

        try {
            const voices = await audioGenerator.listVoices(provider);
            return c.json({ provider, voices });
        } catch (error) {
            return c.json({ error: "Failed to fetch voices" }, 500);
        }
    }
);

/**
 * POST /preview-speech
 * Generate a short speech preview (without queuing)
 * Useful for testing voices in the UI
 */
audioRouter.post(
    "/preview-speech",
    zValidator("json", z.object({
        text: z.string().min(1).max(100), // Limit length for direct API
        provider: z.enum(["google", "elevenlabs"]).default("google"),
        voiceId: z.string().optional(),
        gender: z.enum(["MALE", "FEMALE"]).optional(),
    })),
    async (c) => {
        const body = c.req.valid("json");

        try {
            const audioBuffer = await audioGenerator.generateNarration({
                text: body.text,
                provider: body.provider,
                voiceId: body.voiceId,
                options: {
                    gender: body.gender,
                },
            });

            // Return as audio stream
            return c.body(audioBuffer, 200, {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `inline; filename="preview.mp3"`,
            });
        } catch (error) {
            return c.json({ error: "Failed to generate speech preview" }, 500);
        }
    }
);

export default audioRouter;
