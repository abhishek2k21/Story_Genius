import { Queue, QueueEvents, Worker, Job, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import {
    QUEUE_NAMES,
    QueueName,
    JobOptions,
    DEFAULT_JOB_OPTIONS,
    JobProgress,
    VideoGenerationPayload,
    PreviewGenerationPayload,
    AudioGenerationPayload,
    StoryAnalysisPayload,
    VideoAssemblyPayload,
} from "./types";

let redisConnection: IORedis | null = null;

/**
 * Get or create Redis connection
 */
export function getRedisConnection(): IORedis {
    if (!redisConnection) {
        redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });
    }
    return redisConnection;
}

/**
 * Queue Manager - Factory for creating and managing queues
 */
export class QueueManager {
    private queues: Map<QueueName, Queue> = new Map();
    private queueEvents: Map<QueueName, QueueEvents> = new Map();
    private connection: IORedis;

    constructor(connection?: IORedis) {
        this.connection = connection || getRedisConnection();
    }

    /**
     * Get or create a queue
     */
    getQueue(name: QueueName): Queue {
        if (!this.queues.has(name)) {
            const queue = new Queue(name, {
                connection: this.connection,
                defaultJobOptions: {
                    attempts: DEFAULT_JOB_OPTIONS.attempts,
                    backoff: DEFAULT_JOB_OPTIONS.backoff,
                    removeOnComplete: DEFAULT_JOB_OPTIONS.removeOnComplete,
                    removeOnFail: DEFAULT_JOB_OPTIONS.removeOnFail,
                },
            });
            this.queues.set(name, queue);
        }
        return this.queues.get(name)!;
    }

    /**
     * Get queue events for real-time monitoring
     */
    getQueueEvents(name: QueueName): QueueEvents {
        if (!this.queueEvents.has(name)) {
            const events = new QueueEvents(name, { connection: this.connection });
            this.queueEvents.set(name, events);
        }
        return this.queueEvents.get(name)!;
    }

    // ============================================
    // VIDEO GENERATION
    // ============================================
    async addVideoGenerationJob(
        payload: VideoGenerationPayload,
        options?: JobOptions
    ): Promise<Job<VideoGenerationPayload>> {
        const queue = this.getQueue(QUEUE_NAMES.VIDEO_GENERATION);
        const jobOptions = this.mergeOptions(options);

        return await queue.add(
            `video-${payload.sceneId}`,
            payload,
            jobOptions
        );
    }

    // ============================================
    // PREVIEW GENERATION
    // ============================================
    async addPreviewGenerationJob(
        payload: PreviewGenerationPayload,
        options?: JobOptions
    ): Promise<Job<PreviewGenerationPayload>> {
        const queue = this.getQueue(QUEUE_NAMES.PREVIEW_GENERATION);
        const jobOptions = this.mergeOptions({ ...options, priority: 1 }); // High priority for previews

        return await queue.add(
            `preview-${payload.sceneId}`,
            payload,
            jobOptions
        );
    }

    // ============================================
    // AUDIO GENERATION
    // ============================================
    async addAudioGenerationJob(
        payload: AudioGenerationPayload,
        options?: JobOptions
    ): Promise<Job<AudioGenerationPayload>> {
        const queue = this.getQueue(QUEUE_NAMES.AUDIO_GENERATION);
        const jobOptions = this.mergeOptions(options);

        return await queue.add(
            `audio-${payload.sceneId}`,
            payload,
            jobOptions
        );
    }

    // ============================================
    // STORY ANALYSIS
    // ============================================
    async addStoryAnalysisJob(
        payload: StoryAnalysisPayload,
        options?: JobOptions
    ): Promise<Job<StoryAnalysisPayload>> {
        const queue = this.getQueue(QUEUE_NAMES.STORY_ANALYSIS);
        const jobOptions = this.mergeOptions(options);

        return await queue.add(
            `analysis-${payload.storyId}`,
            payload,
            jobOptions
        );
    }

    // ============================================
    // VIDEO ASSEMBLY
    // ============================================
    async addVideoAssemblyJob(
        payload: VideoAssemblyPayload,
        options?: JobOptions
    ): Promise<Job<VideoAssemblyPayload>> {
        const queue = this.getQueue(QUEUE_NAMES.VIDEO_ASSEMBLY);
        const jobOptions = this.mergeOptions(options);

        return await queue.add(
            `assembly-${payload.projectId}`,
            payload,
            jobOptions
        );
    }

    // ============================================
    // BATCH OPERATIONS
    // ============================================
    async addBatchVideoJobs(
        payloads: VideoGenerationPayload[],
        options?: JobOptions
    ): Promise<Job<VideoGenerationPayload>[]> {
        const queue = this.getQueue(QUEUE_NAMES.VIDEO_GENERATION);
        const jobOptions = this.mergeOptions({ ...options, priority: 5 });

        const jobs = payloads.map((payload) => ({
            name: `video-${payload.sceneId}`,
            data: payload,
            opts: jobOptions,
        }));

        return await queue.addBulk(jobs);
    }

    // ============================================
    // JOB CONTROL
    // ============================================
    async getJob(queueName: QueueName, jobId: string): Promise<Job | null> {
        const queue = this.getQueue(queueName);
        const job = await queue.getJob(jobId);
        return job || null;
    }

    async pauseJob(queueName: QueueName, jobId: string): Promise<void> {
        const job = await this.getJob(queueName, jobId);
        if (job) {
            // BullMQ doesn't have direct pause, but we can use job state
            await job.moveToDelayed(Date.now() + 999999999); // Far future
        }
    }

    async resumeJob(queueName: QueueName, jobId: string): Promise<void> {
        const job = await this.getJob(queueName, jobId);
        if (job) {
            await job.promote();
        }
    }

    async cancelJob(queueName: QueueName, jobId: string): Promise<void> {
        const job = await this.getJob(queueName, jobId);
        if (job) {
            await job.remove();
        }
    }

    async retryJob(queueName: QueueName, jobId: string): Promise<void> {
        const job = await this.getJob(queueName, jobId);
        if (job) {
            await job.retry();
        }
    }

    // ============================================
    // QUEUE STATS
    // ============================================
    async getQueueStats(queueName: QueueName) {
        const queue = this.getQueue(queueName);
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
        ]);

        return { waiting, active, completed, failed, delayed };
    }

    async getAllStats() {
        const stats: Record<string, Awaited<ReturnType<typeof this.getQueueStats>>> = {};

        for (const queueName of Object.values(QUEUE_NAMES)) {
            stats[queueName] = await this.getQueueStats(queueName);
        }

        return stats;
    }

    // ============================================
    // CLEANUP
    // ============================================
    async close(): Promise<void> {
        for (const queue of this.queues.values()) {
            await queue.close();
        }
        for (const events of this.queueEvents.values()) {
            await events.close();
        }
        if (redisConnection) {
            await redisConnection.disconnect();
            redisConnection = null;
        }
    }

    private mergeOptions(options?: JobOptions): JobsOptions {
        return {
            priority: options?.priority ?? DEFAULT_JOB_OPTIONS.priority,
            attempts: options?.attempts ?? DEFAULT_JOB_OPTIONS.attempts,
            backoff: options?.backoff ?? DEFAULT_JOB_OPTIONS.backoff,
            delay: options?.delay,
            removeOnComplete: options?.removeOnComplete ?? DEFAULT_JOB_OPTIONS.removeOnComplete,
            removeOnFail: options?.removeOnFail ?? DEFAULT_JOB_OPTIONS.removeOnFail,
        };
    }
}

// Singleton instance
let queueManager: QueueManager | null = null;

export function getQueueManager(): QueueManager {
    if (!queueManager) {
        queueManager = new QueueManager();
    }
    return queueManager;
}
