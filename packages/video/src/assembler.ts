import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

ffmpeg.setFfmpegPath(ffmpegPath.path);

export interface VideoClip {
    path: string;
    duration: number;
    transition?: {
        type: "fade" | "dissolve" | "wipeleft" | "wiperight" | "slideleft" | "slideright" | "circleopen" | "circleclose" | "pixelize";
        duration: number; // usually 0.5 to 1.0s
    };
}

export interface AssemblyOptions {
    clips: VideoClip[];
    outputPath: string;
    resolution?: { width: number; height: number }; // Defaults to 1280x720
}

/**
 * Video Assembler - Stitches clips with transitions
 */
export class VideoAssembler {
    /**
     * Assemble video clips with transitions using XFADE filter
     * This is complex as it requires offset calculation for each clip
     */
    async assemble(options: AssemblyOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            if (options.clips.length === 0) {
                return reject(new Error("No clips to assemble"));
            }

            const command = ffmpeg();

            // Add all inputs
            options.clips.forEach((clip) => {
                command.input(clip.path);
            });

            // If only one clip, just transcode/copy
            if (options.clips.length === 1) {
                command
                    .outputOptions(["-c:v libx264", "-c:a aac"])
                    .output(options.outputPath)
                    .on("end", () => resolve())
                    .on("error", (err) => reject(err))
                    .run();
                return;
            }

            // Build xfade filter graph
            // Logic:
            // [0][1]xfade=transition=fade:duration=1:offset=4[v1];
            // [v1][2]xfade=transition=fade:duration=1:offset=8[v2];

            const filterGraph: string[] = [];
            let currentOffset = 0;
            let lastOutputLabel = "0";

            // We need to rescale all inputs to same resolution first to avoid xfade errors
            // Add scale filters for each input
            const width = options.resolution?.width || 1280;
            const height = options.resolution?.height || 720;

            const scaledInputs: string[] = [];

            // Add scale filters
            options.clips.forEach((clip, index) => {
                const inputLabel = `${index}:v`;
                const scaledLabel = `s${index}`;
                filterGraph.push(`[${inputLabel}]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[${scaledLabel}]`);
                scaledInputs.push(`[${scaledLabel}]`);
            });

            // Start chaining xfades
            lastOutputLabel = scaledInputs[0];
            currentOffset = options.clips[0].duration;

            for (let i = 1; i < options.clips.length; i++) {
                const clip = options.clips[i];
                const prevClip = options.clips[i - 1];
                const transition = prevClip.transition || { type: "fade", duration: 0.5 }; // Default transition

                const nextInputLabel = scaledInputs[i];
                const outputLabel = i === options.clips.length - 1 ? "outv" : `v${i}`;

                // Offset calculation: Start of this transition = Sum of previous durations - sum of previous transition durations/overlaps
                // Xfade overlap means the video shrinks. 
                // Actual offset = Current Total Length - Transition Duration

                const offset = currentOffset - transition.duration;

                filterGraph.push(
                    `${lastOutputLabel}${nextInputLabel}xfade=transition=${transition.type}:duration=${transition.duration}:offset=${offset}${i === options.clips.length - 1 ? ",format=yuv420p" : ""}[${outputLabel}]`
                );

                lastOutputLabel = `[${outputLabel}]`;

                // Update offset for next iteration
                // Content added = clip.duration - transition.duration (overlap)
                currentOffset += (clip.duration - transition.duration);
            }

            command
                .complexFilter(filterGraph)
                .outputOptions([
                    "-map [outv]",  // Map final video output
                    "-c:v libx264",
                    "-preset fast",
                    "-crf 23"
                    // Note: Audio is lost in xfade usually unless we mix it separately. 
                    // This assembler handles VIDEO ONLY. Audio mixing should happen afterwards or in parallel track.
                ])
                .output(options.outputPath)
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run();
        });
    }

    /**
     * Simple concatenation (no transitions) - Faster and safer fallback
     */
    async concat(options: AssemblyOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = ffmpeg();

            options.clips.forEach(clip => command.input(clip.path));

            command
                .on("error", reject)
                .on("end", resolve)
                .mergeToFile(options.outputPath, tmpdir());
        });
    }
}

export const videoAssembler = new VideoAssembler();
