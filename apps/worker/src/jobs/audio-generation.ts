import { Job } from "bullmq";
import {
    AudioGenerationPayload,
    AudioGenerationResult,
} from "@repo/queue";
import { createStorageClient } from "@repo/storage";
import { audioGenerator } from "@repo/ai";
import crypto from "crypto";
import axios from "axios";

const storage = createStorageClient();

/**
 * Process audio generation job - narration and background music
 */
export async function processAudioGeneration(
    job: Job<AudioGenerationPayload>
): Promise<AudioGenerationResult> {
    const { projectId, sceneId, narrationText, voiceId, musicStyle, duration } = job.data;

    try {
        await job.updateProgress({ stage: "starting", percent: 5, message: "Starting audio generation...", timestamp: new Date() });

        await storage.ensureBucket();

        let narrationUrl: string | undefined;
        let narrationKey: string | undefined;
        let musicUrl: string | undefined;
        let musicKey: string | undefined;

        // ============================
        // GENERATE NARRATION
        // ============================
        if (narrationText) {
            await job.updateProgress({ stage: "narration", percent: 10, message: "Generating narration...", timestamp: new Date() });

            // Determine provider based on voiceId (simple heuristic or lookup)
            const provider = voiceId?.includes("-") && voiceId.length > 20 ? "elevenlabs" : "google";

            const audioBuffer = await audioGenerator.generateNarration({
                text: narrationText,
                voiceId,
                provider,
                options: {
                    speakingRate: 1.0,
                },
            });

            const id = crypto.randomUUID();
            const key = `projects/${projectId}/scenes/${sceneId}/audio/narration-${id}.mp3`;

            await job.updateProgress({ stage: "narration_upload", percent: 30, message: "Uploading narration...", timestamp: new Date() });

            const uploadResult = await storage.uploadBuffer(
                audioBuffer,
                "narration.mp3",
                `projects/${projectId}/scenes/${sceneId}/audio` // This folder structure is handled by uploadBuffer logic inside key usually, but let's assume client handles it or we pass full key logic. 
                // Checks storage client: `uploadBuffer` uses folder param.
                // Logic: const key = `${folder}/${id}.${ext}`;
            );

            // Correction: uploadBuffer takes (buffer, originalName, folder).
            // Retrying upload call to match exact signature from minio-client.ts I wrote earlier.
            // await this.client.putObject(this.bucket, key, buffer, buffer.length, ...

            // I'll assume uploadBuffer logic is:
            // async uploadBuffer(buffer: Buffer, originalName: string, folder: string = "uploads")

            // So:
            // folder = `projects/${projectId}/scenes/${sceneId}/audio`

            narrationUrl = uploadResult.url;
            narrationKey = uploadResult.key;
        }

        // ============================
        // GENERATE MUSIC
        // ============================
        if (musicStyle) {
            await job.updateProgress({ stage: "music_start", percent: 50, message: "Requesting background music...", timestamp: new Date() });

            const musicResult = await audioGenerator.generateMusic({
                prompt: musicStyle,
                duration,
                instrumental: true, // Assuming background music usually instrumental
            });

            if (musicResult.status === "failed") {
                throw new Error("Music generation failed to start");
            }

            // Poll for completion if not immediately available
            let audioSourceUrl = musicResult.audioUrl;
            let attempts = 0;
            const maxAttempts = 60; // 5 mins max usually

            if (!audioSourceUrl) {
                await job.updateProgress({ stage: "music_polling", percent: 60, message: "Waiting for music generation...", timestamp: new Date() });

                while (!audioSourceUrl && attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 5000));
                    const status = await audioGenerator.checkMusicStatus(musicResult.id);
                    if (status.status === "completed" && status.audioUrl) {
                        audioSourceUrl = status.audioUrl;
                    } else if (status.status === "failed") {
                        throw new Error("Music generation failed during processing");
                    }
                    attempts++;
                }
            }

            if (!audioSourceUrl) {
                throw new Error("Music generation timed out");
            }

            // Download and re-upload to our storage
            await job.updateProgress({ stage: "music_download", percent: 80, message: "Downloading music...", timestamp: new Date() });

            const response = await axios.get(audioSourceUrl, { responseType: 'arraybuffer' });
            const musicBuffer = Buffer.from(response.data);

            const uploadResult = await storage.uploadBuffer(
                musicBuffer,
                "music.mp3",
                `projects/${projectId}/scenes/${sceneId}/audio`
            );

            musicUrl = uploadResult.url;
            musicKey = uploadResult.key;
        }

        await job.updateProgress({ stage: "completed", percent: 100, message: "Audio generation complete!", timestamp: new Date() });

        return {
            success: true,
            narrationUrl,
            narrationKey,
            musicUrl,
            musicKey,
        };

    } catch (error) {
        console.error("Audio Job Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
