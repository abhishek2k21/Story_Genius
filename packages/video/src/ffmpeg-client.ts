import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

export interface VideoInfo {
    format: string;
    duration: number;
    size: number;
    width: number;
    height: number;
}

export interface TranscodeOptions {
    input: string;
    output: string;
    width?: number;
    height?: number;
    fps?: number;
    crf?: number; // Quality (18-28)
    preset?: "generic" | "youtube" | "tiktok" | "instagram";
}

/**
 * FFmpeg Client Wrapper
 */
export class FFmpegClient {
    /**
     * Get video metadata
     */
    async getVideoInfo(path: string): Promise<VideoInfo> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(path, (err, metadata) => {
                if (err) return reject(err);

                const stream = metadata.streams.find((s) => s.codec_type === "video");
                const format = metadata.format;

                if (!stream || !format) return reject(new Error("Invalid video file"));

                resolve({
                    format: format.format_name || "unknown",
                    duration: format.duration || 0,
                    size: format.size || 0,
                    width: stream.width || 0,
                    height: stream.height || 0,
                });
            });
        });
    }

    /**
     * Transcode video to standard format (H.264 MP4)
     */
    async transcode(options: TranscodeOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            let crf = options.crf || 23;

            // Adjust settings based on preset
            if (options.preset === "youtube" || options.preset === "tiktok" || options.preset === "instagram") {
                crf = 18; // Higher quality for social platforms
            }

            let command = ffmpeg(options.input)
                .outputOptions([
                    "-c:v libx264",
                    "-pix_fmt yuv420p",
                    "-movflags +faststart",
                    `-crf ${crf}`,
                    "-preset fast", // Encoding speed
                ])
                .output(options.output);

            if (options.width && options.height) {
                command = command.size(`${options.width}x${options.height}`);
            }

            if (options.fps) {
                command = command.fps(options.fps);
            }

            command
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run();
        });
    }

    /**
     * Extract audio from video
     */
    async extractAudio(videoPath: string, audioPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .output(audioPath)
                .noVideo()
                .audioCodec("libmp3lame")
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run();
        });
    }

    /**
     * Generate thumbnail
     */
    async generateThumbnail(videoPath: string, imagePath: string, time: string = "00:00:01"): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [time],
                    filename: imagePath.split("/").pop() || "thumb.jpg",
                    folder: imagePath.split("/").slice(0, -1).join("/"),
                })
                .on("end", () => resolve())
                .on("error", (err) => reject(err));
        });
    }

    /**
     * Create blank video (for padding or intro)
     */
    async createBlankVideo(outputPath: string, duration: number, color: string = "black", width: number = 1280, height: number = 720): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(`color=c=${color}:s=${width}x${height}:d=${duration}`)
                .inputFormat("lavfi")
                .output(outputPath)
                .outputOptions(["-c:v libx264", "-pix_fmt yuv420p"])
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run();
        });
    }

    /**
     * Create blank audio (silence)
     */
    async createBlankAudio(outputPath: string, duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(`anullsrc=r=44100:cl=stereo`)
                .inputFormat("lavfi")
                .output(outputPath)
                .duration(duration)
                .audioCodec("libmp3lame")
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run();
        });
    }
}

export const ffmpegClient = new FFmpegClient();
