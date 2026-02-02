/**
 * Job Types and Payloads for BullMQ Queues
 */

// Queue Names
export const QUEUE_NAMES = {
    VIDEO_GENERATION: "video-generation",
    PREVIEW_GENERATION: "preview-generation",
    AUDIO_GENERATION: "audio-generation",
    STORY_ANALYSIS: "story-analysis",
    VIDEO_ASSEMBLY: "video-assembly",
    CLEANUP: "cleanup",
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// Job Priority Levels
export const JOB_PRIORITY = {
    URGENT: 1,      // User is actively waiting
    HIGH: 2,        // Premium user or time-sensitive
    NORMAL: 3,      // Standard user request
    LOW: 4,         // Background processing
    BATCH: 5,       // Bulk operations
} as const;

export type JobPriority = typeof JOB_PRIORITY[keyof typeof JOB_PRIORITY];

// Video Provider Types
export type VideoProvider = "runway" | "pika" | "kling";
export type PreviewStyle = "A" | "B" | "C" | "D";

// ============================================
// VIDEO GENERATION JOB
// ============================================
export interface VideoGenerationPayload {
    type?: "scene-generation" | "scene-regenerate" | "project-export";
    projectId: string;
    sceneId?: string;
    prompt?: string;
    duration?: number;
    provider?: VideoProvider;
    options?: {
        aspectRatio?: "16:9" | "9:16" | "1:1";
        resolution?: "720p" | "1080p" | "4k";
        style?: string;
        negativePrompt?: string;
    };
    params?: any; // For export/regenerate
    metadata?: {
        userId: string;
        chapterIndex?: number;
        sceneIndex?: number;
    };
}

export interface VideoGenerationResult {
    success: boolean;
    videoUrl?: string;
    videoKey?: string;
    thumbnailUrl?: string;
    duration?: number;
    provider: VideoProvider;
    error?: string;
    processingTimeMs?: number;
}

// ============================================
// PREVIEW GENERATION JOB
// ============================================
export interface PreviewGenerationPayload {
    projectId: string;
    sceneId: string;
    prompt: string;
    styles: PreviewStyle[];
    options?: {
        aspectRatio?: "16:9" | "9:16" | "1:1";
        lowRes?: boolean;
    };
    metadata?: {
        userId: string;
    };
}

export interface PreviewGenerationResult {
    success: boolean;
    previews: {
        style: PreviewStyle;
        imageUrl: string;
        imageKey: string;
        provider: VideoProvider;
    }[];
    error?: string;
}

// ============================================
// AUDIO GENERATION JOB
// ============================================
export interface AudioGenerationPayload {
    projectId: string;
    sceneId: string;
    narrationText?: string;
    voiceId?: string;
    musicStyle?: string;
    duration: number;
    metadata?: {
        userId: string;
    };
}

export interface AudioGenerationResult {
    success: boolean;
    narrationUrl?: string;
    narrationKey?: string;
    musicUrl?: string;
    musicKey?: string;
    error?: string;
}

// ============================================
// STORY ANALYSIS JOB
// ============================================
export interface StoryAnalysisPayload {
    projectId: string;
    storyId: string;
    content: string;
    options?: {
        extractCharacters?: boolean;
        extractSettings?: boolean;
        extractEmotions?: boolean;
        generateScenes?: boolean;
    };
    metadata?: {
        userId: string;
    };
}

export interface StoryAnalysisResult {
    success: boolean;
    characters?: Array<{
        name: string;
        description: string;
        traits: string[];
    }>;
    settings?: Array<{
        name: string;
        description: string;
    }>;
    emotions?: string[];
    sceneCount?: number;
    error?: string;
}

// ============================================
// VIDEO ASSEMBLY JOB
// ============================================
export interface VideoAssemblyPayload {
    projectId: string;
    sceneIds: string[];
    transitions: Array<{
        type: "fade" | "dissolve" | "wipe" | "cut";
        duration: number;
    }>;
    audio?: {
        narrationKey?: string;
        musicKey?: string;
        musicVolume?: number;
    };
    output: {
        format: "mp4" | "webm";
        resolution: "720p" | "1080p" | "4k";
    };
    metadata?: {
        userId: string;
    };
}

export interface VideoAssemblyResult {
    success: boolean;
    outputUrl?: string;
    outputKey?: string;
    duration?: number;
    fileSize?: number;
    error?: string;
}

// ============================================
// JOB PROGRESS TRACKING
// ============================================
export interface JobProgress {
    stage: string;
    percent: number;
    message: string;
    timestamp: Date;
    details?: Record<string, unknown>;
}

export const GENERATION_STAGES = {
    QUEUED: { stage: "queued", percent: 0, message: "Job queued" },
    STARTING: { stage: "starting", percent: 5, message: "Initializing..." },
    PREPARING_PROMPT: { stage: "preparing", percent: 10, message: "Preparing prompt..." },
    CALLING_API: { stage: "api_call", percent: 20, message: "Sending to AI provider..." },
    PROCESSING: { stage: "processing", percent: 40, message: "AI is generating..." },
    WAITING_RESULT: { stage: "waiting", percent: 60, message: "Waiting for result..." },
    DOWNLOADING: { stage: "downloading", percent: 75, message: "Downloading output..." },
    UPLOADING: { stage: "uploading", percent: 85, message: "Uploading to storage..." },
    FINALIZING: { stage: "finalizing", percent: 95, message: "Finalizing..." },
    COMPLETED: { stage: "completed", percent: 100, message: "Complete!" },
    FAILED: { stage: "failed", percent: -1, message: "Failed" },
} as const;

// ============================================
// JOB LIFECYCLE EVENTS
// ============================================
export type JobEventType =
    | "job:created"
    | "job:started"
    | "job:progress"
    | "job:completed"
    | "job:failed"
    | "job:paused"
    | "job:resumed"
    | "job:cancelled";

export interface JobEvent {
    type: JobEventType;
    jobId: string;
    queueName: QueueName;
    timestamp: Date;
    data?: unknown;
}

// ============================================
// JOB OPTIONS
// ============================================
export interface JobOptions {
    priority?: JobPriority;
    attempts?: number;
    backoff?: {
        type: "exponential" | "fixed";
        delay: number;
    };
    delay?: number;
    removeOnComplete?: boolean | { age: number; count: number };
    removeOnFail?: boolean | { age: number };
}

export const DEFAULT_JOB_OPTIONS: JobOptions = {
    priority: JOB_PRIORITY.NORMAL,
    attempts: 3,
    backoff: {
        type: "exponential",
        delay: 5000,
    },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
};

export const URGENT_JOB_OPTIONS: JobOptions = {
    priority: JOB_PRIORITY.URGENT,
    attempts: 5,
    backoff: {
        type: "fixed",
        delay: 2000,
    },
    removeOnComplete: { age: 1 * 3600, count: 100 },
};
