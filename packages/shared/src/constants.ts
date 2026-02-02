export const APP_NAME = "Story-Genius";
export const APP_VERSION = "0.1.0";

export const API_VERSION = "v1";

export const MAX_STORY_LENGTH = 100000; // characters
export const MAX_SCENE_DURATION = 30; // seconds
export const MAX_VIDEO_DURATION = 600; // 10 minutes

export const SUPPORTED_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3"] as const;
export const SUPPORTED_VIDEO_QUALITIES = ["draft", "standard", "high", "ultra", "cinema"] as const;

export const VIDEO_PROVIDERS = {
    RUNWAY: "runway",
    PIKA: "pika",
    KLING: "kling",
    STABLE_VIDEO: "stable-video",
} as const;

export const AUDIO_PROVIDERS = {
    GOOGLE_TTS: "google-tts",
    ELEVENLABS: "elevenlabs",
    SUNO: "suno",
    UDIO: "udio",
} as const;

export const AI_MODELS = {
    GEMINI_PRO: "gemini-1.5-pro",
    GEMINI_FLASH: "gemini-1.5-flash",
    IMAGEN_3: "imagen-3",
} as const;
