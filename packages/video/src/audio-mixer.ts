import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath.path);

export interface AudioTrack {
    path: string;
    type: "narration" | "music" | "sfx";
    startTime: number; // Offset in seconds
    duration?: number;
    volume?: number; // 0.0 to 1.0 (default 1.0)
}

export interface MixOptions {
    videoPath: string;
    audioTracks: AudioTrack[];
    outputPath: string;
    ducking?: {
        enabled: boolean;
        musicVolume: number; // Volume during speech (e.g., 0.2)
        fadeInDuration: number;
        fadeOutDuration: number;
    };
}

/**
 * Audio Mixer - Handles multi-track mixing and ducking
 */
export class AudioMixer {
    /**
     * Mix audio tracks into video
     */
    async mixAudio(options: MixOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = ffmpeg(options.videoPath);

            // Add audio inputs
            options.audioTracks.forEach((track) => {
                command.input(track.path);
            });

            // Complex Filter Graph construction
            const filterGraph: string[] = [];
            const audioOutputs: string[] = [];

            // Process each audio track
            options.audioTracks.forEach((track, index) => {
                const inputLabel = `${index + 1}:a`;
                const outputLabel = `a${index}`;

                let filters: string[] = [];

                // Delay/Offset
                if (track.startTime > 0) {
                    filters.push(`adelay=${track.startTime * 1000}|${track.startTime * 1000}`);
                }

                // Volume
                if (track.volume !== undefined) {
                    filters.push(`volume=${track.volume}`);
                }

                if (filters.length > 0) {
                    filterGraph.push(`[${inputLabel}]${filters.join(",")}[${outputLabel}]`);
                    audioOutputs.push(`[${outputLabel}]`);
                } else {
                    audioOutputs.push(`[${inputLabel}]`);
                }
            });

            // Mix all tracks (simplified mixing, ducking requires sidechain compression which is complex in generic ffmpeg filter)
            // For MVP, we will just mix them. True auto-ducking is hard without analysis pass.
            // But we can manually lower music volume if we know where narration is.

            // Mixing logic:
            // Inputs: Video Audio (0:a) + Narration + Music + SFX
            // Note: Generated video might happen to have no audio, or silent audio.

            // Assuming video input has no audio we want to keep, or we map it if it does.
            // Let's assume we replace video audio completely for now.

            const mixInputs = audioOutputs.join("");
            filterGraph.push(`${mixInputs}amix=inputs=${options.audioTracks.length}:duration=first[aout]`);

            command
                .complexFilter(filterGraph)
                .outputOptions([
                    "-map 0:v",     // Copy video from input 0
                    "-map [aout]",  // Use mixed audio
                    "-c:v copy",    // Don't re-encode video
                    "-c:a aac",     // Encode audio
                    "-b:a 192k"
                ])
                .output(options.outputPath)
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run();
        });
    }

    /**
     * Advanced: Mix with manual volume automation (simulated ducking)
     * This creates a complex volume filter string based on speech segments
     */
    buildDuckingFilter(musicInput: string, speechSegments: { start: number, end: number }[], lowVol: number, highVol: number): string {
        // volume='if(between(t,0,5),0.2,1.0)' ... chained
        // This is complex to build dynamically. 
        // For MVP, we'll stick to static volume mixing or track-level volume.
        return "";
    }
}

export const audioMixer = new AudioMixer();
