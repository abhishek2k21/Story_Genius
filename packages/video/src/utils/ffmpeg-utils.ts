/**
 * FFmpeg Utility Functions
 * Low-level FFmpeg command builders
 */

import ffmpeg from "fluent-ffmpeg";
import * as path from "path";

export interface VideoInfo {
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
}

export interface EncodingPreset {
    name: string;
    videoBitrate: string;
    audioBitrate: string;
    resolution: { width: number; height: number };
    fps: number;
    codec: string;
}

export const ENCODING_PRESETS: Record<string, EncodingPreset> = {
    web: {
        name: "Web (1080p)",
        videoBitrate: "5000k",
        audioBitrate: "192k",
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        codec: "libx264",
    },
    "4k": {
        name: "4K Ultra HD",
        videoBitrate: "20000k",
        audioBitrate: "320k",
        resolution: { width: 3840, height: 2160 },
        fps: 30,
        codec: "libx264",
    },
    social: {
        name: "Social Media",
        videoBitrate: "3000k",
        audioBitrate: "128k",
        resolution: { width: 1080, height: 1920 }, // Vertical
        fps: 30,
        codec: "libx264",
    },
    draft: {
        name: "Draft Preview",
        videoBitrate: "1500k",
        audioBitrate: "96k",
        resolution: { width: 1280, height: 720 },
        fps: 24,
        codec: "libx264",
    },
};

/**
 * Get video information using FFprobe
 */
export function getVideoInfo(inputPath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }

            const videoStream = metadata.streams.find(s => s.codec_type === "video");
            if (!videoStream) {
                reject(new Error("No video stream found"));
                return;
            }

            resolve({
                duration: metadata.format.duration || 0,
                width: videoStream.width || 0,
                height: videoStream.height || 0,
                fps: eval(videoStream.r_frame_rate || "30"),
                codec: videoStream.codec_name || "unknown",
                bitrate: parseInt(metadata.format.bit_rate || "0"),
            });
        });
    });
}

/**
 * Concatenate multiple videos with transitions
 */
export function concatenateVideos(
    inputs: string[],
    output: string,
    transitions: Array<{ type: string; duration: number }>,
    preset: EncodingPreset = ENCODING_PRESETS.web
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (inputs.length === 0) {
            reject(new Error("No input videos provided"));
            return;
        }

        if (inputs.length === 1) {
            // Just copy if single input
            ffmpeg(inputs[0])
                .output(output)
                .on("end", () => resolve())
                .on("error", reject)
                .run();
            return;
        }

        // Build complex filter for multiple inputs with transitions
        let command = ffmpeg();

        // Add all inputs
        inputs.forEach(input => {
            command = command.input(input);
        });

        // Build xfade filter chain
        const filterParts: string[] = [];
        let prevLabel = "[0:v]";

        for (let i = 1; i < inputs.length; i++) {
            const transition = transitions[i - 1] || { type: "fade", duration: 0.5 };
            const outputLabel = i === inputs.length - 1 ? "[outv]" : `[v${i}]`;

            filterParts.push(
                `${prevLabel}[${i}:v]xfade=transition=${transition.type}:duration=${transition.duration}:offset=auto${outputLabel}`
            );
            prevLabel = outputLabel;
        }

        // Audio concat
        const audioInputs = inputs.map((_, i) => `[${i}:a]`).join("");
        filterParts.push(`${audioInputs}concat=n=${inputs.length}:v=0:a=1[outa]`);

        command
            .complexFilter(filterParts.join(";"))
            .outputOptions([
                "-map", "[outv]",
                "-map", "[outa]",
                "-c:v", preset.codec,
                "-b:v", preset.videoBitrate,
                "-c:a", "aac",
                "-b:a", preset.audioBitrate,
                "-r", String(preset.fps),
            ])
            .output(output)
            .on("end", () => resolve())
            .on("error", reject)
            .on("progress", (progress) => {
                console.log(`Encoding: ${progress.percent?.toFixed(1)}%`);
            })
            .run();
    });
}

/**
 * Apply transition between two videos
 */
export function applyTransition(
    video1: string,
    video2: string,
    output: string,
    transitionType: string,
    duration: number = 0.5
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(video1)
            .input(video2)
            .complexFilter([
                `[0:v][1:v]xfade=transition=${transitionType}:duration=${duration}:offset=auto[v]`,
                `[0:a][1:a]acrossfade=d=${duration}[a]`,
            ])
            .outputOptions(["-map", "[v]", "-map", "[a]"])
            .output(output)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}

/**
 * Scale video to target resolution
 */
export function scaleVideo(
    input: string,
    output: string,
    width: number,
    height: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .videoFilter(`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`)
            .output(output)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}

/**
 * Extract audio from video
 */
export function extractAudio(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .noVideo()
            .audioCodec("aac")
            .output(output)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}

/**
 * Generate thumbnail from video
 */
export function generateThumbnail(
    input: string,
    output: string,
    timestamp: string = "00:00:01"
): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .screenshots({
                timestamps: [timestamp],
                filename: path.basename(output),
                folder: path.dirname(output),
            })
            .on("end", () => resolve())
            .on("error", reject);
    });
}

/**
 * Add watermark to video
 */
export function addWatermark(
    input: string,
    watermark: string,
    output: string,
    position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" = "bottomRight"
): Promise<void> {
    const positions = {
        topLeft: "10:10",
        topRight: "main_w-overlay_w-10:10",
        bottomLeft: "10:main_h-overlay_h-10",
        bottomRight: "main_w-overlay_w-10:main_h-overlay_h-10",
    };

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(input)
            .input(watermark)
            .complexFilter([
                `[0:v][1:v]overlay=${positions[position]}[v]`,
            ])
            .outputOptions(["-map", "[v]", "-map", "0:a"])
            .output(output)
            .on("end", () => resolve())
            .on("error", reject)
            .run();
    });
}
