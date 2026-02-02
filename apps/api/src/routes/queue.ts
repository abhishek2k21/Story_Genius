import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { streamSSE } from "hono/streaming";
import { authMiddleware } from "../middleware/auth";
import {
    getQueueManager,
    QUEUE_NAMES,
    QueueName,
    JOB_PRIORITY,
    VideoGenerationPayload,
    PreviewGenerationPayload,
    AudioGenerationPayload,
} from "@repo/queue";

const queueRouter = new Hono();
queueRouter.use("*", authMiddleware);

const queueManager = getQueueManager();

// ============================================
// SUBMIT VIDEO GENERATION JOB
// ============================================
queueRouter.post(
    "/video/:sceneId",
    zValidator("json", z.object({
        projectId: z.string().uuid(),
        prompt: z.string().min(1),
        duration: z.number().min(1).max(30).default(5),
        provider: z.enum(["runway", "pika", "kling"]).default("runway"),
        priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
        options: z.object({
            aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
            resolution: z.enum(["720p", "1080p", "4k"]).optional(),
            style: z.string().optional(),
            negativePrompt: z.string().optional(),
        }).optional(),
    })),
    async (c) => {
        const sceneId = c.req.param("sceneId");
        const body = c.req.valid("json");
        const auth = c.get("auth");

        const payload: VideoGenerationPayload = {
            projectId: body.projectId,
            sceneId,
            prompt: body.prompt,
            duration: body.duration,
            provider: body.provider,
            options: body.options,
            metadata: {
                userId: auth.userId,
            },
        };

        const priority = body.priority === "urgent" ? JOB_PRIORITY.URGENT
            : body.priority === "high" ? JOB_PRIORITY.HIGH
                : body.priority === "low" ? JOB_PRIORITY.LOW
                    : JOB_PRIORITY.NORMAL;

        const job = await queueManager.addVideoGenerationJob(payload, { priority });

        return c.json({
            message: "Video generation job submitted",
            jobId: job.id,
            queueName: QUEUE_NAMES.VIDEO_GENERATION,
            status: "queued",
        });
    }
);

// ============================================
// SUBMIT PREVIEW GENERATION JOB
// ============================================
queueRouter.post(
    "/preview/:sceneId",
    zValidator("json", z.object({
        projectId: z.string().uuid(),
        prompt: z.string().min(1),
        styles: z.array(z.enum(["A", "B", "C", "D"])).default(["A", "B", "C", "D"]),
        options: z.object({
            aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
        }).optional(),
    })),
    async (c) => {
        const sceneId = c.req.param("sceneId");
        const body = c.req.valid("json");
        const auth = c.get("auth");

        const payload: PreviewGenerationPayload = {
            projectId: body.projectId,
            sceneId,
            prompt: body.prompt,
            styles: body.styles,
            options: body.options,
            metadata: {
                userId: auth.userId,
            },
        };

        const job = await queueManager.addPreviewGenerationJob(payload);

        return c.json({
            message: "Preview generation job submitted",
            jobId: job.id,
            queueName: QUEUE_NAMES.PREVIEW_GENERATION,
            status: "queued",
        });
    }
);

// ============================================
// SUBMIT AUDIO GENERATION JOB
// ============================================
queueRouter.post(
    "/audio/:sceneId",
    zValidator("json", z.object({
        projectId: z.string().uuid(),
        narrationText: z.string().optional(),
        voiceId: z.string().optional(),
        musicStyle: z.string().optional(),
        duration: z.number().min(1).max(300).default(30),
    })),
    async (c) => {
        const sceneId = c.req.param("sceneId");
        const body = c.req.valid("json");
        const auth = c.get("auth");

        const payload: AudioGenerationPayload = {
            projectId: body.projectId,
            sceneId,
            narrationText: body.narrationText,
            voiceId: body.voiceId,
            musicStyle: body.musicStyle,
            duration: body.duration,
            metadata: {
                userId: auth.userId,
            },
        };

        const job = await queueManager.addAudioGenerationJob(payload);

        return c.json({
            message: "Audio generation job submitted",
            jobId: job.id,
            queueName: QUEUE_NAMES.AUDIO_GENERATION,
            status: "queued",
        });
    }
);

// ============================================
// BATCH VIDEO GENERATION
// ============================================
queueRouter.post(
    "/batch/video",
    zValidator("json", z.object({
        projectId: z.string().uuid(),
        scenes: z.array(z.object({
            sceneId: z.string().uuid(),
            prompt: z.string().min(1),
            duration: z.number().min(1).max(30).default(5),
            provider: z.enum(["runway", "pika", "kling"]).default("runway"),
        })),
    })),
    async (c) => {
        const body = c.req.valid("json");
        const auth = c.get("auth");

        const payloads: VideoGenerationPayload[] = body.scenes.map((scene) => ({
            projectId: body.projectId,
            sceneId: scene.sceneId,
            prompt: scene.prompt,
            duration: scene.duration,
            provider: scene.provider,
            metadata: {
                userId: auth.userId,
            },
        }));

        const jobs = await queueManager.addBatchVideoJobs(payloads);

        return c.json({
            message: "Batch video generation submitted",
            jobCount: jobs.length,
            jobIds: jobs.map((j) => j.id),
            queueName: QUEUE_NAMES.VIDEO_GENERATION,
        });
    }
);

// ============================================
// GET JOB STATUS
// ============================================
queueRouter.get(
    "/jobs/:queueName/:jobId",
    async (c) => {
        const queueName = c.req.param("queueName") as QueueName;
        const jobId = c.req.param("jobId");

        const job = await queueManager.getJob(queueName, jobId);

        if (!job) {
            return c.json({ error: "Job not found" }, 404);
        }

        const state = await job.getState();
        const progress = job.progress;

        return c.json({
            jobId: job.id,
            queueName,
            state,
            progress,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp,
            finishedOn: job.finishedOn,
        });
    }
);

// ============================================
// REAL-TIME JOB PROGRESS (SSE)
// ============================================
queueRouter.get(
    "/jobs/:queueName/:jobId/progress",
    async (c) => {
        const queueName = c.req.param("queueName") as QueueName;
        const jobId = c.req.param("jobId");

        const job = await queueManager.getJob(queueName, jobId);
        if (!job) {
            return c.json({ error: "Job not found" }, 404);
        }

        return streamSSE(c, async (stream) => {
            let isCompleted = false;

            // Send initial state
            const initialState = await job.getState();
            await stream.writeSSE({
                data: JSON.stringify({
                    type: "state",
                    state: initialState,
                    progress: job.progress,
                }),
            });

            // Poll for updates
            while (!isCompleted) {
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const currentJob = await queueManager.getJob(queueName, jobId);
                if (!currentJob) {
                    await stream.writeSSE({ data: JSON.stringify({ type: "removed" }) });
                    break;
                }

                const state = await currentJob.getState();

                await stream.writeSSE({
                    data: JSON.stringify({
                        type: "update",
                        state,
                        progress: currentJob.progress,
                        result: currentJob.returnvalue,
                    }),
                });

                if (state === "completed" || state === "failed") {
                    isCompleted = true;
                }
            }
        });
    }
);

// ============================================
// PAUSE JOB
// ============================================
queueRouter.post(
    "/jobs/:queueName/:jobId/pause",
    async (c) => {
        const queueName = c.req.param("queueName") as QueueName;
        const jobId = c.req.param("jobId");

        try {
            await queueManager.pauseJob(queueName, jobId);
            return c.json({ message: "Job paused", jobId });
        } catch (error) {
            return c.json({ error: "Failed to pause job" }, 500);
        }
    }
);

// ============================================
// RESUME JOB
// ============================================
queueRouter.post(
    "/jobs/:queueName/:jobId/resume",
    async (c) => {
        const queueName = c.req.param("queueName") as QueueName;
        const jobId = c.req.param("jobId");

        try {
            await queueManager.resumeJob(queueName, jobId);
            return c.json({ message: "Job resumed", jobId });
        } catch (error) {
            return c.json({ error: "Failed to resume job" }, 500);
        }
    }
);

// ============================================
// CANCEL JOB
// ============================================
queueRouter.delete(
    "/jobs/:queueName/:jobId",
    async (c) => {
        const queueName = c.req.param("queueName") as QueueName;
        const jobId = c.req.param("jobId");

        try {
            await queueManager.cancelJob(queueName, jobId);
            return c.json({ message: "Job cancelled", jobId });
        } catch (error) {
            return c.json({ error: "Failed to cancel job" }, 500);
        }
    }
);

// ============================================
// RETRY FAILED JOB
// ============================================
queueRouter.post(
    "/jobs/:queueName/:jobId/retry",
    async (c) => {
        const queueName = c.req.param("queueName") as QueueName;
        const jobId = c.req.param("jobId");

        try {
            await queueManager.retryJob(queueName, jobId);
            return c.json({ message: "Job retried", jobId });
        } catch (error) {
            return c.json({ error: "Failed to retry job" }, 500);
        }
    }
);

// ============================================
// QUEUE STATISTICS
// ============================================
queueRouter.get("/stats", async (c) => {
    const stats = await queueManager.getAllStats();
    return c.json({ stats });
});

queueRouter.get("/stats/:queueName", async (c) => {
    const queueName = c.req.param("queueName") as QueueName;
    const stats = await queueManager.getQueueStats(queueName);
    return c.json({ queueName, stats });
});

export default queueRouter;
