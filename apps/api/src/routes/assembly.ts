import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { getQueueManager, QUEUE_NAMES, VideoAssemblyPayload } from "@repo/queue";

const assemblyRouter = new Hono();
assemblyRouter.use("*", authMiddleware);

const queueManager = getQueueManager();

// ============================================
// TRIGGER VIDEO ASSEMBLY
// ============================================
assemblyRouter.post(
    "/create",
    zValidator("json", z.object({
        projectId: z.string().uuid(),
        sceneIds: z.array(z.string().uuid()).min(1),
        output: z.object({
            resolution: z.enum(["720p", "1080p", "4k"]).default("1080p"),
            format: z.enum(["mp4", "webm"]).default("mp4"),
        }).default({ resolution: "1080p", format: "mp4" }),
        transitions: z.array(z.object({
            type: z.enum(["fade", "dissolve", "wipe", "cut"]),
            duration: z.number().min(0).max(2).default(0.5),
        })),
        audio: z.object({
            narrationKey: z.string().optional(),
            musicKey: z.string().optional(),
            musicVolume: z.number().min(0).max(1).default(0.3),
        }).optional(),
    })),
    async (c) => {
        const body = c.req.valid("json");
        const auth = c.get("auth");

        const payload: VideoAssemblyPayload = {
            projectId: body.projectId,
            sceneIds: body.sceneIds,
            output: body.output,
            transitions: body.transitions,
            audio: body.audio,
            metadata: {
                userId: auth.userId,
            },
        };

        try {
            const job = await queueManager.addVideoAssemblyJob(payload);

            return c.json({
                message: "Video assembly started",
                jobId: job.id,
                queueName: QUEUE_NAMES.VIDEO_ASSEMBLY,
                status: "queued",
            });
        } catch (error) {
            return c.json({ error: "Failed to queue assembly job" }, 500);
        }
    }
);

// ============================================
// CHECK ASSEMBLY STATUS
// ============================================
assemblyRouter.get(
    "/status/:jobId",
    async (c) => {
        const jobId = c.req.param("jobId");

        try {
            // Using generic job retrieval, assuming we know the queue
            // In a real app we might store job ID -> queue mapping in DB
            // But here we know it's assembly queue
            const job = await queueManager.getJob(QUEUE_NAMES.VIDEO_ASSEMBLY, jobId);

            if (!job) {
                return c.json({ error: "Job not found" }, 404);
            }

            const state = await job.getState();
            const progress = job.progress;

            return c.json({
                jobId: job.id,
                state,
                progress,
                result: job.returnvalue,
            });
        } catch (error) {
            return c.json({ error: "Failed to get status" }, 500);
        }
    }
);

export default assemblyRouter;
