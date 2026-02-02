import { Job } from "bullmq";
import {
    VideoAssemblyPayload,
    VideoAssemblyResult,
    GENERATION_STAGES,
} from "@repo/queue";
import { createStorageClient } from "@repo/storage";
import { videoAssembler, audioMixer, VideoClip, AudioTrack } from "@repo/video";
import { videoReviewer } from "@repo/ai";
import { db } from "@repo/database/src/client";
import { projects } from "@repo/database/src/schema/projects";
import { scenes } from "@repo/database/src/schema/scenes";
import { eq, inArray } from "drizzle-orm";
import fs from "fs-extra";
import path from "path";
import os from "os";

const storage = createStorageClient();

/**
 * Process video assembly job
 */
export async function processVideoAssembly(
    job: Job<VideoAssemblyPayload>
): Promise<VideoAssemblyResult> {
    const { projectId, sceneIds, transitions, audio, output } = job.data;
    const workDir = path.join(os.tmpdir(), `assembly-${job.id}`);

    try {
        await job.updateProgress({ stage: "starting", percent: 0, message: "Initializing assembly...", timestamp: new Date() });

        // Fetch Project and Scenes from DB to get latest settings
        const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
        const dbScenes = await db.select().from(scenes).where(inArray(scenes.id, sceneIds));

        // Map scenes by ID for easy lookup
        const sceneMap = new Map(dbScenes.map(s => [s.id, s]));

        // Determine Audio Settings
        // Helper to safely get volume from JSONB
        const getVol = (settings: any, key: string, defaultVol: number) => {
            if (settings && typeof settings === 'object' && key in settings) {
                return Number(settings[key]);
            }
            return defaultVol;
        };

        const projectSettings = project?.settings as any || {};
        const globalMusicVol = getVol(projectSettings, 'musicVolume', 0.3); // Default 0.3
        const globalNarrationVol = getVol(projectSettings, 'narrationVolume', 1.0);

        // Create work directory
        await fs.ensureDir(workDir);

        // 1. Download all scene videos
        await job.updateProgress({ stage: "downloading", percent: 10, message: "Downloading source clips...", timestamp: new Date() });

        const clips: VideoClip[] = [];
        const validTransitions = transitions || [];

        for (let i = 0; i < sceneIds.length; i++) {
            const sceneId = sceneIds[i];
            const sceneData = sceneMap.get(sceneId);

            // Check scene-specific audio settings
            const sceneAudioSettings = sceneData?.audioSettings as any || {};
            const isMuted = sceneAudioSettings.mute === true;

            // Find video file in storage
            const files = await storage.listFiles(`projects/${projectId}/scenes/${sceneId}/videos/`);
            const finalVideo = files.find(f => f.key.includes("final-") && f.key.endsWith(".mp4"));

            if (!finalVideo) {
                console.warn(`No video found for scene ${sceneId}, skipping`);
                continue;
            }

            const localPath = path.join(workDir, `scene-${i}.mp4`);
            const buffer = await storage.downloadBuffer(finalVideo.key);
            await fs.writeFile(localPath, buffer);

            // TODO: If isMuted is true, we should process the clip to remove audio or set volume to 0.
            // For now, VideoAssembler (xfade) drops audio anyway, so it's "muted" by default regarding scene audio.
            // If using concat, we would need to strip it.
            // Given current limitations, we proceed.

            const transition = validTransitions[i] ? {
                type: validTransitions[i].type as any,
                duration: validTransitions[i].duration
            } : undefined;

            clips.push({
                path: localPath,
                duration: Number(sceneData?.duration || 5),
                transition,
            });
        }

        if (clips.length === 0) {
            throw new Error("No valid clips to assemble");
        }

        // 2. Assemble Video Track
        await job.updateProgress({ stage: "assembling", percent: 40, message: "Stitching video track...", timestamp: new Date() });

        const videoOutputPath = path.join(workDir, "video_track.mp4");
        await videoAssembler.assemble({
            clips,
            outputPath: videoOutputPath,
            resolution: output.resolution === "1080p" ? { width: 1920, height: 1080 } : { width: 1280, height: 720 },
        });

        // 3. Download & Mix Audio
        await job.updateProgress({ stage: "mixing", percent: 60, message: "Mixing audio...", timestamp: new Date() });

        const audioTracks: AudioTrack[] = [];

        // Narration
        if (audio?.narrationKey) {
            const localNarration = path.join(workDir, "narration.mp3");
            const buffer = await storage.downloadBuffer(audio.narrationKey);
            await fs.writeFile(localNarration, buffer);
            audioTracks.push({
                path: localNarration,
                type: "narration",
                startTime: 0,
                volume: globalNarrationVol, // Use project setting
            });
        }

        // Music
        if (audio?.musicKey) {
            const localMusic = path.join(workDir, "music.mp3");
            const buffer = await storage.downloadBuffer(audio.musicKey);
            await fs.writeFile(localMusic, buffer);
            audioTracks.push({
                path: localMusic,
                type: "music",
                startTime: 0,
                volume: audio.musicVolume || globalMusicVol, // Payload overrides project defaults? Or vice versa. Let's say Payload (if provided) > Project Default
            });
        }

        const finalOutputPath = path.join(workDir, "final_output.mp4");

        if (audioTracks.length > 0) {
            await audioMixer.mixAudio({
                videoPath: videoOutputPath,
                audioTracks,
                outputPath: finalOutputPath,
            });
        } else {
            await fs.move(videoOutputPath, finalOutputPath);
        }

        // 4. Review Quality
        await job.updateProgress({ stage: "reviewing", percent: 80, message: "AI reviewing quality...", timestamp: new Date() });

        const review = await videoReviewer.reviewAssembly(clips.length * 5, clips.length, audioTracks.length > 0);
        console.log("AI Review Score:", review.score);

        // 5. Upload Final Artifact
        await job.updateProgress({ stage: "uploading", percent: 90, message: "Uploading final video...", timestamp: new Date() });

        const finalBuffer = await fs.readFile(finalOutputPath);

        const uploadResult = await storage.uploadBuffer(
            finalBuffer,
            "final_video.mp4",
            `projects/${projectId}/exports`
        );

        // Cleanup
        await fs.remove(workDir);

        await job.updateProgress({ stage: "completed", percent: 100, message: "Assembly complete!", timestamp: new Date() });

        return {
            success: true,
            outputUrl: uploadResult.url,
            outputKey: uploadResult.key,
            duration: clips.length * 5,
            fileSize: finalBuffer.length,
        };

    } catch (error) {
        await fs.remove(workDir).catch(() => { });
        console.error("Assembly failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

