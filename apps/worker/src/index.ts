import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { config } from "dotenv";
import {
    QUEUE_NAMES,
    VideoGenerationPayload,
    PreviewGenerationPayload,
    AudioGenerationPayload,
    StoryAnalysisPayload,
    VideoAssemblyPayload,
} from "@repo/queue";
import { processVideoGeneration } from "./jobs/video-generation";
import { processExportVideo } from "./jobs/export-video";
import { processPreviewGeneration } from "./jobs/preview-generation";
import { processAudioGeneration } from "./jobs/audio-generation";

// ... (config and connection setup) ...

// ============================================
// VIDEO GENERATION WORKER
// ============================================
const videoWorker = new Worker<VideoGenerationPayload>(
    QUEUE_NAMES.VIDEO_GENERATION,
    async (job: Job<VideoGenerationPayload>) => {
        const type = job.data.type || "scene-generation";
        console.log(`🎬 Processing video generation job: ${job.id} [${type}]`);

        if (type === "project-export") {
            return await processExportVideo(job);
        }

        return await processVideoGeneration(job);
    },
    {
        connection,
        concurrency: 2,
        limiter: {
            max: 10,
            duration: 60000,
        },
    }
);

// ============================================
// PREVIEW GENERATION WORKER
// ============================================
const previewWorker = new Worker<PreviewGenerationPayload>(
    QUEUE_NAMES.PREVIEW_GENERATION,
    async (job: Job<PreviewGenerationPayload>) => {
        console.log(`🖼️ Processing preview generation job: ${job.id}`);
        return await processPreviewGeneration(job);
    },
    {
        connection,
        concurrency: 4, // Higher concurrency for quick previews
    }
);

// ============================================
// AUDIO GENERATION WORKER
// ============================================
const audioWorker = new Worker<AudioGenerationPayload>(
    QUEUE_NAMES.AUDIO_GENERATION,
    async (job: Job<AudioGenerationPayload>) => {
        console.log(`🎵 Processing audio generation job: ${job.id}`);
        return await processAudioGeneration(job);
    },
    {
        connection,
        concurrency: 3,
    }
);

// ============================================
// STORY ANALYSIS WORKER
// ============================================
const analysisWorker = new Worker<StoryAnalysisPayload>(
    QUEUE_NAMES.STORY_ANALYSIS,
    async (job: Job<StoryAnalysisPayload>) => {
        console.log(`📖 Processing story analysis job: ${job.id}`);

        await job.updateProgress({ stage: "analyzing", percent: 10, message: "Analyzing story...", timestamp: new Date() });

        // TODO: Integrate with @repo/ai story analysis
        // const analysis = await analyzeStory(job.data.content);

        await job.updateProgress({ stage: "completed", percent: 100, message: "Analysis complete!", timestamp: new Date() });

        return {
            success: true,
            jobId: job.id,
            completedAt: new Date().toISOString(),
        };
    },
    {
        connection,
        concurrency: 5,
    }
);

// ============================================
// VIDEO ASSEMBLY WORKER
// ============================================
const assemblyWorker = new Worker<VideoAssemblyPayload>(
    QUEUE_NAMES.VIDEO_ASSEMBLY,
    async (job: Job<VideoAssemblyPayload>) => {
        console.log(`🎞️ Processing video assembly job: ${job.id}`);

        await job.updateProgress({ stage: "assembling", percent: 10, message: "Assembling video...", timestamp: new Date() });

        // TODO: Integrate with FFmpeg assembly
        // const result = await assembleVideo(job.data);

        await job.updateProgress({ stage: "completed", percent: 100, message: "Assembly complete!", timestamp: new Date() });

        return {
            success: true,
            jobId: job.id,
            completedAt: new Date().toISOString(),
        };
    },
    {
        connection,
        concurrency: 1, // Assembly is resource-intensive
    }
);

// ============================================
// EVENT HANDLERS
// ============================================
const allWorkers = [videoWorker, previewWorker, audioWorker, analysisWorker, assemblyWorker];

allWorkers.forEach((worker) => {
    worker.on("completed", (job, result) => {
        console.log(`✅ Job ${job.id} completed:`, result?.success ?? true);
    });

    worker.on("failed", (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    worker.on("progress", (job, progress) => {
        const p = progress as { stage?: string; percent?: number; message?: string };
        console.log(`📊 Job ${job.id}: ${p.message || ""} (${p.percent || 0}%)`);
    });

    worker.on("stalled", (jobId) => {
        console.warn(`⚠️ Job ${jobId} stalled`);
    });
});

// ============================================
// STARTUP
// ============================================
console.log("🚀 Story-Genius Worker started!");
console.log("   Listening to queues:");
console.log(`   - ${QUEUE_NAMES.VIDEO_GENERATION}`);
console.log(`   - ${QUEUE_NAMES.PREVIEW_GENERATION}`);
console.log(`   - ${QUEUE_NAMES.AUDIO_GENERATION}`);
console.log(`   - ${QUEUE_NAMES.STORY_ANALYSIS}`);
console.log(`   - ${QUEUE_NAMES.VIDEO_ASSEMBLY}`);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
async function shutdown() {
    console.log("Shutting down workers...");
    await Promise.all(allWorkers.map((w) => w.close()));
    await connection.disconnect();
    process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
