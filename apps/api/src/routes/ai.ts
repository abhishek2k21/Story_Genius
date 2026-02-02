import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { streamText } from "hono/streaming";
import { authMiddleware } from "../middleware/auth";
import { writingAssistant } from "@repo/ai";

const aiRouter = new Hono();

// Schema for writing assistance
const processSchema = z.object({
    text: z.string().min(1).max(10000), // Reasonable limit
    mode: z.enum(["improve", "expand", "shorten", "fix", "tone", "continue"]),
    context: z.string().optional(),
    tone: z.enum(["professional", "dramatic", "funny", "dark", "romantic", "mysterious"]).optional(),
    instruction: z.string().optional(),
});

// Use auth middleware for all AI routes
aiRouter.use("*", authMiddleware);

/**
 * POST /ai/process
 * Handle standard text processing (non-streaming)
 */
aiRouter.post(
    "/process",
    zValidator("json", processSchema),
    async (c) => {
        const { text, mode, context, tone, instruction } = c.req.valid("json");

        try {
            const result = await writingAssistant.processText({
                text,
                mode,
                context,
                tone,
                instruction
            });

            return c.json({ result });
        } catch (error) {
            console.error("[AI Process Error]", error);
            return c.json({ error: "Failed to process text" }, 500);
        }
    }
);

/**
 * POST /ai/continue/stream
 * Stream story continuation
 */
aiRouter.post(
    "/continue/stream",
    zValidator("json", z.object({
        text: z.string().min(1),
        context: z.string().optional()
    })),
    async (c) => {
        const { text, context } = c.req.valid("json");

        return streamText(c, async (stream) => {
            try {
                // Stream from Vertex AI
                for await (const chunk of writingAssistant.streamContinueStory(text, context)) {
                    await stream.write(chunk);
                }
            } catch (error) {
                console.error("[AI Stream Error]", error);
                await stream.write("\n[Error generating continuation]");
            }
        });
    }
);

export default aiRouter;
