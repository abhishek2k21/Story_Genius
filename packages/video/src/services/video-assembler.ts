/**
 * Video Assembler Service
 * Orchestrates the complete video assembly pipeline
 */

import * as ffmpegUtils from "../utils/ffmpeg-utils";
import * as path from "path";
import * as fs from "fs/promises";

export interface SceneClip {
    id: string;
    videoPath: string;
    audioPath?: string;
    duration: number;
    order: number;
}

export interface TransitionConfig {
    type: string;
    duration: number;
}

export interface AudioTrack {
    path: string;
    type: "narration" | "music" | "sfx";
    startTime: number;
    volume: number;
    fadeIn?: number;
    fadeOut?: number;
}

export interface AssemblyProject {
    id: string;
    name: string;
    scenes: SceneClip[];
    transitions: TransitionConfig[];
    audioTracks: AudioTrack[];
    outputPath?: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    error?: string;
}

export interface AssemblyOptions {
    preset?: keyof typeof ffmpegUtils.ENCODING_PRESETS;
    watermarkPath?: string;
    includeThumbnail?: boolean;
}

// In-memory project storage (use database in production)
const projectStorage = new Map<string, AssemblyProject>();

/**
 * Create a new assembly project
 */
export function createProject(
    name: string,
    scenes: SceneClip[],
    transitions?: TransitionConfig[]
): AssemblyProject {
    const project: AssemblyProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        scenes: scenes.sort((a, b) => a.order - b.order),
        transitions: transitions || scenes.slice(1).map(() => ({
            type: "fade",
            duration: 0.5,
        })),
        audioTracks: [],
        status: "pending",
        progress: 0,
    };

    projectStorage.set(project.id, project);
    return project;
}

/**
 * Add audio track to project
 */
export function addAudioTrack(
    projectId: string,
    track: AudioTrack
): AssemblyProject {
    const project = projectStorage.get(projectId);
    if (!project) throw new Error("Project not found");

    project.audioTracks.push(track);
    return project;
}

/**
 * Update transition at index
 */
export function updateTransition(
    projectId: string,
    index: number,
    transition: TransitionConfig
): AssemblyProject {
    const project = projectStorage.get(projectId);
    if (!project) throw new Error("Project not found");

    if (index >= 0 && index < project.transitions.length) {
        project.transitions[index] = transition;
    }
    return project;
}

/**
 * Get project status
 */
export function getProjectStatus(projectId: string): AssemblyProject | null {
    return projectStorage.get(projectId) || null;
}

/**
 * Render the assembled video
 */
export async function renderProject(
    projectId: string,
    outputDir: string,
    options: AssemblyOptions = {}
): Promise<AssemblyProject> {
    const project = projectStorage.get(projectId);
    if (!project) throw new Error("Project not found");

    project.status = "processing";
    project.progress = 0;

    try {
        const preset = ffmpegUtils.ENCODING_PRESETS[options.preset || "web"];
        const tempDir = path.join(outputDir, "temp", project.id);
        await fs.mkdir(tempDir, { recursive: true });

        // Step 1: Validate all scene files exist
        project.progress = 5;
        for (const scene of project.scenes) {
            try {
                await fs.access(scene.videoPath);
            } catch {
                throw new Error(`Scene file not found: ${scene.videoPath}`);
            }
        }

        // Step 2: Scale all scenes to target resolution
        project.progress = 10;
        const scaledScenes: string[] = [];

        for (let i = 0; i < project.scenes.length; i++) {
            const scene = project.scenes[i];
            const scaledPath = path.join(tempDir, `scaled_${i}.mp4`);

            await ffmpegUtils.scaleVideo(
                scene.videoPath,
                scaledPath,
                preset.resolution.width,
                preset.resolution.height
            );

            scaledScenes.push(scaledPath);
            project.progress = 10 + (i / project.scenes.length) * 30;
        }

        // Step 3: Concatenate with transitions
        project.progress = 40;
        const concatenatedPath = path.join(tempDir, "concatenated.mp4");

        await ffmpegUtils.concatenateVideos(
            scaledScenes,
            concatenatedPath,
            project.transitions,
            preset
        );

        project.progress = 70;

        // Step 4: Mix audio tracks
        let finalPath = concatenatedPath;

        if (project.audioTracks.length > 0) {
            finalPath = path.join(tempDir, "with_audio.mp4");
            await mixAudioTracks(concatenatedPath, project.audioTracks, finalPath);
        }

        project.progress = 85;

        // Step 5: Add watermark if specified
        if (options.watermarkPath) {
            const watermarkedPath = path.join(tempDir, "watermarked.mp4");
            await ffmpegUtils.addWatermark(finalPath, options.watermarkPath, watermarkedPath);
            finalPath = watermarkedPath;
        }

        project.progress = 90;

        // Step 6: Move to final output
        const outputPath = path.join(outputDir, `${project.name.replace(/\s+/g, "_")}_${Date.now()}.mp4`);
        await fs.copyFile(finalPath, outputPath);
        project.outputPath = outputPath;

        // Step 7: Generate thumbnail
        if (options.includeThumbnail) {
            const thumbnailPath = outputPath.replace(".mp4", "_thumb.jpg");
            await ffmpegUtils.generateThumbnail(outputPath, thumbnailPath);
        }

        project.progress = 100;
        project.status = "completed";

        // Cleanup temp files
        await fs.rm(tempDir, { recursive: true, force: true });

        return project;

    } catch (error) {
        project.status = "failed";
        project.error = error instanceof Error ? error.message : "Unknown error";
        throw error;
    }
}

/**
 * Mix multiple audio tracks into video
 */
async function mixAudioTracks(
    videoPath: string,
    audioTracks: AudioTrack[],
    outputPath: string
): Promise<void> {
    // This is a simplified implementation
    // In production, would use complex FFmpeg filter graphs

    const ffmpeg = await import("fluent-ffmpeg").then(m => m.default);

    return new Promise((resolve, reject) => {
        let command = ffmpeg(videoPath);

        // Add all audio inputs
        audioTracks.forEach(track => {
            command = command.input(track.path);
        });

        // Build audio mix filter
        const mixParts: string[] = [];

        audioTracks.forEach((track, i) => {
            const inputIndex = i + 1; // 0 is video
            let filter = `[${inputIndex}:a]`;

            // Apply volume
            filter += `volume=${track.volume}`;

            // Apply delay for timing
            if (track.startTime > 0) {
                filter += `,adelay=${track.startTime * 1000}|${track.startTime * 1000}`;
            }

            // Apply fades
            if (track.fadeIn) {
                filter += `,afade=t=in:d=${track.fadeIn}`;
            }
            if (track.fadeOut) {
                filter += `,afade=t=out:d=${track.fadeOut}`;
            }

            filter += `[a${i}]`;
            mixParts.push(filter);
        });

        // Mix all audio tracks together
        const audioLabels = audioTracks.map((_, i) => `[a${i}]`).join("");
        mixParts.push(`[0:a]${audioLabels}amix=inputs=${audioTracks.length + 1}:duration=longest[outa]`);

        command
            .complexFilter(mixParts.join(";"))
            .outputOptions(["-map", "0:v", "-map", "[outa]"])
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}

/**
 * Get estimated render time
 */
export function estimateRenderTime(project: AssemblyProject): number {
    const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);
    // Rough estimate: 10x realtime for encoding
    return totalDuration * 10;
}

/**
 * Cancel a rendering project
 */
export function cancelProject(projectId: string): boolean {
    const project = projectStorage.get(projectId);
    if (!project) return false;

    if (project.status === "processing") {
        project.status = "failed";
        project.error = "Cancelled by user";
        return true;
    }

    return false;
}
