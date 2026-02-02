
import { Hono } from "hono";
import { z } from "zod";
import { getQueueManager } from "@repo/queue/src/index";

const exportRouter = new Hono();

// Schema for export request
const exportSchema = z.object({
    format: z.enum(["mp4", "mov", "webm"]).default("mp4"),
    resolution: z.enum(["720p", "1080p", "2k", "4k", "9:16", "1:1"]).default("1080p"),
    preset: z.enum(["generic", "youtube", "tiktok", "instagram"]).default("generic"),
});

// TRIGGER EXPORT JOB
exportRouter.post("/:projectId/export", async (c) => {
    const projectId = c.req.param("projectId");

    try {
        const body = await c.req.json();
        const validatedBody = exportSchema.parse(body);
        const queue = getQueueManager();

        // Add export job to queue (Video Generation queue handles exports too)
        const job = await queue.addJob("video-generation", {
            type: "project-export",
            projectId,
            params: validatedBody
        });

        return c.json({
            message: "Export job started",
            jobId: job.id
        });
    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            return c.json({ error: "Validation failed", details: error.errors }, 400);
        }
        return c.json({ error: "Failed to queue export job" }, 500);
    }
});

export { exportRouter };
